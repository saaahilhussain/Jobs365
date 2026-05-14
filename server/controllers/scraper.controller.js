import { apifyService } from "../services/apify.service.js";
import { scrapeSyncService } from "../services/scrapeSync.service.js";
import {
  actorRegistry,
  DEFAULT_ACTOR_KEY,
  listActors,
} from "../services/actors/index.js";
import { ScrapeRun } from "../models/scrapeRun.model.js";
import { Job } from "../models/job.model.js";

const DEFAULT_RUN_BUDGET_SECS = Number(process.env.APIFY_RUN_BUDGET_SECS || 60);

const clampRunBudget = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return DEFAULT_RUN_BUDGET_SECS;
  return Math.min(Math.max(parsed, 10), 3600);
};

const resolveActorKey = (value) => {
  const key = String(value || DEFAULT_ACTOR_KEY);
  if (!actorRegistry[key]) {
    throw Object.assign(new Error(`Unknown actor: ${key}`), {
      statusCode: 400,
    });
  }
  return key;
};

const userToken = (req) => req.user?.apifyToken || process.env.APIFY_TOKEN || "";

export const getActors = async (_req, res) => {
  res.status(200).json({ success: true, data: listActors() });
};

export const getScraperStatus = async (req, res) => {
  const query = req.query.query || "software engineer";
  const location = req.query.location || "remote";
  const limit = Number(req.query.limit) || 20;
  const runBudgetSecs = clampRunBudget(req.query.runBudgetSecs);

  let actorKey;
  try {
    actorKey = resolveActorKey(req.query.actor);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  const scrapeRun = await ScrapeRun.create({
    userId: req.user._id,
    status: "pending",
    actorKey,
    query,
    location,
    limit,
    runBudgetSecs,
  });

  try {
    const { runId, datasetId, status } = await apifyService.startAsyncRun({
      apifyToken: userToken(req),
      actorKey,
      query,
      location,
      limit,
    });

    await scrapeRun.updateOne({
      apifyRunId: runId,
      datasetId,
      status: status === "RUNNING" ? "running" : "pending",
    });

    console.log(`Apify run started [${actorKey}] for ${req.user.email}: ${runId}`);

    return res.status(200).json({
      success: true,
      data: {
        jobId: scrapeRun._id,
        apifyRunId: runId,
        actorKey,
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
    const result = await scrapeSyncService.syncAllPending({
      userId: req.user._id,
    });
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
    const job = await ScrapeRun.findOne({
      _id: jobId,
      userId: req.user._id,
    }).lean();

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

    const run = await ScrapeRun.findOne({
      _id: jobId,
      userId: req.user._id,
    }).lean();
    if (!run) {
      return res.status(404).json({ success: false, message: "Run not found" });
    }

    const totalResults = await Job.countDocuments({
      userId: req.user._id,
      scrapeRunId: run._id,
    });
    const totalPages = Math.max(Math.ceil(totalResults / limit), 1);

    const results = await Job.find({
      userId: req.user._id,
      scrapeRunId: run._id,
    })
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
    const run = await ScrapeRun.findOne({
      _id: jobId,
      userId: req.user._id,
    });

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

    await apifyService.abortRun({
      apifyToken: userToken(req),
      runId: run.apifyRunId,
    });

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

export const rerunRun = async (req, res) => {
  try {
    const { jobId } = req.params;
    const parentRun = await ScrapeRun.findOne({
      _id: jobId,
      userId: req.user._id,
    });

    if (!parentRun) {
      return res.status(404).json({ success: false, message: "Run not found" });
    }

    if (!["paused", "failed", "completed"].includes(parentRun.status)) {
      return res.status(400).json({
        success: false,
        message: `Run cannot be re-run from status '${parentRun.status}'`,
      });
    }

    const actorKey = resolveActorKey(parentRun.actorKey);
    const query = parentRun.query || "software engineer";
    const location = parentRun.location || "remote";
    const limit = Number(parentRun.limit) || 20;
    const runBudgetSecs = clampRunBudget(parentRun.runBudgetSecs);

    const { runId, datasetId, status } = await apifyService.startAsyncRun({
      apifyToken: userToken(req),
      actorKey,
      query,
      location,
      limit,
    });

    // Update the parent run in place — keep the same _id so jobs from prior
    // runs stay associated with this activity row. syncedItems resets to 0
    // because the new Apify run has a fresh dataset (offset cursor starts
    // over); jobsFetched stays so the lifetime count keeps incrementing.
    const nextStatus = status === "RUNNING" ? "running" : "pending";
    await parentRun.updateOne({
      apifyRunId: runId,
      datasetId,
      actorKey,
      query,
      location,
      limit,
      runBudgetSecs,
      status: nextStatus,
      stopReason: null,
      syncedItems: 0,
      startedAt: new Date(),
      finishedAt: null,
    });

    return res.status(200).json({
      success: true,
      data: {
        jobId: parentRun._id,
        apifyRunId: runId,
        status: nextStatus,
        message: `Resumed run with new Apify execution: ${runId}`,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const completeRun = async (req, res) => {
  try {
    const { jobId } = req.params;
    const run = await ScrapeRun.findOne({
      _id: jobId,
      userId: req.user._id,
    });

    if (!run) {
      return res.status(404).json({ success: false, message: "Run not found" });
    }

    if (run.apifyRunId && ["pending", "running"].includes(run.status)) {
      await apifyService
        .abortRun({ apifyToken: userToken(req), runId: run.apifyRunId })
        .catch(() => {});
    }

    await run.updateOne({
      status: "completed",
      stopReason: "manual",
      finishedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      data: { id: run._id, status: "completed" },
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
    const run = await ScrapeRun.findOne({
      _id: jobId,
      userId: req.user._id,
    });

    if (!run) {
      return res.status(404).json({ success: false, message: "Run not found" });
    }

    if (run.apifyRunId && ["pending", "running"].includes(run.status)) {
      await apifyService
        .abortRun({ apifyToken: userToken(req), runId: run.apifyRunId })
        .catch(() => {});
    }

    await Job.deleteMany({ userId: req.user._id, scrapeRunId: run._id });
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
