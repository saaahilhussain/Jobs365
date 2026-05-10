import cron from "node-cron";

export const registerCleanupCron = () => {
  // Placeholder cleanup cron registration.
  return cron.schedule("30 2 * * *", () => {});
};
