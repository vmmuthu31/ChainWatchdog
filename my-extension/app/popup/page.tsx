"use client";

import { TokenInputForm } from "../../components/token-input-form";
import GoldRushServices, {
  supportedChains,
  getExplorerUrl,
} from "../../lib/services/goldrush";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import NetworkDropdown from "../../components/NetworkDropdown";
import TokenLogo from "../../components/TokenLogo";
import { GoldRushResponse } from "../../lib/types";

export default function Popup() {
  const [tokenData, setTokenData] = useState<GoldRushResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "spam" | "safe">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState(supportedChains[0].id);

  const currentChain = useMemo(() => {
    return (
      supportedChains.find((chain) => chain.id === selectedChain) ||
      supportedChains[0]
    );
  }, [selectedChain]);

  const handleCheckToken = async ({
    tokenAddress,
  }: {
    tokenAddress: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setTokenData(null);

    try {
      if (!tokenAddress) {
        throw new Error("Please enter a wallet address.");
      }

      const result = await GoldRushServices(tokenAddress, selectedChain);
      setTokenData(result);
    } catch (err) {
      console.error("Error checking wallet:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTokens = useMemo(() => {
    if (!tokenData) return [];

    let filtered = tokenData.data.items;

    if (filterType === "spam") {
      filtered = filtered.filter((token) => token.is_spam);
    } else if (filterType === "safe") {
      filtered = filtered.filter((token) => !token.is_spam);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (token) =>
          token.contract_name.toLowerCase().includes(query) ||
          token.contract_ticker_symbol.toLowerCase().includes(query) ||
          token.contract_address.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [tokenData, filterType, searchQuery]);

  const spamStats = useMemo(() => {
    if (!tokenData) return { total: 0, spam: 0, safe: 0, maybe: 0 };

    const total = tokenData.data.items.length;
    const spam = tokenData.data.items.filter((t) => t.is_spam).length;
    const safe = total - spam;

    return { total, spam, safe, maybe: 0 };
  }, [tokenData]);

  return (
    <div className="flex min-h-full flex-col items-center bg-black text-white w-[400px] max-h-[600px] overflow-y-auto">
      <main className="w-full flex flex-col items-center p-4 gap-4">
        <div className="text-center space-y-2 w-full">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00ff00]/20 via-transparent to-transparent blur-3xl"></div>
          <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#00ff00] via-[#00ffff] to-[#ff00ff] bg-clip-text text-transparent">
            SCAN YOUR WALLET. NUKE THE THREATS.
          </h2>
          <p className="text-sm text-[#00ff00] leading-relaxed">
            Identify spam tokens and malicious contracts across{" "}
            <span className="text-[#ff00ff] font-semibold">
              multiple blockchains
            </span>{" "}
            — instantly.
          </p>
        </div>

        <div className="w-full backdrop-blur-lg bg-black/50 p-4 rounded-xl border border-[#00ff00]/30 shadow-xl">
          {/* Network selector */}
          <NetworkDropdown
            supportedChains={supportedChains}
            selectedChain={selectedChain}
            setSelectedChain={setSelectedChain}
            isLoading={isLoading}
            currentChain={currentChain}
          />

          <TokenInputForm onSubmit={handleCheckToken} isLoading={isLoading} />
        </div>

        {isLoading && (
          <div className="w-full p-6 backdrop-blur-lg bg-black/50 rounded-xl border border-[#00ff00]/30 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-[#00ff00] animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-[#00ff00]" />
              </div>
            </div>
            <p className="text-[#00ffff] mt-3 animate-pulse text-sm">
              Analyzing wallet on {currentChain.name}...
            </p>
          </div>
        )}

        {error && (
          <div className="w-full p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 animate-fade-in">
            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="text-red-500 h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium text-red-400 mb-1 text-sm">Error</h3>
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          </div>
        )}

        {tokenData && !error && !isLoading && (
          <div className="w-full space-y-4">
            {/* Wallet Summary Card */}
            <div className="p-4 backdrop-blur-lg bg-black/50 rounded-xl border border-[#00ff00]/30 shadow-[0_0_15px_rgba(0,255,0,0.2)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-[#00ff00]/10 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-[#00ff00]" />
                </div>
                <h3 className="text-base font-bold text-[#00ffff]">
                  WALLET SECURITY
                </h3>
              </div>

              <div className="space-y-2 text-[#00ffff]">
                <div className="space-y-1">
                  <span className="text-xs text-[#00ff00]">ADDRESS</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-black/50 py-1 px-2 rounded-lg truncate border border-[#00ff00]/20 w-full">
                      {tokenData.data.address}
                    </span>
                    <a
                      href={`${currentChain.explorer}/address/${tokenData.data.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-black/50 text-[#00ff00] hover:bg-black/70 hover:text-[#00ffff] transition-colors border border-[#00ff00]/30"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="p-2 bg-black/70 rounded-xl border border-[#00ff00]/30 text-center">
                  <div className="text-lg font-bold text-[#00ffff] mb-1">
                    {spamStats.total}
                  </div>
                  <div className="text-[10px] text-[#00ff00]">TOTAL TOKENS</div>
                </div>
                <div className="p-2 bg-black/70 rounded-xl border border-[#ff0000]/30 text-center">
                  <div className="text-lg font-bold text-[#ff5555] mb-1">
                    {spamStats.spam}
                  </div>
                  <div className="text-[10px] text-[#ff0000]">SPAM TOKENS</div>
                </div>
                <div className="p-2 bg-black/70 rounded-xl border border-[#00ff00]/30 text-center">
                  <div className="text-lg font-bold text-[#00ff00] mb-1">
                    {spamStats.safe}
                  </div>
                  <div className="text-[10px] text-[#00ff00]">SAFE TOKENS</div>
                </div>
              </div>

              {spamStats.spam > 0 && (
                <div className="mt-3 p-3 border border-[#ff0000]/30 bg-black/70 rounded-xl flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#ff0000]/20 flex items-center justify-center flex-shrink-0 border border-[#ff0000]/30">
                    <AlertTriangle className="h-3 w-3 text-[#ff0000]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#ff5555] text-xs">
                      SECURITY ALERT
                    </h4>
                    <p className="text-[#ff8888] text-xs">
                      This wallet contains {spamStats.spam} known spam tokens
                      that could be potential scams.
                    </p>
                  </div>
                </div>
              )}

              {spamStats.spam === 0 && (
                <div className="mt-3 p-3 border border-[#00ff00]/30 bg-black/70 rounded-xl flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#00ff00]/20 flex items-center justify-center flex-shrink-0 border border-[#00ff00]/30">
                    <CheckCircle className="h-3 w-3 text-[#00ff00]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#00ff00] text-xs">
                      SECURITY STATUS
                    </h4>
                    <p className="text-[#00ffaa] text-xs">
                      No known spam tokens detected in this wallet.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tokens List */}
            <div className="space-y-3">
              <div className="flex flex-col gap-2 bg-black/50 p-3 rounded-xl border border-[#00ff00]/30">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-[#00ff00]/10 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3 text-[#00ff00]"
                      >
                        <circle cx="8" cy="21" r="1" />
                        <circle cx="19" cy="21" r="1" />
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold text-[#00ffff]">
                      TOKEN HOLDINGS
                    </h3>
                  </div>

                  <div className="flex p-1 bg-black/80 border border-[#00ff00]/50 rounded-lg overflow-hidden">
                    <button
                      className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
                        filterType === "all"
                          ? "bg-[#00ff00] text-black"
                          : "text-[#00ff00] hover:bg-black/90"
                      }`}
                      onClick={() => setFilterType("all")}
                    >
                      All
                    </button>
                    <button
                      className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
                        filterType === "spam"
                          ? "bg-[#ff0000] text-black"
                          : "text-[#00ff00] hover:bg-black/90"
                      }`}
                      onClick={() => setFilterType("spam")}
                    >
                      Spam
                    </button>
                    <button
                      className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
                        filterType === "safe"
                          ? "bg-[#00ff00] text-black"
                          : "text-[#00ff00] hover:bg-black/90"
                      }`}
                      onClick={() => setFilterType("safe")}
                    >
                      Safe
                    </button>
                  </div>
                </div>

                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search tokens..."
                    className="w-full pl-8 pr-8 py-1.5 bg-black/80 border border-[#00ff00]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00ff00] text-[#00ffff] text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-[#00ff00]" />
                  {searchQuery && (
                    <button
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-[#00ff00] hover:text-[#00ffff]"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {filteredTokens.length === 0 && (
                <div className="p-6 backdrop-blur-lg bg-black/50 rounded-xl border border-[#00ff00]/30 text-center">
                  <div className="h-12 w-12 mx-auto mb-3 text-[#00ff00] opacity-60">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-[#00ffff] mb-1">
                    NO TOKENS FOUND
                  </h3>
                  <p className="text-[#00ff00] text-xs max-w-xs mx-auto">
                    No tokens match your current filters. Try changing your
                    search or filter settings.
                  </p>
                </div>
              )}

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {filteredTokens.map((token) => (
                  <div
                    key={token.contract_address}
                    className={`p-3 backdrop-blur-lg rounded-xl border flex items-center gap-3 transition-all duration-300 hover:shadow-md ${
                      token.is_spam
                        ? "bg-black/50 border-[#ff0000]/30 shadow-[0_0_10px_rgba(255,0,0,0.1)]"
                        : "bg-black/50 border-[#00ff00]/30 shadow-[0_0_10px_rgba(0,255,0,0.1)]"
                    }`}
                  >
                    <div>
                      <TokenLogo
                        src={token.logo_url}
                        alt={
                          token.contract_ticker_symbol ||
                          token.contract_name ||
                          "?"
                        }
                        size={36}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium truncate text-[#00ffff]">
                          {token.contract_name}
                        </h4>
                        <span className="text-xs px-1.5 py-0.5 bg-black/80 rounded-full text-[#00ff00] border border-[#00ff00]/30">
                          {token.contract_ticker_symbol}
                        </span>

                        {token.is_spam && (
                          <span className="px-1.5 py-0.5 text-xs bg-[#ff0000]/20 text-[#ff0000] rounded-full flex items-center gap-1 border border-[#ff0000]/30">
                            <AlertTriangle className="h-3 w-3" /> SPAM
                          </span>
                        )}

                        {!token.is_spam && (
                          <span className="px-1.5 py-0.5 text-xs bg-[#00ff00]/20 text-[#00ff00] rounded-full flex items-center gap-1 border border-[#00ff00]/30">
                            <CheckCircle className="h-3 w-3" /> SAFE
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#00ff00]">
                        Balance:{" "}
                        <span className="text-[#00ffff] font-medium">
                          {parseFloat(token.balance) /
                            Math.pow(10, token.contract_decimals)}{" "}
                          {token.contract_ticker_symbol}
                        </span>
                      </div>
                    </div>

                    <a
                      href={getExplorerUrl(
                        selectedChain,
                        token.contract_address
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-black/50 text-[#00ff00] hover:bg-black/70 hover:text-[#00ffff] transition-colors border border-[#00ff00]/30"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-[#00ff00]/60 text-center mt-2">
          RugProofAI v0.1.0 - Powered by Covalent
        </div>
      </main>
    </div>
  );
}
