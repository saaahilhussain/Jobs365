import axios from "axios";
import { getActor, DEFAULT_ACTOR_KEY } from "./actors/index.js";

const APIFY_BASE_URL = "https://api.apify.com/v2";
const DEFAULT_TIMEOUT_SECS = 300;
const DEFAULT_LIMIT = 20;

const getToken = () => process.env.APIFY_TOKEN;

const clampLimit = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(numericValue, 1), 100);
};

const resolveActor = (actorKey) => {
  const actor = getActor(actorKey || DEFAULT_ACTOR_KEY);
  if (!actor) {
    throw new Error(`Unknown actor key: ${actorKey}`);
  }
  if (!actor.id) {
    throw new Error(
      `Actor '${actor.key}' has no Apify actor id configured. Set the relevant env var.`,
    );
  }
  return actor;
};

const runActor = async (actor, input, timeoutSecs) => {
  const token = getToken();
  if (!token) {
    throw new Error("APIFY_TOKEN is missing. Set it in server/.env");
  }

  const timeout = Number(timeoutSecs) || DEFAULT_TIMEOUT_SECS;
  const encodedActorId = encodeURIComponent(actor.id);
  const runUrl = `${APIFY_BASE_URL}/acts/${encodedActorId}/run-sync-get-dataset-items`;

  try {
    console.log(`Calling Apify ${actor.key}:`, {
      urls: input.urls || input.startUrls,
      maxItems: input.maxItems,
    });
    const response = await axios.post(runUrl, input, {
      params: { token, timeout },
      headers: { "Content-Type": "application/json" },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Apify API Error Details:", {
      actor: actor.key,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

const startAsyncRun = async (actor, input) => {
  const token = getToken();
  if (!token) {
    throw new Error("APIFY_TOKEN is missing. Set it in server/.env");
  }

  const encodedActorId = encodeURIComponent(actor.id);
  const runUrl = `${APIFY_BASE_URL}/acts/${encodedActorId}/runs`;

  try {
    console.log(`Starting async Apify run [${actor.key}]:`, {
      urls: input.urls || input.startUrls,
      maxItems: input.maxItems,
    });
    const response = await axios.post(runUrl, input, {
      params: { token },
      headers: { "Content-Type": "application/json" },
    });

    const run = response.data?.data ?? response.data ?? {};
    const runId = run.id || run.runId || run.actorRunId || null;
    const datasetId = run.defaultDatasetId || run.datasetId || null;

    if (!runId) {
      console.error("Apify run response did not include an id:", {
        topLevelKeys: response.data ? Object.keys(response.data) : [],
        nestedKeys:
          response.data?.data && typeof response.data.data === "object"
            ? Object.keys(response.data.data)
            : [],
        rawStatus: response.status,
      });
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
};

const checkRunStatus = async (runId) => {
  const token = getToken();
  if (!token) throw new Error("APIFY_TOKEN is missing");

  const statusUrl = `${APIFY_BASE_URL}/actor-runs/${runId}`;

  try {
    const response = await axios.get(statusUrl, {
      params: { token },
      headers: { "Content-Type": "application/json" },
    });
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
};

const abortRun = async (runId) => {
  const token = getToken();
  if (!token) throw new Error("APIFY_TOKEN is missing");

  const abortUrl = `${APIFY_BASE_URL}/actor-runs/${runId}/abort`;

  try {
    await axios.post(
      abortUrl,
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
};

const fetchDatasetItemsRaw = async (datasetId, options = {}) => {
  const token = getToken();
  if (!token) throw new Error("APIFY_TOKEN is missing");

  const itemsUrl = `${APIFY_BASE_URL}/datasets/${datasetId}/items`;
  const offset = Number(options.offset) || 0;

  try {
    const response = await axios.get(itemsUrl, {
      params: { token, offset },
      headers: { "Content-Type": "application/json" },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Failed to fetch dataset items:", error.message);
    throw error;
  }
};

const limitsCache = new Map();
const LIMITS_TTL_MS = 60_000;

const getAccountLimits = async (token) => {
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
};

export const apifyService = {
  fetchJobs: async ({
    actorKey,
    query = "software engineer",
    location = "remote",
    limit = DEFAULT_LIMIT,
  } = {}) => {
    const normalizedLimit = clampLimit(limit);
    const actor = resolveActor(actorKey);
    const input = actor.buildInput({
      query,
      location,
      limit: normalizedLimit,
    });
    const items = await runActor(actor, input, process.env.APIFY_TIMEOUT_SECS);
    return items.slice(0, normalizedLimit).map(actor.mapItem);
  },

  startAsyncRun: async ({
    actorKey,
    query = "software engineer",
    location = "remote",
    limit = DEFAULT_LIMIT,
  } = {}) => {
    const normalizedLimit = clampLimit(limit);
    const actor = resolveActor(actorKey);
    const input = actor.buildInput({
      query,
      location,
      limit: normalizedLimit,
    });
    return startAsyncRun(actor, input);
  },

  checkRunStatus,
  abortRun,
  getAccountLimits,

  fetchDatasetItems: async (datasetId, options = {}) => {
    const actor = resolveActor(options.actorKey);
    const items = await fetchDatasetItemsRaw(datasetId, options);
    return items.map(actor.mapItem);
  },
};
