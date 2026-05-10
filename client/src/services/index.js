// Placeholder services directory
// Service files will contain business logic that bridges API calls and component state
// These will be implemented when backend integration begins

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const truncate = (str, len = 50) => {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
};
