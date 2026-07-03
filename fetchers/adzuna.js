// Phase 2 - not yet wired up. Requires ADZUNA_APP_ID / ADZUNA_APP_KEY.
// Docs: https://developer.adzuna.com/
async function fetchAdzuna(sourceConfig = {}) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    console.log("[adzuna] Skipping: ADZUNA_APP_ID / ADZUNA_APP_KEY not set");
    return [];
  }

  const country = sourceConfig.country || "in";
  const resultsPerPage = sourceConfig.resultsPerPage || 50;
  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=${resultsPerPage}&content-type=application/json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Adzuna API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const jobs = data.results || [];

  return jobs.map((job) => ({
    title: job.title,
    company: job.company?.display_name,
    location: job.location?.display_name,
    url: job.redirect_url,
    source: "adzuna",
    postedAt: job.created ? new Date(job.created).toISOString() : null,
  }));
}

module.exports = { fetchAdzuna };
