import api from "./client";

export const getDashboardStats = async () => {
  const res = await api.get("/analytics/dashboard");
  return res.data.data;
};

export const getWeeklyApplications = async () => {
  const res = await api.get("/analytics/weekly-applications");
  return res.data;
};

export const getResponseRate = async () => {
  const res = await api.get("/analytics/response-rate");
  return res.data;
};

export const getSourceEffectiveness = async () => {
  const res = await api.get("/analytics/source-effectiveness");
  return res.data;
};

export const getScamRatio = async () => {
  const res = await api.get("/analytics/scam-ratio");
  return res.data;
};

export const getScrapingActivity = async () => {
  const res = await api.get("/analytics/scraping-activity");
  return res.data.data || [];
};

export const getApifyLimits = async () => {
  const res = await api.get("/analytics/apify-limits");
  return res.data?.data ?? { apifyCreditsRemaining: null };
};
