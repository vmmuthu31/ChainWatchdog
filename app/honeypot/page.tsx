import type { Metadata } from "next";
import { Suspense } from "react";
import HoneyPot from "./Components";
import { Loader2 } from "lucide-react";
import { pixelMonoFont } from "@/lib/font";

export const metadata: Metadata = {
  title: "Honeypot Scanner | RugProofAI",
  description:
    "Instantly detect honeypot scams and malicious tokens across multiple blockchains. Advanced real-time analysis, buy/sell simulation, and detailed risk assessment for safer crypto trading.",
  keywords:
    "honeypot detector, crypto scam detection, token scanner, rugpull prevention, defi security, token analysis, smart contract verification, crypto security tools",
  openGraph: {
    title: "Honeypot Scanner | RugProof.AI",
    description:
      "Instantly detect honeypot scams and malicious tokens across multiple blockchains. Advanced real-time analysis, buy/sell simulation, and detailed risk assessment for safer crypto trading.",
    url: "https://rugproofai.com/honeypot",
    siteName: "RugProof.AI",
    images: [
      {
        url:
          "https://rugproofai.com/newbanner.png?v=5&t=" +
          Date.now() +
          "&page=honeypot",
        width: 1200,
        height: 630,
        alt: "RugProof.AI Honeypot Scanner - Advanced Token Analysis",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Honeypot Scanner | RugProof.AI",
    description:
      "Instantly detect honeypot scams and malicious tokens across multiple blockchains. Advanced real-time analysis, buy/sell simulation, and detailed risk assessment for safer crypto trading.",
    site: "@rugproofai",
    creator: "@rugproofai",
    images: [
      "https://rugproofai.com/newbanner.png?v=5&t=" +
        Date.now() +
        "&page=honeypot",
    ],
  },
  alternates: {
    canonical: "https://rugproofai.com/honeypot",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
};

export default function HoneypotPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
          <Loader2 className="h-12 w-12 animate-spin text-[#ffa500]" />
          <p className={`${pixelMonoFont.className} mt-4 text-[#ffa500]`}>
            Loading honeypot scanner...
          </p>
        </div>
      }
    >
      <HoneyPot />
    </Suspense>
  );
}
