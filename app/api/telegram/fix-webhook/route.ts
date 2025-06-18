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

    const webhookBaseUrl = process.env.WEBHOOK_URL || process.env.VERCEL_URL;
    if (!webhookBaseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "WEBHOOK_URL or VERCEL_URL not set in environment variables",
        },
        { status: 500 }
      );
    }

    let webhookUrl = webhookBaseUrl.startsWith("http")
      ? webhookBaseUrl
      : `https://${webhookBaseUrl}`;

    webhookUrl = webhookUrl.replace(/\/$/, "");

    webhookUrl = `${webhookUrl}/api/telegram/webhook`;

    const infoBeforeRes = await fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`
    );
    const infoBeforeData = await infoBeforeRes.json();

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
          drop_pending_updates: true,
        }),
      }
    );

    const setData = await setRes.json();

    const infoAfterRes = await fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`
    );
    const infoAfterData = await infoAfterRes.json();

    return NextResponse.json({
      success: true,
      webhookBefore: infoBeforeData,
      deleteResponse: deleteData,
      setResponse: setData,
      webhookAfter: infoAfterData,
      webhookUrl,
    });
  } catch (error) {
    console.error("Error fixing webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
