import api from "./client";

export const startScrapeRun = async (params = {}) => {
  const res = await api.get("/scraper", { params });
  return res.data?.data ?? { count: 0, jobs: [] };
};
