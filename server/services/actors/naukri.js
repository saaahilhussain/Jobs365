const buildInput = ({ query, location, limit }) => {
  // Naukri uses path segments like /software-engineer-jobs-in-bangalore
  const slug = `${query.trim().replace(/\s+/g, "-").toLowerCase()}-jobs-in-${location
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()}`;
  const url = `https://www.naukri.com/${slug}`;
  return {
    startUrls: [{ url }],
    maxItems: limit,
  };
};

const mapItem = (item) => ({
  title: item.title || item.jobTitle || "Untitled job",
  company: item.company || item.companyName || "Unknown company",
  source: "naukri",
  externalId: item.id || item.jobId || null,
  location: item.location || item.placeOfWork || null,
  url: item.url || item.jdURL || null,
  raw: item,
});

export default {
  key: "naukri",
  label: "Naukri",
  // No widely-canonical Apify actor for Naukri; user must supply via env.
  id: process.env.APIFY_ACTOR_NAUKRI || "epctex/naukri-scraper",
  buildInput,
  mapItem,
};
