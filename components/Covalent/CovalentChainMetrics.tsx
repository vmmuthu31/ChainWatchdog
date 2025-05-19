import { pixelFont, pixelMonoFont } from "@/lib/font";
import Link from "next/link";

function CovalentChainMetrics() {
  return (
    <div className="w-full max-w-5xl bg-black/40 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-[#00ff00]/20 animate-fade-in animation-delay-300">
      <h3
        className={`${pixelFont.className} text-center text-base sm:text-lg text-[#00ff00] mb-4`}
      >
        Spam Scanner Stats{" "}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3 sm:p-4 bg-black/60 rounded-lg border border-[#00ff00]/10">
          <div
            className={`${pixelMonoFont.className} text-sm text-[#00ff00] mb-2 flex justify-between items-center`}
          >
            <span>Ethereum</span>
            <span className="text-[#00ffff]">1,522,284</span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00ff00] to-[#00ffff] rounded-full"
              style={{ width: "70%" }}
            ></div>
          </div>
          <div
            className={`${pixelMonoFont.className} text-xs text-[#00ff00]/60 mt-1 text-right`}
          >
            NFTs: 126,878
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-black/60 rounded-lg border border-[#00ff00]/10">
          <div
            className={`${pixelMonoFont.className} text-sm text-[#00ff00] mb-2 flex justify-between items-center`}
          >
            <span>Binance Smart Chain</span>
            <span className="text-[#00ffff]">4,031,596</span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00ff00] to-[#00ffff] rounded-full"
              style={{ width: "100%" }}
            ></div>
          </div>
          <div
            className={`${pixelMonoFont.className} text-xs text-[#00ff00]/60 mt-1 text-right`}
          >
            NFTs: 251,313
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-black/60 rounded-lg border border-[#00ff00]/10">
          <div
            className={`${pixelMonoFont.className} text-sm text-[#00ff00] mb-2 flex justify-between items-center`}
          >
            <span>Base</span>
            <span className="text-[#00ffff]">1,406,703</span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00ff00] to-[#00ffff] rounded-full"
              style={{ width: "65%" }}
            ></div>
          </div>
          <div
            className={`${pixelMonoFont.className} text-xs text-[#00ff00]/60 mt-1 text-right`}
          >
            NFTs: 396,322
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-black/60 rounded-lg border border-[#00ff00]/10">
          <div
            className={`${pixelMonoFont.className} text-sm text-[#00ff00] mb-2 flex justify-between items-center`}
          >
            <span>Polygon</span>
            <span className="text-[#00ffff]">975,335</span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00ff00] to-[#00ffff] rounded-full"
              style={{ width: "45%" }}
            ></div>
          </div>
          <div
            className={`${pixelMonoFont.className} text-xs text-[#00ff00]/60 mt-1 text-right`}
          >
            NFTs: 926,664
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-black/60 rounded-lg border border-[#00ff00]/10">
          <div
            className={`${pixelMonoFont.className} text-sm text-[#00ff00] mb-2 flex justify-between items-center`}
          >
            <span>Optimism</span>
            <span className="text-[#00ffff]">128,008</span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00ff00] to-[#00ffff] rounded-full"
              style={{ width: "25%" }}
            ></div>
          </div>
          <div
            className={`${pixelMonoFont.className} text-xs text-[#00ff00]/60 mt-1 text-right`}
          >
            NFTs: 112,611
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-black/60 rounded-lg border border-[#00ff00]/10">
          <div
            className={`${pixelMonoFont.className} text-sm text-[#00ff00] mb-2 flex justify-between items-center`}
          >
            <span>Gnosis</span>
            <span className="text-[#00ffff]">94,043</span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00ff00] to-[#00ffff] rounded-full"
              style={{ width: "20%" }}
            ></div>
          </div>
          <div
            className={`${pixelMonoFont.className} text-xs text-[#00ff00]/60 mt-1 text-right`}
          >
            NFTs: 68,884
          </div>
        </div>
      </div>
      <div className=" bg-black/60 rounded-lg flex justify-end w-full items-center">
        <div className="text-sm text-[#00ff00] mt-4 flex gap-1 justify-between items-center">
          <span>Powered by</span>
          <Link
            href="https://goldrush.dev/docs/resources/enhanced-spam-lists"
            className="text-[#00ffff]"
          >
            Covalent (Goldrush)
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CovalentChainMetrics;
