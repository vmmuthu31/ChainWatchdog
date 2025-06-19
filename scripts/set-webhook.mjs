import "dotenv/config";
import fetch from "node-fetch";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

let WEBHOOK_URL =
  process.env.WEBHOOK_URL || process.env.VERCEL_URL || "https://rugproofai.com";

WEBHOOK_URL = WEBHOOK_URL.startsWith("http")
  ? WEBHOOK_URL
  : `https://${WEBHOOK_URL}`;

WEBHOOK_URL = WEBHOOK_URL.replace(/\/$/, "");

const webhook = `${WEBHOOK_URL}/api/telegram/webhook`;

async function setWebhook() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set in environment variables");
    process.exit(1);
  }

  try {
    const deleteResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`
    );
    const deleteData = await deleteResponse.json();
    console.info("Delete webhook response:", deleteData);

    const setResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: webhook,
          allowed_updates: ["message"],
        }),
      }
    );

    const setData = await setResponse.json();

    if (setData.ok) {
      console.info("Webhook set successfully!");
    } else {
      console.error("Failed to set webhook:", setData);
    }
  } catch (error) {
    console.error("Error setting webhook:", error);
  }
}

setWebhook().catch(console.error);
