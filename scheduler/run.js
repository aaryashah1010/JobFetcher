require("dotenv").config();
const path = require("path");
const config = require("../config.json");
const { matchesKeywords } = require("../lib/matchKeywords");
const { insertIfNew, markNotified } = require("../storage/db");
const { notifyTelegram } = require("../notify/telegram");

const { fetchArbeitnow } = require("../fetchers/arbeitnow");
const { fetchRemoteOK } = require("../fetchers/remoteok");
const { fetchAdzuna } = require("../fetchers/adzuna");
const { fetchJooble } = require("../fetchers/jooble");
const { fetchLinkedinFromGmail } = require("../fetchers/linkedin_gmail");

const FETCHERS = {
  arbeitnow: () => fetchArbeitnow(),
  remoteok: () => fetchRemoteOK(),
  adzuna: () => fetchAdzuna(config.sources.adzuna),
  jooble: () => fetchJooble(config.sources.jooble),
  linkedin_gmail: () => fetchLinkedinFromGmail(config.sources.linkedin_gmail),
};

async function run() {
  const keywords = config.keywords || [];
  let totalFetched = 0;
  let totalMatched = 0;
  let totalNew = 0;
  let totalNotified = 0;

  for (const [name, sourceConfig] of Object.entries(config.sources)) {
    if (!sourceConfig.enabled) {
      console.log(`[${name}] disabled, skipping`);
      continue;
    }
    const fetchFn = FETCHERS[name];
    if (!fetchFn) {
      console.warn(`[${name}] no fetcher registered, skipping`);
      continue;
    }

    console.log(`[${name}] fetching...`);
    let jobs = [];
    try {
      jobs = await fetchFn();
    } catch (err) {
      console.error(`[${name}] fetch failed: ${err.message}`);
      continue;
    }
    totalFetched += jobs.length;
    console.log(`[${name}] fetched ${jobs.length} jobs`);

    const matched = jobs.filter((job) => matchesKeywords(job, keywords));
    totalMatched += matched.length;
    console.log(`[${name}] ${matched.length} match keywords`);

    for (const job of matched) {
      if (!job.url || !job.title) continue;
      const row = insertIfNew(job);
      if (row.isNew) {
        totalNew++;
        console.log(`[${name}] NEW: ${job.title} @ ${job.company}`);
        const sent = await notifyTelegram(job);
        if (sent) {
          markNotified(row.id);
          totalNotified++;
        }
      }
    }
  }

  console.log("----------------------------------------");
  console.log(
    `Done. fetched=${totalFetched} matched=${totalMatched} new=${totalNew} notified=${totalNotified}`
  );
}

run().catch((err) => {
  console.error("Fatal error in scheduler run:", err);
  process.exit(1);
});
