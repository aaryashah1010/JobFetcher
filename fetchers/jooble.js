// Phase 2 - not yet wired up. Requires JOOBLE_API_KEY.
// Docs: https://jooble.org/api/about
async function fetchJooble(sourceConfig = {}) {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    console.log("[jooble] Skipping: JOOBLE_API_KEY not set");
    return [];
  }

  const url = `https://jooble.org/api/${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keywords: sourceConfig.keywords || "software engineer",
      location: sourceConfig.location || "India",
    }),
  });
  if (!res.ok) {
    throw new Error(`Jooble API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const jobs = data.jobs || [];

  return jobs.map((job) => ({
    title: job.title,
    company: job.company,
    location: job.location,
    url: job.link,
    source: "jooble",
    postedAt: job.updated ? new Date(job.updated).toISOString() : null,
  }));
}

module.exports = { fetchJooble };
