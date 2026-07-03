const API_URL = "https://www.arbeitnow.com/api/job-board-api";

// Returns normalized jobs: {title, company, location, url, source, postedAt}
async function fetchArbeitnow() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`Arbeitnow API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const jobs = data.data || [];

  return jobs.map((job) => ({
    title: job.title,
    company: job.company_name,
    location: job.location || (job.remote ? "Remote" : ""),
    url: job.url,
    source: "arbeitnow",
    postedAt: job.created_at
      ? new Date(job.created_at * 1000).toISOString()
      : null,
  }));
}

module.exports = { fetchArbeitnow };
