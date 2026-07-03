// Sends alerts via the Telegram Bot API's sendMessage endpoint directly
// (a single REST call) rather than a bot-framework package - we only ever
// push messages, we never need to receive/poll updates.
async function notifyTelegram(job) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log("[telegram] Skipping: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set");
    return false;
  }

  const text = `🟢 ${job.title} @ ${job.company} (${job.source})\n${job.url}`;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[telegram] Failed to send: ${res.status} ${body}`);
    return false;
  }
  return true;
}

module.exports = { notifyTelegram };
