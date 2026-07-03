const crypto = require("crypto");

function hashJob(job) {
  const normalized = `${job.title}|${job.company}|${job.url}`
    .toLowerCase()
    .trim();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

module.exports = { hashJob };
