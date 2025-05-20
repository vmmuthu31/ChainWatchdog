import { Suspense } from "react";
import HoneyPot from "./Components/HoneyPot";
import { Loader2 } from "lucide-react";
import { pixelMonoFont } from "@/lib/font";

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
