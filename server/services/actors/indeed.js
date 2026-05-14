const buildInput = ({ query, location, limit }) => {
  const encodedQuery = encodeURIComponent(query);
  const encodedLocation = encodeURIComponent(location);
  const url = `https://www.indeed.com/jobs?q=${encodedQuery}&l=${encodedLocation}`;
  return {
    startUrls: [{ url }],
    maxItems: limit,
  };
};

const mapItem = (item) => ({
  title: item.positionName || item.title || "Untitled job",
  company: item.company || item.companyName || "Unknown company",
  source: "indeed",
  externalId: item.id || item.jobKey || null,
  location: item.location || null,
  url: item.url || item.externalApplyLink || null,
  raw: item,
});

export default {
  key: "indeed",
  label: "Indeed",
  id: process.env.APIFY_ACTOR_INDEED || "misceres/indeed-scraper",
  buildInput,
  mapItem,
};
