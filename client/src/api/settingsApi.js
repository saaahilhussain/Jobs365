import api from "./client";

export const getSettings = async () => {
  const res = await api.get("/system");
  return res.data?.data ?? null;
};

export const updateSettings = async (payload) => {
  const res = await api.put("/system/settings", payload);
  return res.data?.data ?? null;
};

export const testApifyToken = async (apifyToken) => {
  const res = await api.post("/system/test-apify-token", { apifyToken });
  return res.data?.data ?? null;
};
