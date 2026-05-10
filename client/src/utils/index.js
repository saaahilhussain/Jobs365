// Utility functions for the application

/**
 * Get color class based on a numeric score
 */
export const getScoreColor = (score, invert = false) => {
  if (invert) {
    // Higher = worse (e.g., scam score)
    if (score >= 40) return "text-red-600";
    if (score >= 20) return "text-yellow-600";
    return "text-green-600";
  }
  // Higher = better (e.g., relevance score)
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
};

/**
 * Debounce a function call
 */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
