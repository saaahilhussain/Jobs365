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
      const response = await axios.post(url, input, {
        params: { token, timeout },
        headers: { "Content-Type": "application/json" },
      });
      const items = Array.isArray(response.data) ? response.data : [];
      return items.slice(0, normalizedLimit).map(actor.mapItem);
    } catch (error) {
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
      throw error;
    }
  },

  fetchDatasetItems: async ({
    apifyToken,
    datasetId,
    offset = 0,
    actorKey,
    query,
  }) => {
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
      let mapped = items.map(actor.mapItem);

      // For actors whose source page doesn't reliably server-filter by query
      // (e.g. Wellfound's client-side search), post-filter by title match.
      // Use token-OR matching: if ANY token from the query (length >= 3)
      // appears in the title, the item passes. Fall back to all items if
      // the filter would remove everything — better to show broad results
      // than to make the activity disappear.
      if (actor.requiresPostFilter && query) {
        const tokens = String(query)
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((t) => t.length >= 3);
        if (tokens.length > 0) {
          const filtered = mapped.filter((item) => {
            const title = String(item.title || "").toLowerCase();
            return tokens.some((t) => title.includes(t));
          });
          if (filtered.length > 0) mapped = filtered;
        }
      }
      return mapped;
    } catch (error) {
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
    } catch {
      return null;
    }
  },
};
