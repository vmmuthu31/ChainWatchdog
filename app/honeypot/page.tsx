import type { Metadata } from "next";
import { Suspense } from "react";
import HoneyPot from "./Components";
import { Loader2 } from "lucide-react";
import { pixelMonoFont } from "@/lib/font";

export const metadata: Metadata = {
  title: "RugProof - Honeypot Scanner",
  description:
    "Scan and detect honeypot scams in crypto tokens. Protect your investments with our advanced honeypot detection tool.",
  openGraph: {
    title: "RugProof - Honeypot Scanner",
    description:
      "Scan and detect honeypot scams in crypto tokens. Protect your investments with our advanced honeypot detection tool.",
    url: "https://rugproofai.com/honeypot",
    siteName: "RugProof",
    images: [
      {
        url:
          "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now(),
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
    description:
      "Scan and detect honeypot scams in crypto tokens. Protect your investments with our advanced honeypot detection tool.",
    images: [
      "https://rugproofai.com/newbanner.png?v=4&t=20250614_" + Date.now(),
    ],
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
