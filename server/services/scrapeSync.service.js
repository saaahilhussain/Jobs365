import { ScrapeRun } from "../models/scrapeRun.model.js";
import { Job } from "../models/job.model.js";
import { apifyService } from "./apify.service.js";

const enforceRunBudgetIfNeeded = async (run) => {
  if (!run?.apifyRunId || !run?.runBudgetSecs) return false;
  if (!["pending", "running"].includes(run.status)) return false;

  const startedAtMs = run.startedAt
    ? new Date(run.startedAt).getTime()
    : Date.now();
  const elapsedSecs = (Date.now() - startedAtMs) / 1000;
  if (elapsedSecs < run.runBudgetSecs) return false;

  await apifyService.abortRun(run.apifyRunId);
  // Budget expiry = natural completion, NOT a user-initiated pause
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

const syncRun = async (run) => {
  const budgetStopped = await enforceRunBudgetIfNeeded(run);
  if (budgetStopped) {
    return { jobsImported: 0, budgetStopped: true };
  }

  const { status, finishedAt } = await apifyService.checkRunStatus(
    run.apifyRunId,
  );

  const currentSyncedItems = Number(run.syncedItems || 0);
  const jobs = await apifyService.fetchDatasetItems(run.datasetId, {
    offset: currentSyncedItems,
    actorKey: run.actorKey,
  });

  if (jobs.length > 0) {
    const jobsToInsert = jobs.map((job) => ({
      ...job,
      scrapeRunId: run._id,
      apifyRunId: run.apifyRunId,
    }));

    await Job.insertMany(jobsToInsert, { ordered: false }).catch(() => {
      // Ignore duplicate key errors
    });
  }

  const nextSyncedItems = currentSyncedItems + jobs.length;

  if (status === "SUCCEEDED") {
    await run.updateOne({
      status: "completed",
      jobsFetched: nextSyncedItems,
      syncedItems: nextSyncedItems,
      finishedAt: new Date(finishedAt || new Date()),
    });
  } else if (status === "FAILED" || status === "TIMED-OUT") {
    await run.updateOne({
      status: "failed",
      jobsFetched: nextSyncedItems,
      syncedItems: nextSyncedItems,
      finishedAt: new Date(finishedAt || new Date()),
    });
  } else if (status === "ABORTED") {
    await run.updateOne({
      status: "paused",
      jobsFetched: nextSyncedItems,
      syncedItems: nextSyncedItems,
      finishedAt: new Date(finishedAt || new Date()),
      stopReason: run.stopReason || "manual",
    });
  } else {
    await run.updateOne({
      status: "running",
      jobsFetched: nextSyncedItems,
      syncedItems: nextSyncedItems,
    });
  }

  return { jobsImported: jobs.length };
};

export const scrapeSyncService = {
  syncRun,

  syncAllPending: async () => {
    const pendingRuns = await ScrapeRun.find({
      status: { $in: ["pending", "running"] },
    });

    let syncedCount = 0;
    let jobsImported = 0;
    let deletedCount = 0;

    for (const run of pendingRuns) {
      try {
        if (!run.apifyRunId) {
          await ScrapeRun.deleteOne({ _id: run._id });
          deletedCount++;
          continue;
        }

        const result = await syncRun(run);
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

        await run.updateOne({
          status: "failed",
          finishedAt: new Date(),
        });
      }
    }

    return {
      runsChecked: pendingRuns.length,
      runsSynced: syncedCount,
      runsDeleted: deletedCount,
      jobsImported,
    };
  },
};
