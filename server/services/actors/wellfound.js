const buildInput = ({ query, location, limit }) => ({
  keywords: query,
  location,
  maxJobs: limit,
  remote: false,
});

const mapItem = (item) => ({
  title: item.title || item.jobTitle || "Untitled job",
  company:
    typeof item.company === "string"
      ? item.company
      : item.company?.name || item.companyName || "Unknown company",
  source: "wellfound",
  externalId: item.id || item.jobId || null,
  location: item.location || null,
  url: item.jobUrl || item.url || null,
  raw: item,
});

export default {
  key: "wellfound",
  label: "Wellfound (AngelList)",
  id:
    process.env.APIFY_ACTOR_WELLFOUND ||
    "cryptosignals/wellfound-jobs-scraper",
  buildInput,
  mapItem,
};
