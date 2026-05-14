import { ScrapeRun } from "../models/scrapeRun.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { apifyService } from "../services/apify.service.js";

export const getDashboardStats = async (req, res) => {
  const totalJobs = await Job.countDocuments();
  const applicationsSent = await Application.countDocuments();
  // "Pending" = applied but not yet resolved (rejected/ghosted/offer)
  const pendingApplications = await Application.countDocuments({
    status: { $in: ["applied", "assessment", "interview"] },
  });
  // Wired up once scam detection lands; field doesn't exist on Job yet
  const scamJobsFiltered = 0;

  const limits = await apifyService.getAccountLimits(process.env.APIFY_TOKEN);

  res.status(200).json({
    success: true,
    data: {
      totalJobs,
      applicationsSent,
      pendingApplications,
      scamJobsFiltered,
      apifyUsage: limits,
      apifyCreditsRemaining: limits?.remainingMonthlyUsageUsd ?? null,
    },
  });
};

export const getScrapingActivity = async (req, res) => {
  const recentRuns = await ScrapeRun.find()
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
