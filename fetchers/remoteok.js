const API_URL = "https://remoteok.com/api";

// Returns normalized jobs: {title, company, location, url, source, postedAt}
// RemoteOK's first array element is a legal-notice object, not a job - skip it.
async function fetchRemoteOK() {
  const res = await fetch(API_URL, {
    headers: { "User-Agent": "job-tracker (personal use)" },
  });
  if (!res.ok) {
    throw new Error(`RemoteOK API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const jobs = Array.isArray(data) ? data.filter((j) => j.id) : [];

  return jobs.map((job) => ({
    title: job.position,
    company: job.company,
    location: job.location || "Remote",
    url: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
    source: "remoteok",
    postedAt: job.date ? new Date(job.date).toISOString() : null,
  }));
}

module.exports = { fetchRemoteOK };
