import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Honeypot Scanner | RugProof.AI - Detect Token Scams Instantly",
  description:
    "Instantly detect honeypot scams and malicious tokens across multiple blockchains. Advanced real-time analysis, buy/sell simulation, and detailed risk assessment for safer crypto trading.",
  keywords:
    "honeypot detector, crypto scam detection, token scanner, rugpull prevention, defi security, token analysis, smart contract verification, crypto security tools",
  openGraph: {
    title: "Honeypot Scanner | RugProof.AI - Detect Token Scams Instantly",
    description:
      "Instantly detect honeypot scams and malicious tokens across multiple blockchains. Advanced real-time analysis, buy/sell simulation, and detailed risk assessment for safer crypto trading.",
    url: "https://rugproofai.com/honeypot",
    siteName: "RugProof.AI",
    images: [
      {
        url:
          "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now(),
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
    title: "Honeypot Scanner | RugProof.AI - Detect Token Scams Instantly",
    description:
      "Instantly detect honeypot scams and malicious tokens across multiple blockchains. Advanced real-time analysis, buy/sell simulation, and detailed risk assessment for safer crypto trading.",
    site: "@rugproofai",
    creator: "@rugproofai",
    images: [
      "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now(),
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

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
