import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Redirect to sign-in on any mid-session 401 (token expired / user deleted).
// Auth endpoints are excluded — they handle their own 401s (bad creds, not logged in check).
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response?.status === 401 &&
      !err.config?.url?.startsWith("/auth")
    ) {
      window.location.replace("/signin");
    }
    return Promise.reject(err);
  }
);

export default api;

export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");
