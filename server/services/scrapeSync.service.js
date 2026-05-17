import { ScrapeRun } from "../models/scrapeRun.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { apifyService } from "./apify.service.js";

const userTokenCache = new Map(); // userId → token (cleared at sync end)

const resolveUserToken = async (userId) => {
  if (!userId) return "";
  const cached = userTokenCache.get(String(userId));
  if (cached !== undefined) return cached;
  const user = await User.findById(userId).lean();
  const token = user?.apifyToken || "";
  userTokenCache.set(String(userId), token);
  return token;
};

const isRunBudgetExceeded = (run) => {
  if (!run?.apifyRunId || !run?.runBudgetSecs) return false;
  if (!["pending", "running"].includes(run.status)) return false;
  const startedAtMs = run.startedAt
    ? new Date(run.startedAt).getTime()
    : Date.now();
  const elapsedSecs = (Date.now() - startedAtMs) / 1000;
  return elapsedSecs >= run.runBudgetSecs;
};

const insertJobsAndCount = async (jobs, run) => {
  if (jobs.length === 0) return { insertedCount: 0, duplicateCount: 0 };

  const jobsToInsert = jobs.map((job) => ({
    ...job,
    userId: run.userId,
    scrapeRunId: run._id,
    apifyRunId: run.apifyRunId,
  }));

  try {
    const result = await Job.insertMany(jobsToInsert, {
      ordered: false,
      rawResult: true,
    });
    return {
      insertedCount: result?.insertedCount ?? jobs.length,
      duplicateCount: 0,
    };
  } catch (err) {
    // BulkWriteError shape: err.code === 11000 (duplicate), err.writeErrors[]
    const writeErrors = Array.isArray(err?.writeErrors) ? err.writeErrors : [];
    const duplicateCount = writeErrors.filter(
      (e) => e?.err?.code === 11000 || e?.code === 11000,
    ).length;
    const otherErrors = writeErrors.filter(
      (e) => e?.err?.code !== 11000 && e?.code !== 11000,
    );
    const insertedCount = err?.result?.nInserted ?? err?.insertedCount ?? 0;

    if (otherErrors.length > 0) {
      console.warn(
        `Run ${run._id}: insertMany had ${otherErrors.length} non-duplicate errors`,
        otherErrors[0]?.errmsg || otherErrors[0]?.err?.errmsg || otherErrors[0],
      );
    }
    return { insertedCount, duplicateCount };
  }
};

const syncRun = async (run, apifyToken) => {
  // checkRunStatus first — its endpoint is immediately available after a run
  // starts, so a 404 here reliably means "run gone" and syncAllPending's
  // 404 → deleteOne branch is correct. Putting fetchDatasetItems before this
  // was wrong: that endpoint can transiently 404 on a brand-new dataset,
  // which caused valid runs to be deleted.
  const { status, finishedAt } = await apifyService.checkRunStatus({
    apifyToken,
    runId: run.apifyRunId,
  });

  // Drain dataset BEFORE any budget/status finalization so late-arriving
  // items aren't stranded when the run is aborted on budget.
  const currentSyncedItems = Number(run.syncedItems || 0);
  const jobs = await apifyService.fetchDatasetItems({
    apifyToken,
    datasetId: run.datasetId,
    offset: currentSyncedItems,
    actorKey: run.actorKey,
    query: run.query,
  });

  const { insertedCount, duplicateCount } = await insertJobsAndCount(jobs, run);

  if (jobs.length > 0) {
    console.log(
      `Run ${run.apifyRunId}: fetched=${jobs.length} inserted=${insertedCount} duplicates=${duplicateCount}`,
    );
  }

  // Advance the offset by what Apify returned (including duplicates) so we
  // don't refetch the same items on the next tick. Real DB inserts are
  // reflected in jobsFetched.
  const nextSyncedItems = currentSyncedItems + jobs.length;
  const nextJobsFetched = Number(run.jobsFetched || 0) + insertedCount;
  const baseUpdate = {
    jobsFetched: nextJobsFetched,
    syncedItems: nextSyncedItems,
  };

  if (isRunBudgetExceeded(run)) {
    // Abort on Apify side, then mark completed with budget reason.
    try {
      await apifyService.abortRun({ apifyToken, runId: run.apifyRunId });
    } catch (err) {
      console.warn(
        `Run ${run.apifyRunId}: abortRun on budget exceeded failed:`,
        err.message,
      );
    }
    await run.updateOne({
      ...baseUpdate,
      status: "completed",
      stopReason: "budget",
      finishedAt: new Date(),
    });
    return { jobsImported: insertedCount, budgetStopped: true };
  }

  if (status === "SUCCEEDED") {
    await run.updateOne({
      ...baseUpdate,
      status: "completed",
      finishedAt: new Date(finishedAt || new Date()),
    });
  } else if (status === "FAILED" || status === "TIMED-OUT") {
    await run.updateOne({
      ...baseUpdate,
      status: "failed",
      finishedAt: new Date(finishedAt || new Date()),
    });
  } else if (status === "ABORTED") {
    await run.updateOne({
      ...baseUpdate,
      status: "paused",
      finishedAt: new Date(finishedAt || new Date()),
      stopReason: run.stopReason || "manual",
    });
  } else {
    await run.updateOne({ ...baseUpdate, status: "running" });
  }

  return { jobsImported: insertedCount };
};

export const scrapeSyncService = {
  syncRun,

  syncAllPending: async ({ userId } = {}) => {
    const filter = { status: { $in: ["pending", "running"] } };
    if (userId) filter.userId = userId;

    const pendingRuns = await ScrapeRun.find(filter);

    let syncedCount = 0;
    let jobsImported = 0;
    let deletedCount = 0;

    userTokenCache.clear();

    for (const run of pendingRuns) {
      try {
        if (!run.apifyRunId) {
          await ScrapeRun.deleteOne({ _id: run._id });
          deletedCount++;
          continue;
        }

        const apifyToken = await resolveUserToken(run.userId);
        if (!apifyToken) {
          console.warn(`Run ${run._id}: skipping sync, user has no Apify token`);
          continue;
        }
        const result = await syncRun(run, apifyToken);
        if (result.budgetStopped) continue;

        syncedCount++;
        jobsImported += result.jobsImported;
        console.log(
          `Synced run ${run.apifyRunId}: ${result.jobsImported} jobs`,
        );
      } catch (error) {
        console.error(
          `Failed to sync run ${run.apifyRunId}:`,
          error.message,
        );
        if (error.response?.status === 404) {
          await ScrapeRun.deleteOne({ _id: run._id });
          continue;
        }
        await run.updateOne({ status: "failed", finishedAt: new Date() });
      }
    }

    userTokenCache.clear();

    return {
      runsChecked: pendingRuns.length,
      runsSynced: syncedCount,
      runsDeleted: deletedCount,
      jobsImported,
    };
  },
};
