import axios from "axios";
import { getActor, DEFAULT_ACTOR_KEY } from "./actors/index.js";

const APIFY_BASE_URL = "https://api.apify.com/v2";
const DEFAULT_TIMEOUT_SECS = 300;
const DEFAULT_LIMIT = 20;

const ensureToken = (token) => {
  const resolved = token || process.env.APIFY_TOKEN;
  if (!resolved) {
    throw new Error(
      "Apify token is missing. Add it in Settings or set APIFY_TOKEN in server/.env",
    );
  }
  return resolved;
};

const clampLimit = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return DEFAULT_LIMIT;
  return Math.min(Math.max(numericValue, 1), 100);
};

const resolveActor = (actorKey) => {
  const actor = getActor(actorKey || DEFAULT_ACTOR_KEY);
  if (!actor) throw new Error(`Unknown actor key: ${actorKey}`);
  if (!actor.id) {
    throw new Error(
      `Actor '${actor.key}' has no Apify actor id configured. Set the relevant env var.`,
    );
  }
  return actor;
};

const limitsCache = new Map();
const LIMITS_TTL_MS = 60_000;

export const apifyService = {
  fetchJobs: async ({
    apifyToken,
    actorKey,
    query = "software engineer",
    location = "remote",
    limit = DEFAULT_LIMIT,
  } = {}) => {
    const token = ensureToken(apifyToken);
    const actor = resolveActor(actorKey);
    const normalizedLimit = clampLimit(limit);
    const input = actor.buildInput({
      query,
      location,
      limit: normalizedLimit,
    });
    const timeout = Number(process.env.APIFY_TIMEOUT_SECS) || DEFAULT_TIMEOUT_SECS;
    const url = `${APIFY_BASE_URL}/acts/${actor.id.replace("/", "~")}/run-sync-get-dataset-items`;

    try {
      console.log(`Calling Apify [${actor.key}]`);
      const response = await axios.post(url, input, {
        params: { token, timeout },
        headers: { "Content-Type": "application/json" },
      });
      const items = Array.isArray(response.data) ? response.data : [];
      return items.slice(0, normalizedLimit).map(actor.mapItem);
    } catch (error) {
      console.error("Apify run-sync error:", {
        actor: actor.key,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  startAsyncRun: async ({
    apifyToken,
    actorKey,
    query = "software engineer",
    location = "remote",
    limit = DEFAULT_LIMIT,
  } = {}) => {
    const token = ensureToken(apifyToken);
    const actor = resolveActor(actorKey);
    const normalizedLimit = clampLimit(limit);
    const input = actor.buildInput({
      query,
      location,
      limit: normalizedLimit,
    });
    const url = `${APIFY_BASE_URL}/acts/${actor.id.replace("/", "~")}/runs`;

    try {
      console.log(`Starting async Apify run [${actor.key}]`);
      const response = await axios.post(url, input, {
        params: { token },
        headers: { "Content-Type": "application/json" },
      });

      const run = response.data?.data ?? response.data ?? {};
      const runId = run.id || run.runId || run.actorRunId || null;
      const datasetId = run.defaultDatasetId || run.datasetId || null;

      if (!runId) {
        throw new Error("Apify accepted the request but did not return a run id");
      }
      return { runId, datasetId, status: run.status };
    } catch (error) {
      console.error("Failed to start async Apify run:", {
        actor: actor.key,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  checkRunStatus: async ({ apifyToken, runId }) => {
    const token = ensureToken(apifyToken);
    try {
      const response = await axios.get(
        `${APIFY_BASE_URL}/actor-runs/${runId}`,
        {
          params: { token },
          headers: { "Content-Type": "application/json" },
        },
      );
      const run = response.data?.data ?? response.data ?? {};
      return {
        status: run.status,
        datasetId: run.defaultDatasetId,
        finishedAt: run.finishedAt,
      };
    } catch (error) {
      console.error("Failed to check run status:", error.message);
      throw error;
    }
  },

  abortRun: async ({ apifyToken, runId }) => {
    const token = ensureToken(apifyToken);
    try {
      await axios.post(
        `${APIFY_BASE_URL}/actor-runs/${runId}/abort`,
        {},
        {
          params: { token },
          headers: { "Content-Type": "application/json" },
        },
      );
      return { success: true };
    } catch (error) {
      console.error("Failed to abort run:", {
        runId,
        status: error.response?.status,
        message: error.message,
      });
      throw error;
    }
  },

  fetchDatasetItems: async ({ apifyToken, datasetId, offset = 0, actorKey }) => {
    const token = ensureToken(apifyToken);
    const actor = resolveActor(actorKey);
    try {
      const response = await axios.get(
        `${APIFY_BASE_URL}/datasets/${datasetId}/items`,
        {
          params: { token, offset: Number(offset) || 0 },
          headers: { "Content-Type": "application/json" },
        },
      );
      const items = Array.isArray(response.data) ? response.data : [];
      return items.map(actor.mapItem);
    } catch (error) {
      console.error("Failed to fetch dataset items:", error.message);
      throw error;
    }
  },

  getAccountLimits: async (apifyToken) => {
    const token = apifyToken || process.env.APIFY_TOKEN;
    if (!token) return null;

    const cached = limitsCache.get(token);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    try {
      const response = await axios.get(`${APIFY_BASE_URL}/users/me/limits`, {
        params: { token },
        headers: { "Content-Type": "application/json" },
      });
      const payload = response.data?.data ?? {};
      const max = Number(payload?.limits?.maxMonthlyUsageUsd);
      const used = Number(payload?.current?.monthlyUsageUsd);
      const value = {
        maxMonthlyUsageUsd: Number.isFinite(max) ? max : null,
        currentMonthlyUsageUsd: Number.isFinite(used) ? used : 0,
        remainingMonthlyUsageUsd: Number.isFinite(max)
          ? Math.max(max - (Number.isFinite(used) ? used : 0), 0)
          : null,
      };
      limitsCache.set(token, { value, expiresAt: Date.now() + LIMITS_TTL_MS });
      return value;
    } catch (error) {
      console.error("Failed to fetch Apify account limits:", error.message);
      return null;
    }
  },
};
