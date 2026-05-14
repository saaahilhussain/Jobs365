import api from "./client";

export const getJobs = async (params) => {
  const res = await api.get("/jobs", { params });
  return res.data?.data ?? [];
};

export const getJobById = async (id) => {
  const res = await api.get(`/jobs/${id}`);
  return res.data;
};

export const updateJobStatus = async (id, status) => {
  const res = await api.patch(`/jobs/${id}`, { status });
  return res.data;
};
