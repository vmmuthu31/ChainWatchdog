import TelegramBot from "node-telegram-bot-api";
import { BotContext } from "../types";

export async function handleStartCommand(
  bot: TelegramBot,
  ctx: BotContext
): Promise<void> {
  const { message } = ctx;
  const chatId = message.chat.id;
  const firstName = message.from?.first_name || "there";

  const welcomeMessage = `
👋 Hello, ${firstName}! 

Welcome to *RugProofAI Bot* - your crypto security assistant.

I can help you:
• 🔍 Scan wallets for spam tokens
• 🔎 Check if a contract is a honeypot
• ⚠️ Analyze contract security

*Quick Analysis:*
Simply paste any Ethereum or Solana token address directly into the chat for instant analysis!

*Detailed Commands:*
/scan <wallet_address> [chain_id] - Scan a wallet for spam tokens
/honeypot <token_address> [chain_id] - Check if a token is a honeypot
/contract <contract_address> [chain_id] - Check contract security
/help - Show all available commands

By default, I'll use Ethereum mainnet, but you can specify a different blockchain by adding the chain ID.
  `;

  await bot.sendMessage(chatId, welcomeMessage, { parse_mode: "Markdown" });
}
