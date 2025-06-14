import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Security Agent | RugProof.AI - Intelligent Crypto Protection",
  description:
    "Experience next-gen crypto security with our AI-powered analysis engine. Deep smart contract analysis, automated threat detection, and real-time protection across all major blockchains.",
  keywords:
    "AI crypto security, blockchain AI, smart contract analysis, automated security, crypto threat detection, AI token analysis, defi protection, crypto AI agent",
  openGraph: {
    title: "AI Security Agent | RugProof.AI - Intelligent Crypto Protection",
    description:
      "Experience next-gen crypto security with our AI-powered analysis engine. Deep smart contract analysis, automated threat detection, and real-time protection across all major blockchains.",
    url: "https://rugproofai.com/ai-agent",
    siteName: "RugProof.AI",
    images: [
      {
        url:
          "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now(),
        width: 1200,
        height: 630,
        alt: "RugProof.AI - Advanced AI Security Agent",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Security Agent | RugProof.AI - Intelligent Crypto Protection",
    description:
      "Experience next-gen crypto security with our AI-powered analysis engine. Deep smart contract analysis, automated threat detection, and real-time protection across all major blockchains.",
    site: "@rugproofai",
    creator: "@rugproofai",
    images: [
      "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now(),
    ],
  },
  alternates: {
    canonical: "https://rugproofai.com/ai-agent",
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
