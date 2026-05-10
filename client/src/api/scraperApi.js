import api from "./client";

export const startScrapeRun = async (params = {}) => {
  const res = await api.get("/scraper", { params });
  return res.data?.data ?? { count: 0, jobs: [] };
};

export const syncPendingRuns = async () => {
  const res = await api.get("/scraper/sync");
  return res.data?.data ?? { runsChecked: 0, runsSynced: 0, jobsImported: 0 };
};

export const getJobStatus = async (jobId) => {
  const res = await api.get(`/scraper/${jobId}`);
  return res.data?.data ?? null;
};

export const getScrapeRunResults = async (jobId, params = {}) => {
  const res = await api.get(`/scraper/${jobId}/results`, { params });
  return (
    res.data?.data ?? {
      results: [],
      page: 1,
      limit: 10,
      totalResults: 0,
      totalPages: 1,
    }
  );
};

export const pauseScrapeRun = async (jobId) => {
  const res = await api.post(`/scraper/${jobId}/pause`);
  return res.data?.data ?? null;
};

export const resumeScrapeRun = async (jobId) => {
  const res = await api.post(`/scraper/${jobId}/resume`);
  return res.data?.data ?? null;
};
