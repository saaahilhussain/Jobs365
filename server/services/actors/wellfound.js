const buildInput = ({ query, location, limit }) => {
  // Wellfound filters jobs by role slug, e.g. /role/software-engineer
  const roleSlug = (query || "").trim().toLowerCase().replace(/\s+/g, "-");
  const url = roleSlug
    ? `https://wellfound.com/role/${encodeURIComponent(roleSlug)}`
    : "https://wellfound.com/jobs";
  return {
    startUrls: [url],
    remoteOnly: /remote/i.test(location || ""),
    maxItems: limit,
  };
};

const mapItem = (item) => ({
  title: item.title || item.jobTitle || "Untitled job",
  company: item.companyName || item.company?.name || "Unknown company",
  source: "wellfound",
  externalId: item.jobId || item.id || null,
  location: Array.isArray(item.locations)
    ? item.locations.join(", ")
    : item.location || null,
  url: item.jobUrl || item.url || null,
  raw: item,
});

export default {
  key: "wellfound",
  label: "Wellfound (AngelList)",
  id: process.env.APIFY_ACTOR_WELLFOUND || "crawlerbros/wellfound-scraper",
  buildInput,
  mapItem,
};
