import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Check if this is a request to the Telegram webhook endpoint
  if (request.nextUrl.pathname.startsWith("/api/telegram/webhook")) {
    console.log("Telegram webhook request detected");

    // Special handling for Telegram webhook
    const response = NextResponse.next();

    // Add headers specifically for Telegram webhook
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Connection", "keep-alive");

    return response;
  }

  // Default handling for other API routes
  const response = NextResponse.next();

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
