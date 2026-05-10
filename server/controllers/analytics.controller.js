import { ScrapeRun } from "../models/scrapeRun.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";

export const getDashboardStats = async (req, res) => {
  const totalJobs = await Job.countDocuments();
  const applicationsSent = await Application.countDocuments();
  const pendingApplications = await Application.countDocuments({
    status: "pending",
  });
  const scamJobsFiltered = await Job.countDocuments({ scamDetected: true });

  res.status(200).json({
    success: true,
    data: {
      totalJobs,
      applicationsSent,
      pendingApplications,
      scamJobsFiltered,
      apifyCreditsRemaining: 9999, // Placeholder
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
    source: "linkedin",
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
