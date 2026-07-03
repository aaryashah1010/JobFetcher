const path = require("path");
const Database = require("better-sqlite3");
const { hashJob } = require("../lib/hash");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "jobs.db");

let db;

function getDb() {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      company TEXT,
      location TEXT,
      url TEXT,
      source TEXT NOT NULL,
      posted_at TEXT,
      first_seen TEXT NOT NULL,
      notified INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_jobs_first_seen ON jobs(first_seen);
    CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
  `);
  return db;
}

// Inserts the job if its hash isn't already present. Returns the row
// (with an isNew flag) either way, so callers can decide what to notify.
function insertIfNew(job) {
  const database = getDb();
  const hash = hashJob(job);
  const existing = database.prepare("SELECT * FROM jobs WHERE hash = ?").get(hash);
  if (existing) {
    return { ...existing, isNew: false };
  }
  const firstSeen = new Date().toISOString();
  const stmt = database.prepare(`
    INSERT INTO jobs (hash, title, company, location, url, source, posted_at, first_seen, notified)
    VALUES (@hash, @title, @company, @location, @url, @source, @posted_at, @first_seen, 0)
  `);
  const info = stmt.run({
    hash,
    title: job.title,
    company: job.company || null,
    location: job.location || null,
    url: job.url,
    source: job.source,
    posted_at: job.postedAt || null,
    first_seen: firstSeen,
  });
  return {
    id: info.lastInsertRowid,
    hash,
    title: job.title,
    company: job.company,
    location: job.location,
    url: job.url,
    source: job.source,
    posted_at: job.postedAt,
    first_seen: firstSeen,
    notified: 0,
    isNew: true,
  };
}

function markNotified(id) {
  getDb().prepare("UPDATE jobs SET notified = 1 WHERE id = ?").run(id);
}

function getAllJobs({ source, search, since } = {}) {
  const database = getDb();
  let query = "SELECT * FROM jobs WHERE 1=1";
  const params = [];

  if (source) {
    query += " AND source = ?";
    params.push(source);
  }
  if (search) {
    query += " AND (LOWER(title) LIKE ? OR LOWER(company) LIKE ?)";
    const term = `%${search.toLowerCase()}%`;
    params.push(term, term);
  }
  if (since) {
    query += " AND first_seen >= ?";
    params.push(since);
  }

  query += " ORDER BY first_seen DESC";
  return database.prepare(query).all(...params);
}

module.exports = { getDb, insertIfNew, markNotified, getAllJobs };
