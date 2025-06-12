import { pixelFont, pixelMonoFont } from "@/lib/font";
import { getExplorerUrl } from "@/lib/utils/getExplorerUrl";
import { AlertTriangle, CheckCircle, ExternalLink, Info } from "lucide-react";

function HoneyPotResult({
  honeypotResult,
  detectedChain,
}: {
  honeypotResult: {
    token: {
      address: string;
      name: string;
      symbol: string;
      totalHolders: number;
    };
    simulationResult: {
      buyTax: number;
      sellTax: number;
      transferTax: number;
      buyGas: number;
      sellGas: number;
    };
    contractCode?: {
      openSource?: boolean;
      rootOpenSource?: boolean;
      isProxy?: boolean;
      hasProxyCalls?: boolean;
    };
    summary?: {
      risk?: string;
    };
    honeypotResult?: {
      isHoneypot?: boolean;
      honeypotReason?: string;
    };
    flags?:
      | {
          isHoneypot: boolean;
          isSellable: boolean;
          isOpen: boolean;
          isAntiWhale: boolean;
          hasAntiBot: boolean;
          staysLiquid: boolean;
          routerOkForOps: boolean;
          hasForeignCalls: boolean;
          hasPermissions: boolean;
        }
      | string[];
    chain?: string;
  };
  detectedChain?: string | null;
}) {
  const isSolana =
    detectedChain === "solana-mainnet" ||
    honeypotResult?.chain === "solana-mainnet";

  return (
    <div className="w-full max-w-2xl mt-6 animate-fade-in">
      {/* Token Summary Card */}
      <div className="p-4 sm:p-6 backdrop-blur-lg bg-black/50 rounded-2xl border border-[#ffa500]/30 shadow-[0_0_15px_rgba(255,165,0,0.2)] overflow-hidden relative mb-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#ffa500]/10 via-transparent to-transparent"></div>

        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-[#ffa500]/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 text-[#ffa500]" />
          </div>
          <h3
            className={`${pixelFont.className} text-xl sm:text-2xl md:text-3xl font-bold text-[#ffa500]`}
          >
            HONEYPOT ANALYSIS
            {isSolana && <span className="ml-2 text-sm">• SOLANA</span>}
          </h3>
        </div>

        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4 text-[#00ffff] flex-1">
            <div className="space-y-1">
              <span
                className={`${pixelMonoFont.className} text-lg sm:text-xl text-[#ffa500]`}
              >
                TOKEN
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`${pixelMonoFont.className} text-base sm:text-lg md:text-xl font-mono bg-black/50 py-2 px-3 rounded-lg truncate border border-[#ffa500]/20`}
                >
                  {honeypotResult.token.address}
                </span>
                <a
                  href={getExplorerUrl(
                    detectedChain || "1",
                    honeypotResult.token.address
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-black/50 text-[#ffa500] hover:bg-black/70 hover:text-[#ffcc00] transition-colors border border-[#ffa500]/30"
                >
                  <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              </div>
            </div>

            <div className="space-y-1">
              <span
                className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
              >
                TOKEN INFO
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-black/50 py-2 px-3 rounded-lg border border-[#ffa500]/20">
                  <span
                    className={`${pixelMonoFont.className} text-base sm:text-lg font-medium`}
                  >
                    {honeypotResult.token.name} ({honeypotResult.token.symbol})
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span
                className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
              >
                HOLDERS
              </span>
              <div
                className={`${pixelMonoFont.className} text-base sm:text-lg bg-black/50 py-2 px-3 rounded-lg border border-[#ffa500]/20`}
              >
                {honeypotResult.token.totalHolders.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex md:flex-col justify-between md:justify-end gap-2 md:gap-3 w-full md:w-auto">
            <div className="flex flex-col flex-1 md:flex-none">
              <div
                className={`flex-1 md:w-28 h-full flex flex-col p-3 rounded-2xl ${
                  honeypotResult?.honeypotResult?.isHoneypot
                    ? "border border-[#ff0000]/30 bg-black/70"
                    : "border border-[#00ff00]/30 bg-black/70"
                }`}
              >
                <div className="flex-1 flex items-center justify-center">
                  <div
                    className={`${pixelFont.className} text-3xl font-bold ${
                      honeypotResult?.honeypotResult?.isHoneypot
                        ? "text-[#ff0000] glow-red-sm"
                        : "text-[#00ff00] glow-green-sm"
                    }`}
                  >
                    {honeypotResult?.honeypotResult?.isHoneypot ? "YES" : "NO"}
                  </div>
                </div>
                <div className="text-center mt-2">
                  <div
                    className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                  >
                    HONEYPOT
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col flex-1 md:flex-none">
              <div className="flex-1 md:w-28 h-full flex flex-col p-3 rounded-2xl border border-[#ffa500]/30 bg-black/70">
                <div className="flex-1 flex items-center justify-center">
                  <div
                    className={`${pixelFont.className} text-lg font-bold text-[#ffa500]`}
                  >
                    {honeypotResult?.simulationResult?.buyTax.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center mt-2">
                  <div
                    className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                  >
                    BUY TAX
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col flex-1 md:flex-none">
              <div className="flex-1 md:w-28 h-full flex flex-col p-3 rounded-2xl border border-[#ffa500]/30 bg-black/70">
                <div className="flex-1 flex items-center justify-center">
                  <div
                    className={`${pixelFont.className} text-lg font-bold text-[#ffa500]`}
                  >
                    {honeypotResult?.simulationResult?.sellTax.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center mt-2">
                  <div
                    className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                  >
                    SELL TAX
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Status */}
        <div
          className={`mt-5 sm:mt-7 p-4 sm:p-5 border rounded-xl flex items-center gap-4 shadow-[0_0_10px_rgba(255,165,0,0.1)] ${
            honeypotResult?.honeypotResult?.isHoneypot
              ? "border-[#ff0000]/30 bg-[#ff0000]/10"
              : honeypotResult?.summary?.risk === "low" ||
                honeypotResult?.summary?.risk === "medium"
              ? "border-[#ffaa00]/30 bg-[#ffaa00]/10"
              : "border-[#00ff00]/30 bg-[#00ff00]/10"
          }`}
        >
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              honeypotResult?.honeypotResult?.isHoneypot
                ? "bg-[#ff0000]/20 border border-[#ff0000]/30"
                : honeypotResult?.summary?.risk === "low" ||
                  honeypotResult?.summary?.risk === "medium"
                ? "bg-[#ffaa00]/20 border border-[#ffaa00]/30"
                : "bg-[#00ff00]/20 border border-[#00ff00]/30"
            }`}
          >
            {honeypotResult?.honeypotResult?.isHoneypot ? (
              <AlertTriangle className="h-5 w-5 text-[#ff0000]" />
            ) : honeypotResult?.summary?.risk === "low" ||
              honeypotResult?.summary?.risk === "medium" ? (
              <AlertTriangle className="h-5 w-5 text-[#ffaa00]" />
            ) : (
              <CheckCircle className="h-5 w-5 text-[#00ff00]" />
            )}
          </div>
          <div>
            <h4
              className={`${
                pixelMonoFont.className
              } font-semibold text-base sm:text-lg md:text-xl ${
                honeypotResult?.honeypotResult?.isHoneypot
                  ? "text-[#ff5555]"
                  : honeypotResult?.summary?.risk === "low" ||
                    honeypotResult?.summary?.risk === "medium"
                  ? "text-[#ffaa00]"
                  : "text-[#00ff00]"
              }`}
            >
              {honeypotResult?.honeypotResult?.isHoneypot
                ? "DANGER: HONEYPOT DETECTED"
                : honeypotResult?.summary?.risk === "low" ||
                  honeypotResult?.summary?.risk === "medium"
                ? `CAUTION: ${honeypotResult?.summary?.risk?.toUpperCase()} RISK DETECTED`
                : "SAFE: NO HONEYPOT DETECTED"}
            </h4>
            <p
              className={`${pixelMonoFont.className} text-base sm:text-lg ${
                honeypotResult?.honeypotResult?.isHoneypot
                  ? "text-[#ff8888]"
                  : honeypotResult?.summary?.risk === "low" ||
                    honeypotResult?.summary?.risk === "medium"
                  ? "text-[#ffcc00]"
                  : "text-[#00ffaa]"
              }`}
            >
              {honeypotResult?.honeypotResult?.isHoneypot
                ? honeypotResult?.honeypotResult?.honeypotReason ||
                  "This contract has been identified as a honeypot. DO NOT TRADE."
                : honeypotResult?.summary?.risk === "low" ||
                  honeypotResult?.summary?.risk === "medium"
                ? "This contract has some risk factors but appears to be tradeable. Exercise caution."
                : "This contract appears to be safe based on our analysis. Always do your own research."}
            </p>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="p-5 sm:p-7 backdrop-blur-lg bg-black/50 rounded-2xl border border-[#ffa500]/30 shadow-[0_0_15px_rgba(255,165,0,0.2)] overflow-hidden">
        <h3
          className={`${pixelFont.className} text-xl sm:text-2xl font-bold text-[#ffa500] mb-5`}
        >
          DETAILED ANALYSIS
        </h3>

        <div className="space-y-5">
          {/* Tax Information */}
          <div className="p-4 sm:p-5 bg-black/70 rounded-xl border border-[#ffa500]/20">
            <h4
              className={`${pixelMonoFont.className} text-lg sm:text-xl font-medium text-[#ffa500] mb-3`}
            >
              TAX INFORMATION
            </h4>
            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              <div className="p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10 text-center">
                <div
                  className={`${pixelMonoFont.className} text-lg sm:text-xl font-bold text-[#00ffff]`}
                >
                  {honeypotResult?.simulationResult?.buyTax}%
                </div>
                <div
                  className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                >
                  Buy Tax
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10 text-center">
                <div
                  className={`${pixelMonoFont.className} text-lg sm:text-xl font-bold text-[#00ffff]`}
                >
                  {honeypotResult?.simulationResult?.sellTax}%
                </div>
                <div
                  className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                >
                  Sell Tax
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10 text-center">
                <div
                  className={`${pixelMonoFont.className} text-lg sm:text-xl font-bold text-[#00ffff]`}
                >
                  {honeypotResult?.simulationResult?.transferTax}%
                </div>
                <div
                  className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                >
                  Transfer Tax
                </div>
              </div>
            </div>
          </div>

          {/* Gas Information */}
          <div className="p-4 sm:p-5 bg-black/70 rounded-xl border border-[#ffa500]/20">
            <h4
              className={`${pixelMonoFont.className} text-lg sm:text-xl font-medium text-[#ffa500] mb-3`}
            >
              GAS INFORMATION
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              <div className="p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10 text-center">
                <div
                  className={`${pixelMonoFont.className} text-lg sm:text-xl font-bold text-[#00ffff]`}
                >
                  {honeypotResult?.simulationResult?.buyGas}
                </div>
                <div
                  className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                >
                  Buy Gas
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10 text-center">
                <div
                  className={`${pixelMonoFont.className} text-lg sm:text-xl font-bold text-[#00ffff]`}
                >
                  {honeypotResult?.simulationResult?.sellGas}
                </div>
                <div
                  className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                >
                  Sell Gas
                </div>
              </div>
            </div>
          </div>

          {/* Contract Verification */}
          {honeypotResult.contractCode && (
            <div className="p-4 sm:p-5 bg-black/70 rounded-xl border border-[#ffa500]/20">
              <h4
                className={`${pixelMonoFont.className} text-lg sm:text-xl font-medium text-[#ffa500] mb-3`}
              >
                {isSolana ? "PROGRAM VERIFICATION" : "CONTRACT VERIFICATION"}
              </h4>
              <div className="space-y-3">
                {isSolana && (
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10">
                    <span
                      className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                    >
                      SPL Token:
                    </span>
                    <span
                      className={`${pixelMonoFont.className} text-base sm:text-lg text-[#00ff00]`}
                    >
                      YES
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <span
                    className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                  >
                    Open Source:
                  </span>
                  <span
                    className={`${
                      pixelMonoFont.className
                    } text-base sm:text-lg ${
                      honeypotResult?.contractCode?.openSource
                        ? "text-[#00ff00]"
                        : "text-[#ff0000]"
                    }`}
                  >
                    {honeypotResult?.contractCode?.openSource ? "YES" : "NO"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <span
                    className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                  >
                    Root Open Source:
                  </span>
                  <span
                    className={`${
                      pixelMonoFont.className
                    } text-base sm:text-lg ${
                      honeypotResult?.contractCode?.rootOpenSource
                        ? "text-[#00ff00]"
                        : "text-[#ff0000]"
                    }`}
                  >
                    {honeypotResult?.contractCode?.rootOpenSource
                      ? "YES"
                      : "NO"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <span
                    className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                  >
                    Is Proxy:
                  </span>
                  <span
                    className={`${
                      pixelMonoFont.className
                    } text-base sm:text-lg ${
                      honeypotResult?.contractCode?.isProxy
                        ? "text-[#ff5500]"
                        : "text-[#00ff00]"
                    }`}
                  >
                    {honeypotResult?.contractCode?.isProxy ? "YES" : "NO"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <span
                    className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                  >
                    Has Proxy Calls:
                  </span>
                  <span
                    className={`${
                      pixelMonoFont.className
                    } text-base sm:text-lg ${
                      honeypotResult?.contractCode?.hasProxyCalls
                        ? "text-[#ff5500]"
                        : "text-[#00ff00]"
                    }`}
                  >
                    {honeypotResult?.contractCode?.hasProxyCalls ? "YES" : "NO"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Solana-specific Analysis Section */}
          {isSolana && (
            <div className="p-4 sm:p-5 bg-black/70 rounded-xl border border-[#ffa500]/20 mb-5">
              <h4
                className={`${pixelMonoFont.className} text-lg sm:text-xl font-medium text-[#ffa500] mb-3`}
              >
                SOLANA TOKEN ANALYSIS
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <span
                    className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                  >
                    Authority Check:
                  </span>
                  <span
                    className={`${
                      pixelMonoFont.className
                    } text-base sm:text-lg ${
                      honeypotResult?.honeypotResult?.isHoneypot
                        ? "text-[#ff0000]"
                        : honeypotResult?.summary?.risk === "medium"
                        ? "text-[#ffaa00]"
                        : "text-[#00ff00]"
                    }`}
                  >
                    {honeypotResult?.honeypotResult?.isHoneypot
                      ? "FAILED"
                      : honeypotResult?.summary?.risk === "medium"
                      ? "WARNING"
                      : "PASSED"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <span
                    className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                  >
                    Freezable:
                  </span>
                  <span
                    className={`${
                      pixelMonoFont.className
                    } text-base sm:text-lg ${
                      typeof honeypotResult?.flags === "object" &&
                      !Array.isArray(honeypotResult.flags) &&
                      honeypotResult.flags.isAntiWhale
                        ? "text-[#ff5500]"
                        : "text-[#00ff00]"
                    }`}
                  >
                    {typeof honeypotResult?.flags === "object" &&
                    !Array.isArray(honeypotResult.flags) &&
                    honeypotResult.flags.isAntiWhale
                      ? "YES"
                      : "NO"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <span
                    className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                  >
                    Mintable:
                  </span>
                  <span
                    className={`${
                      pixelMonoFont.className
                    } text-base sm:text-lg ${
                      typeof honeypotResult?.flags === "object" &&
                      !Array.isArray(honeypotResult.flags) &&
                      !honeypotResult.flags.staysLiquid
                        ? "text-[#ff5500]"
                        : "text-[#00ff00]"
                    }`}
                  >
                    {typeof honeypotResult?.flags === "object" &&
                    !Array.isArray(honeypotResult.flags) &&
                    !honeypotResult.flags.staysLiquid
                      ? "YES"
                      : "NO"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <span
                    className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                  >
                    Sufficient Liquidity:
                  </span>
                  <span
                    className={`${
                      pixelMonoFont.className
                    } text-base sm:text-lg ${
                      typeof honeypotResult?.flags === "object" &&
                      !Array.isArray(honeypotResult.flags) &&
                      honeypotResult.flags.staysLiquid
                        ? "text-[#00ff00]"
                        : "text-[#ff0000]"
                    }`}
                  >
                    {typeof honeypotResult?.flags === "object" &&
                    !Array.isArray(honeypotResult.flags) &&
                    honeypotResult.flags.staysLiquid
                      ? "YES"
                      : "NO"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-4 sm:p-5 bg-[#ffaa00]/10 rounded-xl border border-[#ffaa00]/30 mt-5">
            <div className="flex gap-4 items-start">
              <Info className="h-6 w-6 text-[#ffaa00] flex-shrink-0 mt-0.5" />
              <p
                className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffaa00]`}
              >
                This analysis is provided for informational purposes only.
                Always do your own research (DYOR) before investing. RugProof is
                not responsible for any trading decisions made based on this
                information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HoneyPotResult;
