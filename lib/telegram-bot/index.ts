import TelegramBot from "node-telegram-bot-api";
import { TELEGRAM_BOT_TOKEN, BOT_USERNAME } from "./config";
import { BotContext, CommandType } from "./types";
import { handleStartCommand } from "./commands/start";
import { handleHelpCommand } from "./commands/help";
import { handleScanWalletCommand } from "./commands/scanWallet";
import { handleCheckContractCommand } from "./commands/checkContract";
import { handleHoneypotCommand } from "./commands/honeypot";
import { handleNetworksCommand } from "./commands/networks";
import { handleGreeting } from "./commands/greeting";
import { detectCommand } from "./utils/commandDetector";

/**
 * Handle direct address input (without commands) from users
 * This provides a more user-friendly experience for pasting addresses
 */
async function handleDirectAddressInput(
  bot: TelegramBot,
  text: string,
  message: TelegramBot.Message
): Promise<boolean> {
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  const isEvm = ethAddressRegex.test(text);
  const isSolana = solanaAddressRegex.test(text);

  if (!isEvm && !isSolana) {
    return false;
  }

  const ctx: BotContext = {
    message,
    command: "honeypot",
    args: [text],
  };

  await handleHoneypotCommand(bot, ctx);
  return true;
}

/**
 * Handle irrelevant or unrecognized messages
 */
async function handleIrrelevantMessage(
  bot: TelegramBot,
  message: TelegramBot.Message
): Promise<void> {
  const helpMessage = `
🔐 *Hey! I'm RugProofAI Telegram Bot* 

I'm here to help you with *crypto security analysis* only! 

*🚀 What I can do:*
• Analyze tokens for honeypots and scams
• Check smart contract security
• Scan wallet addresses for risks
• Provide liquidity and holder analysis

*📋 How to use me:*
• Paste any token address directly
• Use \`/scan <address>\` for full analysis
• Type \`/help\` for detailed commands

*Example:*
\`0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE\`

❌ *I can't help with:*
General questions, news, or non-crypto topics

🔍 *Ready to scan some tokens?* Just paste an address!
`;

  await bot.sendMessage(message.chat.id, helpMessage, {
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  });
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

console.info(`RugProofAI Bot is starting up...`);

bot.on("message", async (message) => {
  try {
    const text = message.text || "";
    const { command, args } = parseCommand(text);

    const ctx: BotContext = {
      message,
      command,
      args,
    };

    const commandType = detectCommand(command);

    switch (commandType) {
      case CommandType.START:
        await handleStartCommand(bot, ctx);
        break;

      case CommandType.HELP:
        await handleHelpCommand(bot, ctx);
        break;

      case CommandType.SCAN_WALLET:
        await handleScanWalletCommand(bot, ctx);
        break;

      case CommandType.CHECK_CONTRACT:
        await handleCheckContractCommand(bot, ctx);
        break;

      case CommandType.HONEYPOT:
        await handleHoneypotCommand(bot, ctx);
        break;

      case CommandType.NETWORKS:
        await handleNetworksCommand(bot, ctx);
        break;

      case CommandType.GREETING:
        await handleGreeting(bot, ctx);
        break;

      default:
        if (text.startsWith("/")) {
          // Handle unknown commands
          await handleIrrelevantMessage(bot, message);
        } else if (text.trim() !== "") {
          // Try to handle direct address input first
          const wasHandled = await handleDirectAddressInput(
            bot,
            text.trim(),
            message
          );

          // If it wasn't a valid address, handle as irrelevant message
          if (!wasHandled) {
            await handleIrrelevantMessage(bot, message);
          }
        }
        break;
    }
  } catch (error) {
    console.error("Error handling message:", error);
    try {
      await bot.sendMessage(
        message.chat.id,
        "An error occurred while processing your request. Please try again later."
      );
    } catch (sendError) {
      console.error("Error sending error message:", sendError);
    }
  }
});

bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

function parseCommand(text: string): { command: string; args: string[] } {
  const parts = text.split(" ");
  const commandPart = parts[0];

  const lowerText = text.toLowerCase().trim();
  if (
    !text.startsWith("/") &&
    (lowerText === "hi" ||
      lowerText === "hello" ||
      lowerText === "hey" ||
      lowerText === "hi!" ||
      lowerText === "hello!" ||
      lowerText === "hey!")
  ) {
    return { command: lowerText, args: [] };
  }

  const command = commandPart.split("@")[0].replace("/", "").toLowerCase();

  const args = parts.slice(1).filter((arg) => arg.trim() !== "");

  return { command, args };
}

console.info(`RugProofAI Telegram Bot is now online as @${BOT_USERNAME}`);
