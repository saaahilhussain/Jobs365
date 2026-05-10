import cron from "node-cron";
import { ScrapeRun } from "../models/scrapeRun.model.js";
import { Job } from "../models/job.model.js";
import { apifyService } from "../services/apify.service.js";

const enforceRunBudgetIfNeeded = async (run) => {
  if (!run?.apifyRunId || !run?.runBudgetSecs) return false;

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

const syncPendingRuns = async () => {
  try {
    // Find all pending or running scrape runs
    const pendingRuns = await ScrapeRun.find({
      status: { $in: ["pending", "running"] },
      apifyRunId: { $exists: true, $ne: null },
    });

    if (pendingRuns.length === 0) return;

    console.log(`Checking ${pendingRuns.length} pending Apify runs...`);

    for (const run of pendingRuns) {
      try {
        const budgetStopped = await enforceRunBudgetIfNeeded(run);
        if (budgetStopped) {
          continue;
        }

        // Check run status
        const { status, finishedAt } = await apifyService.checkRunStatus(
          run.apifyRunId,
        );

        const currentSyncedItems = Number(run.syncedItems || 0);
        const jobs = await apifyService.fetchDatasetItems(run.datasetId, {
          offset: currentSyncedItems,
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

        console.log(`✓ Synced run ${run.apifyRunId}: ${jobs.length} jobs`);
      } catch (error) {
        console.error(`✗ Failed to sync run ${run.apifyRunId}:`, error.message);
      }
    }
  } catch (error) {
    console.error("Cron sync error:", error.message);
  }
};

export const registerScrapeJobsCron = () => {
  // Sync pending runs every 10 seconds
  return cron.schedule("*/10 * * * * *", syncPendingRuns);
};
