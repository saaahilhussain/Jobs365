import { apifyService } from "../services/apify.service.js";

export const getScraperStatus = async (req, res) => {
  const jobs = await apifyService.fetchJobs({
    query: req.query.query,
    location: req.query.location,
    limit: req.query.limit,
  });

  res.status(200).json({
    success: true,
    data: {
      count: jobs.length,
      jobs,
    },
  });
};
