import TelegramBot from "node-telegram-bot-api";
import { TELEGRAM_BOT_TOKEN, BOT_USERNAME } from "./config";
import { BotContext, CommandType } from "./types";
import { handleStartCommand } from "./commands/start";
import { handleHelpCommand } from "./commands/help";
import { handleScanWalletCommand } from "./commands/scanWallet";
import { handleCheckContractCommand } from "./commands/checkContract";
import { handleHoneypotCommand } from "./commands/honeypot";
import { detectCommand } from "./utils/commandDetector";

// Create the bot instance
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

console.log(`RugProofAI Bot is starting up...`);

// Handle all messages
bot.on("message", async (message) => {
  try {
    // Extract the command and arguments
    const text = message.text || "";
    const { command, args } = parseCommand(text);

    // Create context object
    const ctx: BotContext = {
      message,
      command,
      args,
    };

    // Detect command type
    const commandType = detectCommand(command);

    // Route to appropriate handler
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

      default:
        // Handle unknown commands or regular messages
        if (text.startsWith("/")) {
          await bot.sendMessage(
            message.chat.id,
            `Unknown command. Type /help to see available commands.`
          );
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

// Handle errors
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

// Parse command from text
function parseCommand(text: string): { command: string; args: string[] } {
  const parts = text.split(" ");
  const commandPart = parts[0];

  // Extract command name (remove @ part if exists)
  const command = commandPart.split("@")[0].replace("/", "").toLowerCase();

  // Get arguments (everything after the command)
  const args = parts.slice(1).filter((arg) => arg.trim() !== "");

  return { command, args };
}

// Log that the bot is ready
console.log(`RugProofAI Telegram Bot is now online as @${BOT_USERNAME}`);
