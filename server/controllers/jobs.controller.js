import { Job } from "../models/job.model.js";

export const getJobs = async (req, res) => {
  const userId = req.user._id;

  const jobs = await Job.find({ userId }).sort({ createdAt: -1 }).lean();

  const data = jobs.map((job) => ({
    _id: job._id,
    title: job.title,
    company: job.company,
    source: job.source
      ? job.source.charAt(0).toUpperCase() + job.source.slice(1)
      : "Unknown",
    status: job.status,
    location: job.location || null,
    url: job.url || null,
    dateScraped: job.createdAt
      ? new Date(job.createdAt).toLocaleDateString()
      : null,
    relevanceScore: job.relevanceScore ?? null,
    scamScore: job.scamScore ?? null,
    scrapeRunId: job.scrapeRunId || null,
  }));

  res.status(200).json({ success: true, data });
};
