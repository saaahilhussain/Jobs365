import { ScrapeRun } from "../models/scrapeRun.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { apifyService } from "../services/apify.service.js";

export const getDashboardStats = async (req, res) => {
  const userId = req.user._id;
  const [totalJobs, applicationsSent, pendingApplications] = await Promise.all([
    Job.countDocuments({ userId }),
    Application.countDocuments({ userId }),
    Application.countDocuments({
      userId,
      status: { $in: ["applied", "assessment", "interview"] },
    }),
  ]);
  res.status(200).json({
    success: true,
    data: { totalJobs, applicationsSent, pendingApplications, scamJobsFiltered: 0 },
  });
};

export const getApifyLimits = async (req, res) => {
  const limits = await apifyService.getAccountLimits(
    req.user.apifyToken || process.env.APIFY_TOKEN,
  );
  res.status(200).json({
    success: true,
    data: { apifyCreditsRemaining: limits?.remainingMonthlyUsageUsd ?? null },
  });
};

export const getScrapingActivity = async (req, res) => {
  const recentRuns = await ScrapeRun.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const activity = recentRuns.map((run) => ({
    id: run._id,
    apifyRunId: run.apifyRunId || null,
    source: run.actorKey || "linkedin",
    jobs: run.jobsFetched,
    query: run.query || null,
    location: run.location || null,
    time: run.finishedAt
      ? new Date(run.finishedAt).toLocaleString()
      : "In progress",
    status: run.status,
  }));

  res.status(200).json({
    success: true,
    data: activity,
  });
};

export const getAnalytics = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { message: "Analytics endpoint placeholder" },
  });
};
