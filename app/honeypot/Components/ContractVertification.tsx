import { pixelFont, pixelMonoFont } from "@/lib/font";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

function ContractVertification({
  contractResult,
  detectedChain,
}: {
  contractResult: {
    isContract: boolean;
    isRootOpenSource: boolean;
    fullCheckPerformed: boolean;
    summary?: {
      isOpenSource: boolean;
      hasProxyCalls: boolean;
      tokenProgram?: string;
    };
    contractsOpenSource?: Record<string, boolean>;
    solanaSpecific?: {
      tokenProgram?: string;
      mintAuthority?: string | null;
      freezeAuthority?: string | null;
      creator?: string;
      updateAuthority?: string;
      mutable?: boolean;
      tokenSupply?: number;
      tokenDecimals?: number;
      transferFee?: {
        pct: number;
        maxAmount: number;
        authority: string;
      };
    };
    securityRisks?: {
      hasMintAuthority: boolean;
      hasFreezeAuthority: boolean;
      isMutable: boolean;
      hasTransferFee: boolean;
    };
  };
  detectedChain?: string | null;
}) {
  const isSolana = detectedChain === "solana-mainnet";
  return (
    <div className="w-full max-w-2xl mt-6 animate-fade-in">
      <div className="p-4 sm:p-6 backdrop-blur-lg bg-black/50 rounded-2xl border border-[#ffa500]/30 shadow-[0_0_15px_rgba(255,165,0,0.2)] overflow-hidden relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#ffa500]/10 via-transparent to-transparent"></div>

        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#ffa500]/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-[#ffa500]" />
          </div>
          <h3
            className={`${pixelFont.className} text-lg sm:text-xl md:text-2xl font-bold text-[#ffa500]`}
          >
            CONTRACT VERIFICATION
            {isSolana && <span className="ml-2 text-sm">• SOLANA</span>}
          </h3>
        </div>

        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="p-3 sm:p-4 bg-black/70 rounded-xl border border-[#ffa500]/20">
            <h4
              className={`${pixelMonoFont.className} text-base sm:text-lg font-medium text-[#ffa500] mb-2`}
            >
              SUMMARY
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                <div className="flex justify-between">
                  <span
                    className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                  >
                    Is Contract:
                  </span>
                  <span
                    className={`${pixelMonoFont.className} text-sm ${
                      contractResult.isContract
                        ? "text-[#00ff00]"
                        : "text-[#ff0000]"
                    }`}
                  >
                    {contractResult?.isContract ? "YES" : "NO"}
                  </span>
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                <div className="flex justify-between">
                  <span
                    className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                  >
                    Root Open Source:
                  </span>
                  <span
                    className={`${pixelMonoFont.className} text-sm ${
                      contractResult.isRootOpenSource
                        ? "text-[#00ff00]"
                        : "text-[#ff0000]"
                    }`}
                  >
                    {contractResult?.isRootOpenSource ? "YES" : "NO"}
                  </span>
                </div>
              </div>
              {isSolana && contractResult?.solanaSpecific?.tokenProgram && (
                <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <div className="flex justify-between">
                    <span
                      className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                    >
                      Token Program:
                    </span>
                    <span
                      className={`${pixelMonoFont.className} text-sm text-[#00ffff]`}
                    >
                      {contractResult.solanaSpecific.tokenProgram ===
                      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                        ? "SPL Token"
                        : contractResult.solanaSpecific.tokenProgram.substring(
                            0,
                            6
                          ) +
                          "..." +
                          contractResult.solanaSpecific.tokenProgram.substring(
                            contractResult.solanaSpecific.tokenProgram.length -
                              4
                          )}
                    </span>
                  </div>
                </div>
              )}
              {contractResult?.fullCheckPerformed &&
                contractResult?.summary && (
                  <>
                    <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                      <div className="flex justify-between">
                        <span
                          className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                        >
                          All Open Source:
                        </span>
                        <span
                          className={`${pixelMonoFont.className} text-sm ${
                            contractResult?.summary?.isOpenSource
                              ? "text-[#00ff00]"
                              : "text-[#ff0000]"
                          }`}
                        >
                          {contractResult?.summary?.isOpenSource ? "YES" : "NO"}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                      <div className="flex justify-between">
                        <span
                          className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                        >
                          Has Proxy Calls:
                        </span>
                        <span
                          className={`${pixelMonoFont.className} text-sm ${
                            contractResult?.summary?.hasProxyCalls
                              ? "text-[#ff5500]"
                              : "text-[#00ff00]"
                          }`}
                        >
                          {contractResult?.summary?.hasProxyCalls
                            ? "YES"
                            : "NO"}
                        </span>
                      </div>
                    </div>
                  </>
                )}
            </div>
          </div>

          {/* Solana-specific security risks */}
          {isSolana && contractResult?.securityRisks && (
            <div className="p-3 sm:p-4 bg-black/70 rounded-xl border border-[#ffa500]/20">
              <h4
                className={`${pixelMonoFont.className} text-base sm:text-lg font-medium text-[#ffa500] mb-2`}
              >
                SOLANA TOKEN SECURITY RISKS
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <div className="flex justify-between">
                    <span
                      className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                    >
                      Has Mint Authority:
                    </span>
                    <span
                      className={`${pixelMonoFont.className} text-sm ${
                        contractResult.securityRisks.hasMintAuthority
                          ? "text-[#ff0000]"
                          : "text-[#00ff00]"
                      }`}
                    >
                      {contractResult.securityRisks.hasMintAuthority
                        ? "YES"
                        : "NO"}
                    </span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <div className="flex justify-between">
                    <span
                      className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                    >
                      Has Freeze Authority:
                    </span>
                    <span
                      className={`${pixelMonoFont.className} text-sm ${
                        contractResult.securityRisks.hasFreezeAuthority
                          ? "text-[#ff0000]"
                          : "text-[#00ff00]"
                      }`}
                    >
                      {contractResult.securityRisks.hasFreezeAuthority
                        ? "YES"
                        : "NO"}
                    </span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <div className="flex justify-between">
                    <span
                      className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                    >
                      Metadata Mutable:
                    </span>
                    <span
                      className={`${pixelMonoFont.className} text-sm ${
                        contractResult.securityRisks.isMutable
                          ? "text-[#ff5500]"
                          : "text-[#00ff00]"
                      }`}
                    >
                      {contractResult.securityRisks.isMutable ? "YES" : "NO"}
                    </span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <div className="flex justify-between">
                    <span
                      className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                    >
                      Has Transfer Fee:
                    </span>
                    <span
                      className={`${pixelMonoFont.className} text-sm ${
                        contractResult.securityRisks.hasTransferFee
                          ? "text-[#ff5500]"
                          : "text-[#00ff00]"
                      }`}
                    >
                      {contractResult.securityRisks.hasTransferFee
                        ? "YES"
                        : "NO"}
                    </span>
                  </div>
                </div>
                {contractResult.solanaSpecific?.transferFee &&
                  contractResult.solanaSpecific.transferFee.pct > 0 && (
                    <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10 sm:col-span-2">
                      <div className="flex justify-between">
                        <span
                          className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                        >
                          Transfer Fee:
                        </span>
                        <span
                          className={`${pixelMonoFont.className} text-sm text-[#ff5500]`}
                        >
                          {contractResult.solanaSpecific?.transferFee?.pct}%
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Solana token details */}
          {isSolana && contractResult?.solanaSpecific && (
            <div className="p-3 sm:p-4 bg-black/70 rounded-xl border border-[#ffa500]/20">
              <h4
                className={`${pixelMonoFont.className} text-base sm:text-lg font-medium text-[#ffa500] mb-2`}
              >
                TOKEN DETAILS
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {contractResult.solanaSpecific.creator && (
                  <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                    <div className="flex justify-between">
                      <span
                        className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                      >
                        Creator:
                      </span>
                      <span
                        className={`${pixelMonoFont.className} text-sm text-[#00ffff]`}
                      >
                        {contractResult.solanaSpecific.creator.substring(0, 6)}
                        ...
                        {contractResult.solanaSpecific.creator.substring(
                          contractResult.solanaSpecific.creator.length - 4
                        )}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <div className="flex justify-between">
                    <span
                      className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                    >
                      Supply:
                    </span>
                    <span
                      className={`${pixelMonoFont.className} text-sm text-[#00ffff]`}
                    >
                      {contractResult.solanaSpecific.tokenSupply?.toLocaleString()}{" "}
                      tokens
                    </span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                  <div className="flex justify-between">
                    <span
                      className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                    >
                      Decimals:
                    </span>
                    <span
                      className={`${pixelMonoFont.className} text-sm text-[#00ffff]`}
                    >
                      {contractResult.solanaSpecific.tokenDecimals}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contracts Open Source */}
          {!isSolana &&
            contractResult?.contractsOpenSource &&
            Object.keys(contractResult?.contractsOpenSource).length > 0 && (
              <div className="p-3 sm:p-4 bg-black/70 rounded-xl border border-[#ffa500]/20">
                <h4
                  className={`${pixelMonoFont.className} text-base sm:text-lg font-medium text-[#ffa500] mb-2`}
                >
                  CONTRACTS OPEN SOURCE STATUS
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {Object.entries(contractResult?.contractsOpenSource).map(
                    ([address, isOpenSource]) => (
                      <div
                        key={address}
                        className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10"
                      >
                        <div className="flex justify-between flex-wrap gap-2">
                          <span
                            className={`${pixelMonoFont.className} text-xs sm:text-sm text-[#00ffff] break-all`}
                          >
                            {address}
                          </span>
                          <span
                            className={`${
                              pixelMonoFont.className
                            } text-xs sm:text-sm ${
                              isOpenSource ? "text-[#00ff00]" : "text-[#ff0000]"
                            }`}
                          >
                            {isOpenSource ? "OPEN SOURCE" : "CLOSED SOURCE"}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Full Check Not Performed Warning */}
          {!contractResult?.fullCheckPerformed && (
            <div className="p-3 sm:p-4 bg-[#ffaa00]/10 rounded-xl border border-[#ffaa00]/30">
              <div className="flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-[#ffaa00] flex-shrink-0 mt-0.5" />
                <p
                  className={`${pixelMonoFont.className} text-sm sm:text-base text-[#ffaa00]`}
                >
                  Full check could not be performed. This happens when the
                  simulation fails to get a complete call tree. Some information
                  may be missing.
                </p>
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

export default ContractVertification;
