import dotenv from "dotenv";

dotenv.config();

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

if (!TELEGRAM_BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN is required in your .env file");
  process.exit(1);
}

export const BOT_USERNAME = process.env.BOT_USERNAME || "RugProofAIBot";
