// Phase 2 - not yet wired up. Reads the user's own Gmail inbox (OAuth) for
// LinkedIn "job alert" emails and parses postings out of the HTML body.
// Requires GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN.
// This does NOT scrape linkedin.com - it only reads emails LinkedIn already
// sent to the user's own inbox because they subscribed to a job alert.
async function fetchLinkedinFromGmail(sourceConfig = {}) {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    console.log("[linkedin_gmail] Skipping: GMAIL_* env vars not set");
    return [];
  }

  // TODO (Phase 2):
  // 1. Exchange the refresh token for an access token via the Google OAuth2 endpoint.
  // 2. Call Gmail API: GET /gmail/v1/users/me/messages?q=<sourceConfig.query>
  // 3. For each message, fetch the full payload and decode the HTML body.
  // 4. Parse job title / company / link out of LinkedIn's alert email markup
  //    (they use repeated <table> blocks per job - look for anchor tags whose
  //    href contains "/jobs/view/").
  // 5. Return normalized {title, company, location, url, source, postedAt} objects.
  console.log("[linkedin_gmail] Not yet implemented - see README Phase 2");
  return [];
}

module.exports = { fetchLinkedinFromGmail };
