import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Validate configuration
if (!TELEGRAM_BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN is required in your .env file');
  process.exit(1);
}

export const BOT_USERNAME = process.env.BOT_USERNAME || 'RugProofAIBot';
