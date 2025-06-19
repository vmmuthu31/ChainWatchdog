import { NextRequest, NextResponse } from "next/server";
import TelegramBot from "node-telegram-bot-api";
import { BotContext, CommandType } from "../../../../lib/telegram-bot/types";
import { handleStartCommand } from "../../../../lib/telegram-bot/commands/start";
import { handleHelpCommand } from "../../../../lib/telegram-bot/commands/help";
import { handleScanWalletCommand } from "../../../../lib/telegram-bot/commands/scanWallet";
import { handleCheckContractCommand } from "../../../../lib/telegram-bot/commands/checkContract";
import { handleHoneypotCommand } from "../../../../lib/telegram-bot/commands/honeypot";
import { handleNetworksCommand } from "../../../../lib/telegram-bot/commands/networks";
import { handleGreeting } from "../../../../lib/telegram-bot/commands/greeting";
import { detectCommand } from "../../../../lib/telegram-bot/utils/commandDetector";

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

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN environment variable is not set!");
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN || "", { polling: false });

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    if (!update || !update.message) {
      return NextResponse.json({ success: true });
    }

    const message = update.message;
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
          await bot.sendMessage(
            message.chat.id,
            `Unknown command. Type /help to see available commands.`
          );
        } else if (text.trim() !== "") {
          const wasHandled = await handleDirectAddressInput(
            bot,
            text.trim(),
            message
          );
          if (!wasHandled) {
            console.info(
              `Ignored non-address message: ${text.substring(0, 20)}...`
            );
          }
        }
        break;
    }

    return NextResponse.json(
      {
        success: true,
        ok: true,
        processed: true,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error handling webhook update:", error);
    return NextResponse.json(
      {
        success: false,
        ok: true,
        error:
          error instanceof Error ? error.message : "Failed to process update",
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}

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
