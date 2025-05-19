"use client";

import { TokenInputForm } from "@/components/token-input-form";
import GoldRushServices, {
  type GoldRushResponse,
  supportedChains,
  getExplorerUrl,
} from "@/lib/services/goldrush";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { RecentSpamTokens } from "@/components/RecentSpamTokens";
import { pixelFont, pixelMonoFont } from "@/lib/font";
import Navbar from "@/components/Navbar";
import TokenLogo from "@/components/TokenLogo";
import NetworkDropdown from "@/components/Covalent/NetworkDropdown";
import Footer from "@/components/Footer";
import CovalentChainMetrics from "@/components/Covalent/CovalentChainMetrics";
import CovalentTabSelector from "@/components/Covalent/CovalentTabSelector";

export default function Home() {
  const [tokenData, setTokenData] = useState<GoldRushResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "spam" | "safe">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState(supportedChains[0].id);
  const [activeTab, setActiveTab] = useState<"search" | "wallet" | "recent">(
    "search"
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [walletTokens, setWalletTokens] = useState<any[]>([]);
  const [isLoadingWalletTokens, setIsLoadingWalletTokens] = useState(false);

  const { address: walletAddress, isConnected } = useAccount();
  const currentChain = useMemo(() => {
    return (
      supportedChains.find((chain) => chain.id === selectedChain) ||
      supportedChains[0]
    );
  }, [selectedChain]);

  const fetchWalletTokens = async (address: string) => {
    setIsLoadingWalletTokens(true);
    try {
      const result = await GoldRushServices(address, selectedChain);
      setWalletTokens(result.data?.items || []);
    } catch (err) {
      console.error("Error fetching wallet tokens:", err);
    } finally {
      setIsLoadingWalletTokens(false);
    }
  };

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

  useEffect(() => {
    if (isConnected && walletAddress && activeTab === "wallet") {
      fetchWalletTokens(walletAddress);
    }
  }, [isConnected, walletAddress, activeTab, selectedChain]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-black text-white">
      <Navbar />

      <main className="container mx-auto flex flex-1 flex-col items-center justify-center gap-6 sm:gap-10 p-3 sm:p-4 md:p-8">
        <div className="text-center space-y-6 max-w-2xl relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00ff00]/20 via-transparent to-transparent blur-3xl"></div>
          <h2
            className={`${pixelFont.className} text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#00ff00] via-[#00ffff] to-[#ff00ff] bg-clip-text text-transparent glow-green-md animate-pulse-slow`}
          >
            <span className="md:text-[40px]">SCAN YOUR WALLET.</span> NUKE THE
            THREATS.
          </h2>
          <p
            className={`${pixelMonoFont.className} text-xl sm:text-2xl md:text-3xl text-[#00ff00] leading-relaxed max-w-xl mx-auto animate-fade-in-up animation-delay-100`}
          >
            Identify spam tokens, malicious contracts, and hidden exploits
            across{" "}
            <span className="text-[#ff00ff] font-semibold">
              100+ blockchains
            </span>{" "}
            — instantly.
          </p>
        </div>
        <div className="w-full max-w-xl backdrop-blur-lg bg-black/50 p-4 sm:p-6 md:p-8 rounded-2xl border border-[#00ff00]/30 shadow-xl relative z-[10] transform transition-all duration-300 hover:shadow-[0_0_50px_-12px_rgba(0,255,0,0.5)]">
          {/* Network selector */}
          <NetworkDropdown
            supportedChains={supportedChains}
            selectedChain={selectedChain}
            setSelectedChain={setSelectedChain}
            activeTab={activeTab}
            isLoading={isLoading}
            currentChain={currentChain}
          />
          {/* Tab Selector */}
          <CovalentTabSelector
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isConnected={isConnected}
          />

          {activeTab === "search" ? (
            <TokenInputForm onSubmit={handleCheckToken} isLoading={isLoading} />
          ) : activeTab === "wallet" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3
                  className={`${pixelMonoFont.className} text-base sm:text-lg text-[#00ffff]`}
                >
                  Your Wallet Tokens
                </h3>
                <div className="flex p-1 bg-black/80 border border-[#00ff00]/50 rounded-lg overflow-hidden">
                  <button
                    className={`px-1.5 xs:px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] xs:text-xs font-medium rounded-md transition-colors ${
                      filterType === "all"
                        ? "bg-[#00ff00] text-black"
                        : "text-[#00ff00] hover:bg-black/90"
                    }`}
                    onClick={() => setFilterType("all")}
                  >
                    All
                  </button>
                  <button
                    className={`px-1.5 xs:px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] xs:text-xs font-medium rounded-md transition-colors ${
                      filterType === "spam"
                        ? "bg-[#ff0000] text-black"
                        : "text-[#00ff00] hover:bg-black/90"
                    }`}
                    onClick={() => setFilterType("spam")}
                  >
                    Spam
                  </button>
                  <button
                    className={`px-1.5 xs:px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] xs:text-xs font-medium rounded-md transition-colors ${
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

              {isLoadingWalletTokens ? (
                <div className="flex justify-center p-8">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-t-2 border-b-2 border-[#00ff00] animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-[#00ff00]" />
                    </div>
                  </div>
                </div>
              ) : walletTokens.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {(() => {
                    const filteredWalletTokens = walletTokens.filter(
                      (token) => {
                        if (filterType === "spam") {
                          return token.is_spam;
                        } else if (filterType === "safe") {
                          return !token.is_spam;
                        }
                        return true;
                      }
                    );

                    if (filteredWalletTokens.length === 0) {
                      return (
                        <div className="p-8 text-center">
                          <div className="h-16 w-16 mx-auto mb-4 text-[#00ff00] opacity-60">
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
                          <h3
                            className={`${pixelFont.className} text-base font-medium text-[#00ffff] mb-2`}
                          >
                            NO TOKENS FOUND
                          </h3>
                        </div>
                      );
                    }

                    return filteredWalletTokens.map((token) => (
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
                            size={40}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`${pixelMonoFont.className} text-base sm:text-lg font-medium truncate text-[#00ffff]`}
                            >
                              {token.contract_name}
                            </h4>
                            <span
                              className={`${pixelMonoFont.className} text-sm sm:text-base px-1.5 sm:px-2 py-0.5 bg-black/80 rounded-full text-[#00ff00] border border-[#00ff00]/30`}
                            >
                              {token.contract_ticker_symbol}
                            </span>

                            {token.is_spam && (
                              <span className="px-1.5 sm:px-2 py-0.5 text-sm bg-[#ff0000]/20 text-[#ff0000] rounded-full flex items-center gap-1 border border-[#ff0000]/30">
                                <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{" "}
                                SPAM
                              </span>
                            )}

                            {!token.is_spam && (
                              <span className="px-1.5 sm:px-2 py-0.5 text-sm bg-[#00ff00]/20 text-[#00ff00] rounded-full flex items-center gap-1 border border-[#00ff00]/30">
                                <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{" "}
                                SAFE
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs sm:text-sm">
                            <div
                              className={`${pixelMonoFont.className} text-sm sm:text-base text-[#00ff00]`}
                            >
                              Balance:{" "}
                              <span className="text-[#00ffff] font-medium">
                                {parseFloat(token.balance) /
                                  Math.pow(10, token.contract_decimals)}{" "}
                                {token.contract_ticker_symbol}
                              </span>
                            </div>
                            <div
                              className={`${pixelMonoFont.className} text-sm sm:text-base text-[#00ff00]`}
                            >
                              Value:{" "}
                              <span className="text-[#00ffff] font-medium">
                                {token.pretty_quote}
                              </span>
                            </div>
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
                    ));
                  })()}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="h-16 w-16 mx-auto mb-4 text-[#00ff00] opacity-60">
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
                  <h3
                    className={`${pixelFont.className} text-base font-medium text-[#00ffff] mb-2`}
                  >
                    NO TOKENS FOUND
                  </h3>
                  <p
                    className={`${pixelMonoFont.className} text-[#00ff00] max-w-sm mx-auto`}
                  >
                    No tokens found in your wallet on this chain. Try selecting
                    a different network.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <RecentSpamTokens chainId={selectedChain} />
            </div>
          )}
        </div>

        {isLoading && (
          <div className="w-full max-w-xl p-8 backdrop-blur-lg bg-black/50 rounded-2xl border border-[#00ff00]/30 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-t-2 border-b-2 border-[#00ff00] animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-[#00ff00]" />
              </div>
            </div>
            <p
              className={`${pixelMonoFont.className} text-[#00ffff] mt-4 animate-pulse`}
            >
              Analyzing wallet on {currentChain.name}...
            </p>
          </div>
        )}

        {error && (
          <div className="w-full max-w-xl p-6 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 animate-fade-in">
            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="text-red-500 h-5 w-5" />
            </div>
            <div>
              <h3
                className={`${pixelMonoFont.className} font-medium text-red-400 mb-1`}
              >
                Error
              </h3>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {tokenData && activeTab === "search" && !error && !isLoading && (
          <div className="w-full max-w-4xl space-y-8 relative z-[5] animate-fade-in">
            {/* Wallet Summary Card */}
            <div className="p-4 sm:p-6 backdrop-blur-lg bg-black/50 rounded-2xl border border-[#00ff00]/30 shadow-[0_0_15px_rgba(0,255,0,0.2)] overflow-hidden relative">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00ff00]/10 via-transparent to-transparent"></div>

              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#00ff00]/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-[#00ff00]" />
                </div>
                <h3
                  className={`${pixelFont.className} text-lg sm:text-xl md:text-2xl font-bold text-[#00ffff]`}
                >
                  WALLET SECURITY
                </h3>
              </div>

              <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4 text-[#00ffff] flex-1">
                  <div className="space-y-1">
                    <span
                      className={`${pixelMonoFont.className} text-base sm:text-lg text-[#00ff00]`}
                    >
                      ADDRESS
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`${pixelMonoFont.className} text-sm sm:text-base md:text-lg font-mono bg-black/50 py-1 px-2 rounded-lg truncate border border-[#00ff00]/20`}
                      >
                        {tokenData.data.address}
                      </span>
                      <a
                        href={`${currentChain.explorer}/address/${tokenData.data.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-black/50 text-[#00ff00] hover:bg-black/70 hover:text-[#00ffff] transition-colors border border-[#00ff00]/30"
                      >
                        <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </a>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span
                      className={`${pixelMonoFont.className} text-xs text-[#00ff00]`}
                    >
                      NETWORK
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-black/50 py-1 px-2 rounded-lg border border-[#00ff00]/20">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-black/80 flex items-center justify-center overflow-hidden border border-[#00ff00]/30">
                          <Image
                            src={
                              currentChain.logoUrl ||
                              "https://www.datocms-assets.com/86369/1669653891-eth.svg"
                            }
                            alt={currentChain.name}
                            width={12}
                            height={12}
                            className="rounded-full"
                          />
                        </div>
                        <span
                          className={`${pixelMonoFont.className} text-xs sm:text-sm font-medium`}
                        >
                          {currentChain.name}
                        </span>
                        {currentChain.type === "Testnet" && (
                          <span
                            className={`${pixelMonoFont.className} text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 bg-[#ff00ff]/20 text-[#ff00ff] rounded-full`}
                          >
                            Testnet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span
                      className={`${pixelMonoFont.className} text-xs text-[#00ff00]`}
                    >
                      LAST SCANNED
                    </span>
                    <div
                      className={`${pixelMonoFont.className} text-xs sm:text-sm bg-black/50 py-1 px-2 rounded-lg border border-[#00ff00]/20`}
                    >
                      {new Date(tokenData.data.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 flex-1">
                  <div className="p-2 sm:p-4 bg-black/70 rounded-xl border border-[#00ff00]/30 text-center transform transition-all duration-300 hover:scale-105 shadow-[0_0_10px_rgba(0,255,0,0.1)]">
                    <div
                      className={`${pixelFont.className} text-lg sm:text-2xl md:text-3xl font-bold text-[#00ffff] mb-1 glow-cyan-sm`}
                    >
                      {spamStats.total}
                    </div>
                    <div
                      className={`${pixelMonoFont.className} text-[10px] sm:text-xs text-[#00ff00]`}
                    >
                      TOTAL TOKENS
                    </div>
                  </div>
                  <div className="p-2 sm:p-4 bg-black/70 rounded-xl border border-[#ff0000]/30 text-center transform transition-all duration-300 hover:scale-105 shadow-[0_0_10px_rgba(255,0,0,0.1)]">
                    <div
                      className={`${pixelFont.className} text-xl sm:text-3xl font-bold text-[#ff5555] mb-1 glow-red-sm`}
                    >
                      {spamStats.spam}
                    </div>
                    <div
                      className={`${pixelMonoFont.className} text-[10px] sm:text-xs text-[#ff0000]`}
                    >
                      SPAM TOKENS
                    </div>
                  </div>
                  <div className="p-2 sm:p-4 bg-black/70 rounded-xl border border-[#00ff00]/30 text-center transform transition-all duration-300 hover:scale-105 shadow-[0_0_10px_rgba(0,255,0,0.1)]">
                    <div
                      className={`${pixelFont.className} text-xl sm:text-3xl font-bold text-[#00ff00] mb-1 glow-green-sm`}
                    >
                      {spamStats.safe}
                    </div>
                    <div
                      className={`${pixelMonoFont.className} text-[10px] sm:text-xs text-[#00ff00]`}
                    >
                      SAFE TOKENS
                    </div>
                  </div>
                </div>
              </div>

              {spamStats.spam > 0 && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 border border-[#ff0000]/30 bg-black/70 rounded-xl flex items-center gap-3 shadow-[0_0_10px_rgba(255,0,0,0.1)]">
                  <div className="h-8 w-8 rounded-full bg-[#ff0000]/20 flex items-center justify-center flex-shrink-0 border border-[#ff0000]/30">
                    <AlertTriangle className="h-4 w-4 text-[#ff0000]" />
                  </div>
                  <div>
                    <h4
                      className={`${pixelMonoFont.className} font-semibold text-[#ff5555] text-sm sm:text-base`}
                    >
                      SECURITY ALERT
                    </h4>
                    <p
                      className={`${pixelMonoFont.className} text-[#ff8888] text-sm sm:text-base`}
                    >
                      This wallet contains {spamStats.spam} known spam tokens
                      that could be potential scams.
                    </p>
                  </div>
                </div>
              )}

              {spamStats.spam === 0 && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 border border-[#00ff00]/30 bg-black/70 rounded-xl flex items-center gap-3 shadow-[0_0_10px_rgba(0,255,0,0.1)]">
                  <div className="h-8 w-8 rounded-full bg-[#00ff00]/20 flex items-center justify-center flex-shrink-0 border border-[#00ff00]/30">
                    <CheckCircle className="h-4 w-4 text-[#00ff00]" />
                  </div>
                  <div>
                    <h4
                      className={`${pixelMonoFont.className} font-semibold text-[#00ff00] text-sm sm:text-base`}
                    >
                      SECURITY STATUS
                    </h4>
                    <p
                      className={`${pixelMonoFont.className} text-[#00ffaa] text-sm sm:text-base`}
                    >
                      No known spam tokens detected in this wallet.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tokens List */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 bg-black/50 p-3 sm:p-5 rounded-xl border border-[#00ff00]/30 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#00ff00]/10 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 sm:h-5 sm:w-5 text-[#00ff00]"
                    >
                      <circle cx="8" cy="21" r="1" />
                      <circle cx="19" cy="21" r="1" />
                      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                    </svg>
                  </div>
                  <h3
                    className={`${pixelFont.className} text-lg sm:text-xl md:text-2xl font-bold text-[#00ffff]`}
                  >
                    TOKEN HOLDINGS
                  </h3>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <input
                      type="text"
                      placeholder="Search tokens..."
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-black/80 border border-[#00ff00]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00ff00] text-[#00ffff] text-xs sm:text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00ff00]" />
                    {searchQuery && (
                      <button
                        className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00ff00] hover:text-[#00ffff]"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex p-1 bg-black/80 border border-[#00ff00]/50 rounded-lg overflow-hidden">
                    <button
                      className={`px-1.5 xs:px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] xs:text-xs font-medium rounded-md transition-colors ${
                        filterType === "all"
                          ? "bg-[#00ff00] text-black"
                          : "text-[#00ff00] hover:bg-black/90"
                      }`}
                      onClick={() => setFilterType("all")}
                    >
                      All
                    </button>
                    <button
                      className={`px-1.5 xs:px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] xs:text-xs font-medium rounded-md transition-colors ${
                        filterType === "spam"
                          ? "bg-[#ff0000] text-black"
                          : "text-[#00ff00] hover:bg-black/90"
                      }`}
                      onClick={() => setFilterType("spam")}
                    >
                      Spam
                    </button>
                    <button
                      className={`px-1.5 xs:px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] xs:text-xs font-medium rounded-md transition-colors ${
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
              </div>

              {filteredTokens.length === 0 && (
                <div className="p-12 backdrop-blur-lg bg-black/50 rounded-2xl border border-[#00ff00]/30 text-center shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                  <div className="h-16 w-16 mx-auto mb-4 text-[#00ff00] opacity-60">
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
                  <h3
                    className={`${pixelFont.className} text-lg font-medium text-[#00ffff] mb-2`}
                  >
                    NO TOKENS FOUND
                  </h3>
                  <p
                    className={`${pixelMonoFont.className} text-[#00ff00] max-w-sm mx-auto`}
                  >
                    No tokens match your current filters. Try changing your
                    search or filter settings.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {filteredTokens.map((token, index) => (
                  <div
                    key={token.contract_address}
                    className={`p-4 sm:p-5 backdrop-blur-lg rounded-xl border flex flex-col md:flex-row md:items-center gap-3 sm:gap-5 transition-all duration-300 hover:shadow-lg animate-fade-in ${
                      token.is_spam
                        ? "bg-black/50 border-[#ff0000]/30 shadow-[0_0_10px_rgba(255,0,0,0.1)]"
                        : "bg-black/50 border-[#00ff00]/30 shadow-[0_0_10px_rgba(0,255,0,0.1)]"
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <TokenLogo
                        src={token.logo_url}
                        alt={
                          token.contract_ticker_symbol ||
                          token.contract_name ||
                          "?"
                        }
                        size={token.is_spam ? 56 : 48}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2 flex-wrap">
                          <h4
                            className={`${pixelMonoFont.className} text-lg sm:text-xl font-medium truncate text-[#00ffff]`}
                          >
                            {token.contract_name}
                          </h4>
                          <span
                            className={`${pixelMonoFont.className} text-sm sm:text-base px-2 py-0.5 sm:py-1 bg-black/80 rounded-full text-[#00ff00] border border-[#00ff00]/30`}
                          >
                            {token.contract_ticker_symbol}
                          </span>

                          {token.is_spam && (
                            <span className="px-2 py-0.5 sm:py-1 text-sm sm:text-base bg-[#ff0000]/20 text-[#ff0000] rounded-full flex items-center gap-2 border border-[#ff0000]/30">
                              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />{" "}
                              SPAM
                            </span>
                          )}

                          {!token.is_spam && (
                            <span className="px-2 py-0.5 sm:py-1 text-sm sm:text-base bg-[#00ff00]/20 text-[#00ff00] rounded-full flex items-center gap-2 border border-[#00ff00]/30">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />{" "}
                              SAFE
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-sm sm:text-base">
                          <div
                            className={`${pixelMonoFont.className} text-sm sm:text-base text-[#00ff00]`}
                          >
                            Balance:{" "}
                            <span className="text-[#00ffff] font-medium">
                              {parseFloat(token.balance) /
                                Math.pow(10, token.contract_decimals)}{" "}
                              {token.contract_ticker_symbol}
                            </span>
                          </div>
                          <div
                            className={`${pixelMonoFont.className} text-sm sm:text-base text-[#00ff00]`}
                          >
                            Value:{" "}
                            <span className="text-[#00ffff] font-medium">
                              {token.pretty_quote}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`${pixelMonoFont.className} mt-2 sm:mt-3 text-sm sm:text-base font-mono text-[#00ffaa] truncate`}
                        >
                          {token.contract_address}
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end gap-3 sm:gap-4 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#00ff00]/20 md:ml-auto">
                      <div
                        className={`text-center px-3 sm:px-4 py-2 rounded-lg border ${
                          token.is_spam
                            ? "bg-black/90 text-[#ff0000] border-[#ff0000]/50"
                            : "bg-black/90 text-[#00ff00] border-[#00ff00]/50"
                        }`}
                      >
                        <div
                          className={`${pixelMonoFont.className} text-sm font-medium`}
                        >
                          RISK
                        </div>
                        <div
                          className={`${pixelMonoFont.className} text-base sm:text-lg font-semibold`}
                        >
                          {token.spamScore === "Medium"
                            ? "Low"
                            : token.spamScore}
                        </div>
                      </div>

                      <a
                        href={getExplorerUrl(
                          selectedChain,
                          token.contract_address
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${pixelMonoFont.className} inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-black/80 hover:bg-black/90 border border-[#00ff00]/50 rounded-lg text-[#00ffff] hover:text-[#00ff00] transition-colors text-sm sm:text-base gap-2`}
                      >
                        <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" /> VIEW
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      {/* Chain Coverage Section */}
      <CovalentChainMetrics />
      {/* Footer */}
      <Footer />
    </div>
  );
}
