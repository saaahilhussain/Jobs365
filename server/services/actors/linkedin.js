const buildInput = ({ query, location, limit }) => {
  const encodedQuery = encodeURIComponent(query);
  const encodedLocation = encodeURIComponent(location);
  const url = `https://www.linkedin.com/jobs/search/?keywords=${encodedQuery}&location=${encodedLocation}`;
  return {
    urls: [url],
    maxItems: limit,
  };
};

const mapItem = (item) => ({
  title: item.title || item.positionName || "Untitled job",
  company: item.companyName || item.company || "Unknown company",
  source: "linkedin",
  externalId: item.id || item.jobId || null,
  location: item.location || null,
  url: item.url || item.link || null,
  raw: item,
});

export default {
  key: "linkedin",
  label: "LinkedIn",
  // APIFY_ACTOR_ID kept as fallback for backwards compat with the single-actor era.
  id:
    process.env.APIFY_ACTOR_LINKEDIN ||
    process.env.APIFY_ACTOR_ID ||
    "curious_coder/linkedin-jobs-scraper",
  buildInput,
  mapItem,
};
