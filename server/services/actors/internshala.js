// solidcode/internshala-scraper uses category + location filters (or mode-based
// search) and returns internships/jobs with stipend, locations, skills, applyUrl.
const buildInput = ({ query, location, limit }) => ({
  mode: "internships",
  category: query,
  location: location || "",
  workFromHome: !location || /remote/i.test(location || ""),
  includeDetails: false,
  maxResults: limit,
});

const mapItem = (item) => ({
  title: item.title || item.role || "Untitled internship",
  company:
    item.company ||
    item.companyName ||
    item.employer ||
    "Unknown company",
  source: "internshala",
  externalId: item.id || item.internshipId || null,
  location:
    Array.isArray(item.locations) && item.locations.length > 0
      ? item.locations.join(", ")
      : item.location || null,
  url: item.applyUrl || item.url || item.applyLink || null,
  raw: item,
});

export default {
  key: "internshala",
  label: "Internshala",
  id: process.env.APIFY_ACTOR_INTERNSHALA || "solidcode/internshala-scraper",
  buildInput,
  mapItem,
};
