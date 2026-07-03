function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Word-boundary match, not plain substring: short keywords like "AI" or "ML"
// would otherwise match inside "Cairns", "Sustainability", "Maintenance", etc.
function matchesKeywords(job, keywords) {
  const haystack = `${job.title} ${job.company || ""}`;
  return keywords.some((kw) => {
    const re = new RegExp(`\\b${escapeRegex(kw)}\\b`, "i");
    return re.test(haystack);
  });
}

module.exports = { matchesKeywords };
