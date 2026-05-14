import { apifyService } from "../services/apify.service.js";
import { scrapeSyncService } from "../services/scrapeSync.service.js";
import { ScrapeRun } from "../models/scrapeRun.model.js";
import { Job } from "../models/job.model.js";

const DEFAULT_RUN_BUDGET_SECS = Number(process.env.APIFY_RUN_BUDGET_SECS || 60);

const clampRunBudget = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return DEFAULT_RUN_BUDGET_SECS;
  return Math.min(Math.max(parsed, 10), 3600);
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
    const result = await scrapeSyncService.syncAllPending();
    res.status(200).json({ success: true, data: result });
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

export const deleteRun = async (req, res) => {
  try {
    const { jobId } = req.params;
    const run = await ScrapeRun.findById(jobId);

    if (!run) {
      return res.status(404).json({ success: false, message: "Run not found" });
    }

    // Abort the Apify run if it is still active
    if (run.apifyRunId && ["pending", "running"].includes(run.status)) {
      await apifyService.abortRun(run.apifyRunId).catch(() => {});
    }

    // Delete all jobs linked to this run, then the run itself
    await Job.deleteMany({ scrapeRunId: run._id });
    await ScrapeRun.deleteOne({ _id: run._id });

    return res.status(200).json({
      success: true,
      data: { id: jobId, deleted: true },
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
