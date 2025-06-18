import { NextResponse } from "next/server";

export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const webhookUrl = process.env.WEBHOOK_URL || process.env.VERCEL_URL;

    const maskedToken = botToken
      ? `${botToken.substring(0, 5)}...${botToken.substring(
          botToken.length - 5
        )}`
      : "Not set";

    return NextResponse.json({
      status: "OK",
      environment: process.env.NODE_ENV,
      botTokenSet: !!process.env.TELEGRAM_BOT_TOKEN,
      maskedToken,
      webhookUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        status: "Error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
