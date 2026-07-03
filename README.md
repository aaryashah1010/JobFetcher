# Job Tracker

A zero-cost job-opening tracker for SDE / Backend / AI-ML roles: pulls fresh
postings from multiple sources, dedupes them, shows them in a local
dashboard, and pings you on Telegram when something new matches.

## Status

- **Working now:** Arbeitnow + RemoteOK fetchers, SQLite storage with dedupe,
  Telegram notifications, local dashboard, GitHub Actions cron.
- **Phase 2 (stubbed, disabled by default):** Adzuna, Jooble, LinkedIn-via-Gmail.
  The fetcher files exist with the right shape but return `[]` until you add
  API keys and flip `enabled: true` in `config.json`.

## Quick start (local)

```bash
npm install
cp .env.example .env
# edit config.json if you want to change keywords/locations/sources
npm run fetch        # fetches jobs, stores new ones, sends Telegram alerts
npm run dashboard     # http://localhost:4321
```

`npm run fetch` works with zero configuration for Arbeitnow/RemoteOK — no
API keys needed. Telegram alerts are skipped (with a log line) until you set
`TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`.

## How matching works

`config.json` has a `keywords` array (`SDE`, `Software Engineer`, `Backend`,
`AI`, `ML`, `Machine Learning`, ...). A job is kept if any keyword appears as
a **whole word** in its title or company name (case-insensitive). Whole-word
matching matters: a naive substring check would match "AI" inside
"Sustainability" or "Cairns" — this was caught during testing and fixed in
[lib/matchKeywords.js](lib/matchKeywords.js).

Edit the `keywords` array any time; no code changes needed.

## Dedupe

Every job is hashed from `title + company + url` (lowercased, trimmed) —
see [lib/hash.js](lib/hash.js). The hash is the SQLite `UNIQUE` key, so the
same posting re-appearing across sources or across scheduler runs is only
ever notified once.

## Setting up Telegram alerts

1. Message [@BotFather](https://t.me/BotFather) on Telegram, run `/newbot`,
   follow the prompts. You'll get a bot token like `123456:ABC-DEF...`.
2. Send your new bot any message (e.g. "hi") so it has a chat to reply to.
3. Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser —
   find `"chat":{"id": ...}` in the JSON. That number is your chat id.
4. Put both values in `.env`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
   TELEGRAM_CHAT_ID=987654321
   ```

## Setting up Adzuna (Phase 2)

1. Register at https://developer.adzuna.com/ (free tier: 250 calls/day).
2. Copy your `app_id` and `app_key` into `.env` as `ADZUNA_APP_ID` /
   `ADZUNA_APP_KEY`.
3. Set `"sources.adzuna.enabled": true` in `config.json`.

## Setting up Jooble (Phase 2)

1. Request a free API key at https://jooble.org/api/about.
2. Put it in `.env` as `JOOBLE_API_KEY`.
3. Set `"sources.jooble.enabled": true` in `config.json`.

## Setting up LinkedIn via Gmail (Phase 2)

LinkedIn has no free public jobs API and scraping linkedin.com violates its
ToS, so this project never touches linkedin.com directly. Instead:

1. On LinkedIn, set up a native **job alert** ("Email me for these jobs") for
   your target search — this is a normal, allowed LinkedIn feature.
2. LinkedIn will start emailing you new matching postings.
3. Enable the Gmail API for your own Google account and create OAuth
   credentials (Google Cloud Console → APIs & Services → Credentials →
   OAuth client ID, type "Desktop app").
4. Generate a refresh token for your own Gmail account scoped to
   `gmail.readonly` (any standard Node "get a Gmail refresh token" script
   works — this is a one-time manual step you run locally).
5. Put `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` in
   `.env`.
6. Set `"sources.linkedin_gmail.enabled": true` in `config.json`.
7. The actual Gmail-fetch-and-parse logic still needs to be implemented in
   [fetchers/linkedin_gmail.js](fetchers/linkedin_gmail.js) (the TODO steps
   are written out in that file) — ask to build this out when you're ready
   to wire it up.

This reads mail already delivered to your own inbox because you subscribed
to it — not scraping LinkedIn's site.

## Automating with GitHub Actions (free, zero servers)

[.github/workflows/fetch.yml](.github/workflows/fetch.yml) runs
`scheduler/run.js` every 3 hours via cron, then commits the updated
`storage/jobs.db` back to the repo so `git pull` gives you the latest data
for the local dashboard.

Setup:

1. Push this repo to GitHub (public repo = unlimited free Actions minutes;
   private = 2000 free min/month, and 8 runs/day × ~1 min ≈ 240 min/month
   fits easily either way).
2. In the repo's **Settings → Secrets and variables → Actions**, add
   whichever of these you're using: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`,
   `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `JOOBLE_API_KEY`, `GMAIL_CLIENT_ID`,
   `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`.
3. Commit and push `storage/jobs.db` once (even empty) so the workflow has
   something to update — `node scheduler/run.js` locally will create it.
4. That's it — the workflow runs on schedule, or trigger it manually from
   the Actions tab (`workflow_dispatch`).
5. `git pull` locally any time, then `npm run dashboard` to browse.

## Project layout

```
job-tracker/
  fetchers/            one file per source, each exports an async fn
                        returning [{title, company, location, url, source, postedAt}]
  lib/                  shared keyword matching + hashing
  storage/db.js         SQLite (better-sqlite3), dedupe-on-insert
  notify/telegram.js     one REST call per new match, no bot-framework dependency
  dashboard/             Express API + static single-page table UI
  scheduler/run.js       orchestrates fetch -> filter -> dedupe -> store -> notify
  .github/workflows/     cron automation
  config.json            keywords / locations / per-source settings
```

## Design notes

- **SQLite over a hosted DB** — zero cost, zero setup, plenty for this scale.
- **GitHub Actions cron over a server** — free, no always-on process needed.
- **Telegram Bot API called directly via `fetch`** rather than a bot-framework
  package — we only ever push messages, never poll for updates, so a raw
  `sendMessage` call is simpler and has one fewer dependency.
- **Dedupe by content hash**, not per-source ID — the same posting mirrored
  across boards only notifies once.
- **Dashboard is not a 24/7 service** — it's a small Express server you start
  when you want to browse; the actual fetching/alerting runs on the GitHub
  Actions schedule independently.
