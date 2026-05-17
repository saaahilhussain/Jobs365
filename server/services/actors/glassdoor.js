const buildInput = ({ query, location, limit }) => ({
  keyword: query,
  location,
  maxItems: limit,
});

const mapItem = (item) => ({
  title: item.jobTitle || item.title || "Untitled job",
  company:
    item.companyName || item.employerName || item.company || "Unknown company",
  source: "glassdoor",
  externalId: item.jobListingId || item.id || null,
  location: item.location || item.locationName || null,
  url: item.jobUrl || item.url || item.jobLink || null,
  raw: item,
});

export default {
  key: "glassdoor",
  label: "Glassdoor",
  id: process.env.APIFY_ACTOR_GLASSDOOR || "crawlerbros/glassdoor-jobs-scraper",
  buildInput,
  mapItem,
};
