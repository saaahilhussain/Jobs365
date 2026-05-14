const buildInput = ({ query, location, limit }) => {
  // Internshala uses category paths like /internships/keywords-react/
  const keyword = query.trim().replace(/\s+/g, "-").toLowerCase();
  const url = `https://internshala.com/internships/keywords-${encodeURIComponent(
    keyword,
  )}/`;
  return {
    startUrls: [{ url }],
    location, // not always used by the actor, but kept for parity
    maxItems: limit,
  };
};

const mapItem = (item) => ({
  title: item.title || item.role || "Untitled internship",
  company:
    item.company || item.companyName || item.employer || "Unknown company",
  source: "internshala",
  externalId: item.id || item.internshipId || null,
  location: item.location || null,
  url: item.url || item.applyLink || null,
  raw: item,
});

export default {
  key: "internshala",
  label: "Internshala",
  // No canonical Apify actor — provide via APIFY_ACTOR_INTERNSHALA env.
  id: process.env.APIFY_ACTOR_INTERNSHALA || "",
  buildInput,
  mapItem,
};
