import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "TELEGRAM_BOT_TOKEN not set in environment variables",
        },
        { status: 500 }
      );
    }

    let webhookBaseUrl = process.env.WEBHOOK_URL || process.env.VERCEL_URL;
    if (!webhookBaseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "WEBHOOK_URL or VERCEL_URL not set in environment variables",
        },
        { status: 500 }
      );
    }

    webhookBaseUrl = webhookBaseUrl.startsWith("http")
      ? webhookBaseUrl
      : `https://${webhookBaseUrl}`;

    webhookBaseUrl = webhookBaseUrl.replace(/\/$/, "");

    const webhookUrl = `${webhookBaseUrl}/api/telegram/webhook`;

    const deleteRes = await fetch(
      `https://api.telegram.org/bot${token}/deleteWebhook`
    );
    const deleteData = await deleteRes.json();

    const setRes = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ["message"],
        }),
      }
    );

    const setData = await setRes.json();

    const infoRes = await fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`
    );
    const infoData = await infoRes.json();

    return NextResponse.json({
      success: true,
      deleteResponse: deleteData,
      setResponse: setData,
      webhookInfo: infoData,
      webhookUrl,
    });
  } catch (error) {
    console.error("Error setting webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
