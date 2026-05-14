import cron from "node-cron";
import { scrapeSyncService } from "../services/scrapeSync.service.js";

const tick = async () => {
  try {
    const result = await scrapeSyncService.syncAllPending();
    if (result.runsChecked > 0) {
      console.log(
        `Cron: checked ${result.runsChecked} runs, imported ${result.jobsImported} jobs`,
      );
    }
  } catch (error) {
    console.error("Cron sync error:", error.message);
  }
};

export const registerScrapeJobsCron = () => {
  // Sync pending runs every 10 seconds
  return cron.schedule("*/10 * * * * *", tick);
};
