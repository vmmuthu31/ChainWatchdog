import { Metadata } from "next";

export const metadata: Metadata = {
  title: "RugProof - Tokenomics",
  description: "Explore RugProof's token utility, deflationary burns, staking rewards, and governance features.",
  openGraph: {
    title: "RugProof - Tokenomics",
    description: "Explore RugProof's token utility, deflationary burns, staking rewards, and governance features.",
    url: "https://rugproofai.com/tokenomics",
    siteName: "RugProof",
    images: [
      {
        url: "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now(),
        width: 1200,
        height: 630,
        alt: "RugProof Tokenomics",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RugProof - Tokenomics",
    description: "Explore RugProof's token utility, deflationary burns, staking rewards, and governance features.",
    images: ["https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now()],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
