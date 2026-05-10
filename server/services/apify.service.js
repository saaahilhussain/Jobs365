import axios from "axios";

const APIFY_BASE_URL = "https://api.apify.com/v2";
const DEFAULT_ACTOR_ID = "misceres/linkedin-jobs-scraper";
const DEFAULT_TIMEOUT_SECS = 300;
const DEFAULT_LIMIT = 20;

const getToken = () => process.env.APIFY_TOKEN;

const getActorId = () => process.env.APIFY_ACTOR_ID || DEFAULT_ACTOR_ID;

const clampLimit = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(numericValue, 1), 100);
};

const runActor = async (input, timeoutSecs) => {
  const token = getToken();

  if (!token) {
    throw new Error("APIFY_TOKEN is missing. Set it in server/.env");
  }

  const actorId = getActorId();
  const timeout = Number(timeoutSecs) || DEFAULT_TIMEOUT_SECS;
  const encodedActorId = encodeURIComponent(actorId);
  const runUrl = `${APIFY_BASE_URL}/acts/${encodedActorId}/run-sync-get-dataset-items`;

  try {
    console.log("Calling Apify with:", {
      urls: input.urls,
      maxItems: input.maxItems,
    });
    const response = await axios.post(runUrl, input, {
      params: { token, timeout },
      headers: { "Content-Type": "application/json" },
    });

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Apify API Error Details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

const mapToJob = (item) => ({
  title: item.title || item.positionName || "Untitled job",
  company: item.companyName || item.company || "Unknown company",
  source: "apify",
  externalId: item.id || item.jobId || null,
  location: item.location || null,
  url: item.url || item.link || null,
  raw: item,
});

export const apifyService = {
  fetchJobs: async ({
    query = "software engineer",
    location = "remote",
    limit = DEFAULT_LIMIT,
  } = {}) => {
    const normalizedLimit = clampLimit(limit);
    // Build LinkedIn job search URLs based on query and location
    const encodedQuery = encodeURIComponent(query);
    const encodedLocation = encodeURIComponent(location);
    const linkedInUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodedQuery}&location=${encodedLocation}`;

    const actorInput = {
      urls: [linkedInUrl],
      maxItems: normalizedLimit,
    };

    const items = await runActor(actorInput, process.env.APIFY_TIMEOUT_SECS);
    return items.slice(0, normalizedLimit).map(mapToJob);
  },
};
