import { Metadata } from "next";

export const metadata: Metadata = {
  title: "RugProof - AI Security Agent",
  description:
    "Advanced AI-powered crypto security analysis. Detect scams, analyze smart contracts, and protect your investments.",
  openGraph: {
    title: "RugProof - AI Security Agent",
    description:
      "Advanced AI-powered crypto security analysis. Detect scams, analyze smart contracts, and protect your investments.",
    url: "https://rugproofai.com/ai-agent",
    siteName: "RugProof",
    images: [
      {
        url:
          "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now(),
        width: 1200,
        height: 630,
        alt: "RugProof AI Security Agent",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RugProof - AI Security Agent",
    description:
      "Advanced AI-powered crypto security analysis. Detect scams, analyze smart contracts, and protect your investments.",
    images: [
      "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now(),
    ],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
