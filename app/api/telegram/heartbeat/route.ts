import { NextResponse } from "next/server";
import TelegramBot from "node-telegram-bot-api";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function GET() {
  try {
    const bot = new TelegramBot(TELEGRAM_BOT_TOKEN || "", { polling: false });

    const me = await bot.getMe();

    console.log(`Bot heartbeat: @${me.username} is online`);

    return NextResponse.json({
      success: true,
      message: `Bot @${me.username} is online`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Bot heartbeat error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to contact Telegram API",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
