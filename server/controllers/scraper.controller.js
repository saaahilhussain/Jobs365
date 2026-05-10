import { apifyService } from "../services/apify.service.js";
import { ScrapeRun } from "../models/scrapeRun.model.js";

export const getScraperStatus = async (req, res) => {
  // Create a new scrape run record
  const scrapeRun = await ScrapeRun.create({
    status: "queued",
  });

  // Queue the job for background processing
  setImmediate(async () => {
    try {
      await scrapeRun.updateOne({ status: "processing" });
      
      const jobs = await apifyService.fetchJobs({
        query: req.query.query,
        location: req.query.location,
        limit: req.query.limit,
      });

      await scrapeRun.updateOne({
        status: "completed",
        jobsFetched: jobs.length,
        finishedAt: new Date(),
      });
    } catch (error) {
      console.error("Background scrape job failed:", error.message);
      await scrapeRun.updateOne({
        status: "failed",
        finishedAt: new Date(),
      });
    }
  });

  res.status(200).json({
    success: true,
    data: {
      jobId: scrapeRun._id,
      status: "queued",
      message: "Scraping job queued. Check scraping activity for results.",
    },
  });
};
