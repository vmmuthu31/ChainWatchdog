import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tokenomics | RugProofAI - Revolutionary Crypto Security Token",
  description:
    "Discover RugProof's innovative tokenomics: deflationary burns, staking rewards, governance rights, and utility features. Join our mission to create a safer crypto ecosystem.",
  keywords:
    "rugproof token, crypto security token, deflationary tokenomics, staking rewards, defi governance, token utility, crypto security platform, token economics",
  openGraph: {
    title: "Tokenomics | RugProofAI - Revolutionary Crypto Security Token",
    description:
      "Discover RugProof's innovative tokenomics: deflationary burns, staking rewards, governance rights, and utility features. Join our mission to create a safer crypto ecosystem.",
    url: "https://rugproofai.com/tokenomics",
    siteName: "RugProofAI",
    images: [
      {
        url:
          "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now(),
        width: 1200,
        height: 630,
        alt: "RugProofAI Token - Revolutionary Crypto Security",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tokenomics | RugProofAI - Revolutionary Crypto Security Token",
    description:
      "Discover RugProof's innovative tokenomics: deflationary burns, staking rewards, governance rights, and utility features. Join our mission to create a safer crypto ecosystem.",
    site: "@rugproofai",
    creator: "@rugproofai",
    images: [
      "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now(),
    ],
  },
  alternates: {
    canonical: "https://rugproofai.com/tokenomics",
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
