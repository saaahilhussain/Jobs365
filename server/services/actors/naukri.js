const buildInput = ({ query, location, limit }) => {
  // Naukri uses path segments like /software-engineer-jobs-in-bangalore
  const slug = `${query.trim().replace(/\s+/g, "-").toLowerCase()}-jobs-in-${location
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()}`;
  const url = `https://www.naukri.com/${slug}`;
  return {
    searchUrls: [url],
    maxItems: limit,
    proxyConfiguration: { useApifyProxy: true },
  };
};

const mapItem = (item) => {
  const placeholders = item.placeholders || {};
  return {
    title: item.title || item.jobTitle || "Untitled job",
    company: item.companyName || item.company || "Unknown company",
    source: "naukri",
    externalId: item.jobId || item.id || null,
    location:
      placeholders.location || item.location || item.placeOfWork || null,
    url: item.jdURL || item.url || null,
    raw: item,
  };
};

export default {
  key: "naukri",
  label: "Naukri",
  id: process.env.APIFY_ACTOR_NAUKRI || "easyapi/naukri-jobs-scraper",
  buildInput,
  mapItem,
};
