import api from "./client";

export const getDashboardStats = async () => {
  const res = await api.get("/analytics/dashboard");
  return res.data;
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

export const getRecentJobs = async () => {
  const res = await api.get("/analytics/recent-jobs");
  return res.data;
};

export const getRecentApplications = async () => {
  const res = await api.get("/analytics/recent-applications");
  return res.data;
};

export const getScrapingActivity = async () => {
  const res = await api.get("/analytics/scraping-activity");
  return res.data;
};
