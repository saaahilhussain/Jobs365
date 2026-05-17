const buildInput = ({ query, location, limit }) => {
  // Wellfound's /role/<slug> pages require canonical slugs (e.g. "software-engineer")
  // and arbitrary queries like "node.js" 404 there. The /jobs?keyword=<q> route
  // accepts any free-text query and returns matching listings.
  const q = (query || "").trim();
  const url = q
    ? `https://wellfound.com/jobs?keyword=${encodeURIComponent(q)}`
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
  // Wellfound's /jobs?keyword= page filters client-side via JS, so the
  // actor receives the full unfiltered HTML. Post-filter by title here.
  requiresPostFilter: true,
};
