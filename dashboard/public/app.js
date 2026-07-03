const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const searchInput = document.getElementById("search");
const sourceFilter = document.getElementById("sourceFilter");
const jobsBody = document.getElementById("jobsBody");
const emptyState = document.getElementById("emptyState");
const countEl = document.getElementById("count");

let debounceTimer;

async function loadSources() {
  const res = await fetch("/api/sources");
  const sources = await res.json();
  for (const s of sources) {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    sourceFilter.appendChild(opt);
  }
}

async function loadJobs() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
  if (sourceFilter.value) params.set("source", sourceFilter.value);

  const res = await fetch(`/api/jobs?${params.toString()}`);
  const jobs = await res.json();
  renderJobs(jobs);
}

function renderJobs(jobs) {
  jobsBody.innerHTML = "";
  countEl.textContent = `${jobs.length} job${jobs.length === 1 ? "" : "s"}`;
  emptyState.hidden = jobs.length > 0;

  const now = Date.now();
  for (const job of jobs) {
    const tr = document.createElement("tr");
    const isNew = now - new Date(job.first_seen).getTime() < ONE_DAY_MS;

    tr.innerHTML = `
      <td>${isNew ? '<span class="badge-new">NEW</span>' : ""}</td>
      <td><a href="${escapeAttr(job.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(job.title)}</a></td>
      <td>${escapeHtml(job.company || "")}</td>
      <td>${escapeHtml(job.location || "")}</td>
      <td><span class="source-tag">${escapeHtml(job.source)}</span></td>
      <td>${new Date(job.first_seen).toLocaleString()}</td>
    `;
    jobsBody.appendChild(tr);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadJobs, 250);
});
sourceFilter.addEventListener("change", loadJobs);

(async function init() {
  await loadSources();
  await loadJobs();
})();
