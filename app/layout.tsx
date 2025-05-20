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
  title: "RugProof - Protect Your Crypto Assets",
  description: "Detect and protect against crypto spam, honeypots, and scams",
  openGraph: {
    title: "RugProof - Protect Your Crypto Assets",
    description: "Detect and protect against crypto spam, honeypots, and scams",
    url: "https://rugproofai.com",
    siteName: "RugProof",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "RugProof Banner",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RugProof - Protect Your Crypto Assets",
    description: "Detect and protect against crypto spam, honeypots, and scams",
    images: ["/banner.png"],
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
        <meta
          property="og:title"
          content="RugProof - Protect Your Crypto Assets"
        />
        <meta
          property="og:description"
          content="Detect and protect against crypto spam, honeypots, and scams"
        />
        <meta property="og:image" content="/banner.png" />
        <meta property="og:url" content="https://rugproofai.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="RugProof - Protect Your Crypto Assets"
        />
        <meta
          name="twitter:description"
          content="Detect and protect against crypto spam, honeypots, and scams"
        />
        <meta name="twitter:image" content="/banner.png" />
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
