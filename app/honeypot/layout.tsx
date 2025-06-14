import { Metadata } from "next";

export const metadata: Metadata = {
  title: "RugProof - Honeypot Scanner",
  description: "Scan and detect honeypot scams in crypto tokens. Protect your investments with our advanced honeypot detection tool.",
  openGraph: {
    title: "RugProof - Honeypot Scanner",
    description: "Scan and detect honeypot scams in crypto tokens. Protect your investments with our advanced honeypot detection tool.",
    url: "https://rugproofai.com/honeypot",
    siteName: "RugProof",
    images: [
      {
        url: "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now(),
        width: 1200,
        height: 630,
        alt: "RugProof Honeypot Scanner",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RugProof - Honeypot Scanner",
    description: "Scan and detect honeypot scams in crypto tokens. Protect your investments with our advanced honeypot detection tool.",
    images: ["https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now()],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
