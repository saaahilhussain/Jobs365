import { ScrapeRun } from "../models/scrapeRun.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { apifyService } from "./apify.service.js";

const userTokenCache = new Map(); // userId → token (cleared at sync end)

const resolveUserToken = async (userId) => {
  if (!userId) return process.env.APIFY_TOKEN || "";
  const cached = userTokenCache.get(String(userId));
  if (cached !== undefined) return cached;
  const user = await User.findById(userId).lean();
  const token = user?.apifyToken || process.env.APIFY_TOKEN || "";
  userTokenCache.set(String(userId), token);
  return token;
};

const enforceRunBudgetIfNeeded = async (run, apifyToken) => {
  if (!run?.apifyRunId || !run?.runBudgetSecs) return false;
  if (!["pending", "running"].includes(run.status)) return false;

  const startedAtMs = run.startedAt
    ? new Date(run.startedAt).getTime()
    : Date.now();
  const elapsedSecs = (Date.now() - startedAtMs) / 1000;
  if (elapsedSecs < run.runBudgetSecs) return false;

  await apifyService.abortRun({ apifyToken, runId: run.apifyRunId });
  await ScrapeRun.updateOne(
    { _id: run._id },
    {
      status: "completed",
      stopReason: "budget",
      finishedAt: new Date(),
    },
  );
  return true;
};

const syncRun = async (run, apifyToken) => {
  const budgetStopped = await enforceRunBudgetIfNeeded(run, apifyToken);
  if (budgetStopped) return { jobsImported: 0, budgetStopped: true };

  const { status, finishedAt } = await apifyService.checkRunStatus({
    apifyToken,
    runId: run.apifyRunId,
  });

  const currentSyncedItems = Number(run.syncedItems || 0);
  const jobs = await apifyService.fetchDatasetItems({
    apifyToken,
    datasetId: run.datasetId,
    offset: currentSyncedItems,
    actorKey: run.actorKey,
  });

  if (jobs.length > 0) {
    const jobsToInsert = jobs.map((job) => ({
      ...job,
      userId: run.userId,
      scrapeRunId: run._id,
      apifyRunId: run.apifyRunId,
    }));

    await Job.insertMany(jobsToInsert, { ordered: false }).catch(() => {
      // Ignore duplicate key errors (Quick win D: unique index on { userId, url })
    });
  }

  const nextSyncedItems = currentSyncedItems + jobs.length;
  const baseUpdate = {
    jobsFetched: nextSyncedItems,
    syncedItems: nextSyncedItems,
  };

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

  return { jobsImported: jobs.length };
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
