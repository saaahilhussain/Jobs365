import axios from "axios";
import { User } from "../models/user.model.js";

const APIFY_BASE_URL = "https://api.apify.com/v2";

const maskToken = (token) => {
  if (!token) return "";
  if (token.length <= 8) return "•".repeat(token.length);
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
};

const fetchApifyUsername = async (token) => {
  try {
    const response = await axios.get(`${APIFY_BASE_URL}/users/me`, {
      params: { token },
    });
    const data = response.data?.data ?? {};
    return data.username || data.email || "";
  } catch {
    return "";
  }
};

export const getSystemInfo = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      apifyToken: maskToken(req.user.apifyToken),
      hasApifyToken: Boolean(req.user.apifyToken),
      apifyUsername: req.user.apifyUsername || "",
      defaultActorKey: req.user.defaultActorKey,
    },
  });
};

export const updateSettings = async (req, res) => {
  const update = {};

  if (typeof req.body?.apifyToken === "string") {
    const token = req.body.apifyToken.trim();
    update.apifyToken = token;
    update.apifyUsername = token ? await fetchApifyUsername(token) : "";
  }

  if (typeof req.body?.defaultActorKey === "string") {
    update.defaultActorKey = req.body.defaultActorKey;
  }

  const user = await User.findByIdAndUpdate(req.user._id, update, {
    new: true,
  });

  res.status(200).json({
    success: true,
    data: {
      apifyToken: maskToken(user.apifyToken),
      hasApifyToken: Boolean(user.apifyToken),
      apifyUsername: user.apifyUsername || "",
      defaultActorKey: user.defaultActorKey,
    },
  });
};

export const testApifyToken = async (req, res) => {
  const token = req.body?.apifyToken || req.user.apifyToken;
  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "No token provided" });
  }
  try {
    const response = await axios.get(`${APIFY_BASE_URL}/users/me`, {
      params: { token },
      headers: { "Content-Type": "application/json" },
    });
    const user = response.data?.data ?? {};
    res.status(200).json({
      success: true,
      data: {
        ok: true,
        username: user.username || user.email || null,
        plan: user.plan?.id || user.plan || null,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error.response?.status === 401
          ? "Invalid Apify token"
          : `Apify check failed: ${error.message}`,
    });
  }
};
