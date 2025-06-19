import TelegramBot from "node-telegram-bot-api";
import { BotContext } from "../types";

export async function handleGreeting(
  bot: TelegramBot,
  ctx: BotContext
): Promise<void> {
  const { message: msg } = ctx;
  const chatId = msg.chat.id;

  const firstName = msg.from?.first_name || "there";

  const messageText = `Hello ${firstName}! 👋 Welcome to RugProofAI Bot.

I'm here to help you analyze tokens and wallets across multiple blockchains. Here's what you can do:

• Scan a wallet: \`/scan <address> <chain-id>\`
• Check a token: \`/honeypot <contract> <chain-id>\`
• Scan a Believe token: \`/believe <contract> \`
• See supported networks: \`/networks\`
• Get help: \`/help\`

Try out our wallet scanning feature to get started!`;

  await bot.sendMessage(chatId, messageText, { parse_mode: "Markdown" });
}
