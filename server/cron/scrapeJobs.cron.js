import cron from "node-cron";
import { scrapeSyncService } from "../services/scrapeSync.service.js";

const tick = async () => {
  try {
    await scrapeSyncService.syncAllPending();
  } catch {
    // swallow — cron errors are non-fatal
  }
};

export const registerScrapeJobsCron = () => {
  // Sync pending runs every 10 seconds
  return cron.schedule("*/10 * * * * *", tick);
};
