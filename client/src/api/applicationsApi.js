import api from "./client";

export const getApplications = async (params) => {
  const res = await api.get("/applications", { params });
  return res.data;
};

export const getApplicationById = async (id) => {
  const res = await api.get(`/applications/${id}`);
  return res.data;
};

export const createApplication = async (data) => {
  const res = await api.post("/applications", data);
  return res.data;
};

export const updateApplication = async (id, data) => {
  const res = await api.patch(`/applications/${id}`, data);
  return res.data;
};
