import cron from "node-cron";

export const registerScrapeJobsCron = () => {
  // Placeholder cron registration. No real scraping logic in this phase.
  return cron.schedule("0 * * * *", () => {});
};
