import api from "./client";

export const getMe = async () => {
  const res = await api.get("/auth/me");
  return res.data?.data ?? null;
};

export const logout = async () => {
  const res = await api.post("/auth/logout");
  return res.data?.data ?? null;
};

export const startRegistration = async ({ email, name, password }) => {
  const res = await api.post("/auth/register/start", { email, name, password });
  return res.data?.data;
};

export const verifyRegistration = async ({ email, code }) => {
  const res = await api.post("/auth/register/verify", { email, code });
  return res.data?.data;
};

export const resendRegistrationCode = async ({ email }) => {
  const res = await api.post("/auth/register/resend", { email });
  return res.data?.data;
};

export const loginWithPassword = async ({ email, password }) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data?.data;
};
