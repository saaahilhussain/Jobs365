import { apifyService } from "../services/apify.service.js";
import { ScrapeRun } from "../models/scrapeRun.model.js";
import { Job } from "../models/job.model.js";

const DEFAULT_RUN_BUDGET_SECS = Number(process.env.APIFY_RUN_BUDGET_SECS || 60);

const clampRunBudget = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return DEFAULT_RUN_BUDGET_SECS;
  return Math.min(Math.max(parsed, 10), 3600);
};

const enforceRunBudgetIfNeeded = async (run) => {
  if (!run?.apifyRunId || !run?.runBudgetSecs) return false;
  if (!["pending", "running"].includes(run.status)) return false;

  const startedAtMs = run.startedAt
    ? new Date(run.startedAt).getTime()
    : Date.now();
  const elapsedSecs = (Date.now() - startedAtMs) / 1000;
  if (elapsedSecs < run.runBudgetSecs) return false;

  await apifyService.abortRun(run.apifyRunId);
  await ScrapeRun.updateOne(
    { _id: run._id },
    {
      status: "paused",
      stopReason: "budget",
      finishedAt: new Date(),
    },
  );

  return true;
};

export const getScraperStatus = async (req, res) => {
  const query = req.query.query || "software engineer";
  const location = req.query.location || "remote";
  const limit = Number(req.query.limit) || 20;
  const runBudgetSecs = clampRunBudget(req.query.runBudgetSecs);

  // Create a new scrape run record
  const scrapeRun = await ScrapeRun.create({
    status: "pending",
    query,
    location,
    limit,
    runBudgetSecs,
  });

  try {
    const { runId, datasetId, status } = await apifyService.startAsyncRun({
      query,
      location,
      limit,
    });

    await scrapeRun.updateOne({
      apifyRunId: runId,
      datasetId,
      status: status === "RUNNING" ? "running" : "pending",
    });

    console.log(`Apify run started: ${runId}`);

    return res.status(200).json({
      success: true,
      data: {
        jobId: scrapeRun._id,
        apifyRunId: runId,
        status,
        message: `Request received by Apify (Run ID: ${runId})`,
        runBudgetSecs,
      },
    });
  } catch (error) {
    console.error("Failed to start async run:", error.message);
    await scrapeRun.updateOne({
      status: "failed",
      finishedAt: new Date(),
    });

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const syncPendingRuns = async (req, res) => {
  try {
    // Find all pending or running scrape runs
    const pendingRuns = await ScrapeRun.find({
      status: { $in: ["pending", "running"] },
    });

    let syncedCount = 0;
    let jobsImported = 0;
    let deletedCount = 0;

    for (const run of pendingRuns) {
      try {
        // If we never stored an Apify run id, the record cannot be reconciled.
        if (!run.apifyRunId) {
          await ScrapeRun.deleteOne({ _id: run._id });
          deletedCount++;
          continue;
        }

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

        syncedCount++;
        jobsImported += jobs.length;
        console.log(`Synced run ${run.apifyRunId}: ${jobs.length} jobs`);
      } catch (error) {
        console.error(`Failed to sync run ${run.apifyRunId}:`, error.message);
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

    res.status(200).json({
      success: true,
      data: {
        runsChecked: pendingRuns.length,
        runsSynced: syncedCount,
        runsDeleted: deletedCount,
        jobsImported,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await ScrapeRun.findById(jobId).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: job._id,
        status: job.status,
        apifyRunId: job.apifyRunId || null,
        jobsFetched: job.jobsFetched,
        stopReason: job.stopReason || null,
        createdAt: job.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRunResults = async (req, res) => {
  try {
    const { jobId } = req.params;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const run = await ScrapeRun.findById(jobId).lean();
    if (!run) {
      return res.status(404).json({ success: false, message: "Run not found" });
    }

    const totalResults = await Job.countDocuments({ scrapeRunId: run._id });
    const totalPages = Math.max(Math.ceil(totalResults / limit), 1);

    const results = await Job.find({ scrapeRunId: run._id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        runId: run._id,
        apifyRunId: run.apifyRunId || null,
        status: run.status,
        stopReason: run.stopReason || null,
        jobsFetched: run.jobsFetched || 0,
        page,
        limit,
        totalResults,
        totalPages,
        results,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const pauseRun = async (req, res) => {
  try {
    const { jobId } = req.params;
    const run = await ScrapeRun.findById(jobId);

    if (!run) {
      return res.status(404).json({ success: false, message: "Run not found" });
    }

    if (!["pending", "running"].includes(run.status)) {
      return res.status(400).json({
        success: false,
        message: `Run cannot be paused from status '${run.status}'`,
      });
    }

    if (!run.apifyRunId) {
      return res.status(400).json({
        success: false,
        message: "Run has no Apify run id",
      });
    }

    await apifyService.abortRun(run.apifyRunId);

    await run.updateOne({
      status: "paused",
      stopReason: "manual",
      finishedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      data: {
        id: run._id,
        status: "paused",
        stopReason: "manual",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const resumeRun = async (req, res) => {
  try {
    const { jobId } = req.params;
    const parentRun = await ScrapeRun.findById(jobId).lean();

    if (!parentRun) {
      return res.status(404).json({ success: false, message: "Run not found" });
    }

    if (!queryIn(parentRun.status, ["paused", "failed", "completed"])) {
      return res.status(400).json({
        success: false,
        message: `Run cannot be resumed from status '${parentRun.status}'`,
      });
    }

    const query = parentRun.query || "software engineer";
    const location = parentRun.location || "remote";
    const limit = Number(parentRun.limit) || 20;
    const runBudgetSecs = clampRunBudget(parentRun.runBudgetSecs);

    const { runId, datasetId, status } = await apifyService.startAsyncRun({
      query,
      location,
      limit,
    });

    const resumedRun = await ScrapeRun.create({
      status: status === "RUNNING" ? "running" : "pending",
      apifyRunId: runId,
      datasetId,
      query,
      location,
      limit,
      runBudgetSecs,
      resumedFromRunId: parentRun._id,
      stopReason: null,
      syncedItems: 0,
      jobsFetched: 0,
    });

    return res.status(200).json({
      success: true,
      data: {
        jobId: resumedRun._id,
        apifyRunId: runId,
        status: resumedRun.status,
        message: `Run resumed with new Apify run ID: ${runId}`,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

function queryIn(value, allowed) {
  return allowed.includes(value);
}
