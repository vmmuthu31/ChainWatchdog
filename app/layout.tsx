import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProvider from "@/lib/provider/ClientProvider";
import { ReactNode } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RugProof.AI - Advanced Crypto Security & Token Analysis Platform",
  description: "Protect your crypto investments with AI-powered security tools. Detect spam tokens, honeypots, and scams across multiple blockchains. Real-time analysis and automated protection for DeFi traders.",
  keywords: "crypto security, token scanner, honeypot detector, defi protection, blockchain security, crypto scam prevention, smart contract analysis, rugpull detection",
  openGraph: {
    title: "RugProof.AI - Advanced Crypto Security & Token Analysis Platform",
    description: "Protect your crypto investments with AI-powered security tools. Detect spam tokens, honeypots, and scams across multiple blockchains. Real-time analysis and automated protection for DeFi traders.",
    url: "https://rugproofai.com",
    siteName: "RugProof.AI",
    images: [
      {
        url: "https://rugproofai.com/newbanner.png?v=5&t=" + Date.now(),
        width: 1200,
        height: 630,
        alt: "RugProof.AI - Advanced Crypto Security Platform",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RugProof.AI - Advanced Crypto Security & Token Analysis Platform",
    description: "Protect your crypto investments with AI-powered security tools. Detect spam tokens, honeypots, and scams across multiple blockchains. Real-time analysis and automated protection for DeFi traders.",
    site: "@rugproofai",
    creator: "@rugproofai",
    images: ["https://rugproofai.com/newbanner.png?v=5&t=" + Date.now()],
  },
  alternates: {
    canonical: "https://rugproofai.com",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/fix-selection.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          property="og:title"
          content="RugProof - Protect Your Crypto Assets"
        />
        <meta
          property="og:description"
          content="Detect and protect against crypto spam, honeypots, and scams"
        />
        <meta
          property="og:image"
          content={
            "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now()
          }
        />
        <meta property="og:url" content="https://rugproofai.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="RugProof" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@rugproofai" />
        <meta
          name="twitter:title"
          content="RugProof - Protect Your Crypto Assets"
        />
        <meta
          name="twitter:description"
          content="Detect and protect against crypto spam, honeypots, and scams"
        />
        <meta
          name="twitter:image"
          content={
            "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now()
          }
        />
        <meta name="twitter:image:alt" content="RugProof Banner" />

        {/* Telegram specific meta tags */}
        <meta property="telegram:channel" content="@rugproofai" />
        <meta
          property="telegram:image"
          content={
            "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now()
          }
        />

        {/* Force cache refresh */}
        <meta
          http-equiv="Cache-Control"
          content="no-cache, no-store, must-revalidate"
        />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />

        <style
          dangerouslySetInnerHTML={{
            __html: `
          input::selection { background-color: rgba(0, 255, 0, 0.5) !important; color: #00ffff !important; -webkit-text-fill-color: #00ffff !important; }
          input, input:focus, input:active { color: #00ffff !important; -webkit-text-fill-color: #00ffff !important; background-color: #111 !important; }
          ::selection { color: #00ffff !important; -webkit-text-fill-color: #00ffff !important; background-color: rgba(0, 255, 0, 0.5) !important; }
          input:-webkit-autofill, input:-webkit-autofill:focus { -webkit-box-shadow: 0 0 0 1000px #000000 inset !important; -webkit-text-fill-color: #00ffff !important; }
          input:-internal-autofill-selected { background-color: #000000 !important; -webkit-text-fill-color: #00ffff !important; color: #00ffff !important; }
        `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
