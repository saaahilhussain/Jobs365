const buildInput = ({ query, location, limit }) => {
  const encodedQuery = encodeURIComponent(query);
  const encodedLocation = encodeURIComponent(location);
  const url = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodedQuery}&locT=N&locKeyword=${encodedLocation}`;
  return {
    startUrls: [{ url }],
    maxItems: limit,
  };
};

const mapItem = (item) => ({
  title: item.jobTitle || item.title || "Untitled job",
  company:
    item.employerName || item.company || item.companyName || "Unknown company",
  source: "glassdoor",
  externalId: item.id || item.jobListingId || null,
  location: item.location || item.locationName || null,
  url: item.url || item.jobLink || null,
  raw: item,
});

export default {
  key: "glassdoor",
  label: "Glassdoor",
  id: process.env.APIFY_ACTOR_GLASSDOOR || "bebity/glassdoor-jobs-scraper",
  buildInput,
  mapItem,
};
