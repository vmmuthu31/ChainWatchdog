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
  AlertCircle,
  ExternalLink,
  Search,
  ChevronDown,
  X,
} from "lucide-react";
import { toast } from "sonner";
import WalletConnect from "@/components/WalletConnect";
import Image from "next/image";
import { useMemo, useState, useRef, useEffect } from "react";

export default function Home() {
  const [tokenData, setTokenData] = useState<GoldRushResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "spam" | "safe">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [networkSearchQuery, setNetworkSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState(supportedChains[0].id);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNetworkDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      setShowNetworkDropdown(false);
    }
  }, [isLoading]);

  const currentChain = useMemo(() => {
    return (
      supportedChains.find((chain) => chain.id === selectedChain) ||
      supportedChains[0]
    );
  }, [selectedChain]);

  const mainnetChains = useMemo(() => {
    return supportedChains.filter((chain) => chain.type === "Mainnet");
  }, []);

  const testnetChains = useMemo(() => {
    return supportedChains.filter((chain) => chain.type === "Testnet");
  }, []);

  const categorizedMainnetChains = useMemo(() => {
    const evmChains = mainnetChains.filter((chain) => chain.category === "EVM");
    const layer2Chains = mainnetChains.filter(
      (chain) => chain.category === "Layer2"
    );
    const nonEvmChains = mainnetChains.filter(
      (chain) => chain.category === "Non-EVM"
    );
    const otherChains = mainnetChains.filter(
      (chain) => chain.category === "Other" || !chain.category
    );

    return { evmChains, layer2Chains, nonEvmChains, otherChains };
  }, [mainnetChains]);

  const categorizedTestnetChains = useMemo(() => {
    const evmChains = testnetChains.filter((chain) => chain.category === "EVM");
    const layer2Chains = testnetChains.filter(
      (chain) => chain.category === "Layer2"
    );
    const nonEvmChains = testnetChains.filter(
      (chain) => chain.category === "Non-EVM"
    );
    const otherChains = testnetChains.filter(
      (chain) => chain.category === "Other" || !chain.category
    );

    return { evmChains, layer2Chains, nonEvmChains, otherChains };
  }, [testnetChains]);

  const filteredMainnetChains = useMemo(() => {
    return {
      evmChains: categorizedMainnetChains.evmChains.filter((chain) =>
        chain.name.toLowerCase().includes(networkSearchQuery.toLowerCase())
      ),
      layer2Chains: categorizedMainnetChains.layer2Chains.filter((chain) =>
        chain.name.toLowerCase().includes(networkSearchQuery.toLowerCase())
      ),
      nonEvmChains: categorizedMainnetChains.nonEvmChains.filter((chain) =>
        chain.name.toLowerCase().includes(networkSearchQuery.toLowerCase())
      ),
      otherChains: categorizedMainnetChains.otherChains.filter((chain) =>
        chain.name.toLowerCase().includes(networkSearchQuery.toLowerCase())
      ),
    };
  }, [categorizedMainnetChains, networkSearchQuery]);

  const filteredTestnetChains = useMemo(() => {
    return {
      evmChains: categorizedTestnetChains.evmChains.filter((chain) =>
        chain.name.toLowerCase().includes(networkSearchQuery.toLowerCase())
      ),
      layer2Chains: categorizedTestnetChains.layer2Chains.filter((chain) =>
        chain.name.toLowerCase().includes(networkSearchQuery.toLowerCase())
      ),
      nonEvmChains: categorizedTestnetChains.nonEvmChains.filter((chain) =>
        chain.name.toLowerCase().includes(networkSearchQuery.toLowerCase())
      ),
      otherChains: categorizedTestnetChains.otherChains.filter((chain) =>
        chain.name.toLowerCase().includes(networkSearchQuery.toLowerCase())
      ),
    };
  }, [categorizedTestnetChains, networkSearchQuery]);

  const hasFilteredMainnetResults = useMemo(() => {
    return (
      filteredMainnetChains.evmChains.length > 0 ||
      filteredMainnetChains.layer2Chains.length > 0 ||
      filteredMainnetChains.nonEvmChains.length > 0 ||
      filteredMainnetChains.otherChains.length > 0
    );
  }, [filteredMainnetChains]);

  const hasFilteredTestnetResults = useMemo(() => {
    return (
      filteredTestnetChains.evmChains.length > 0 ||
      filteredTestnetChains.layer2Chains.length > 0 ||
      filteredTestnetChains.nonEvmChains.length > 0 ||
      filteredTestnetChains.otherChains.length > 0
    );
  }, [filteredTestnetChains]);

  useEffect(() => {
    if (!showNetworkDropdown) {
      setNetworkSearchQuery("");
    }
  }, [showNetworkDropdown]);

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
      filtered = filtered.filter(
        (token) => token.is_spam || token.spamConfidence === "MAYBE"
      );
    } else if (filterType === "safe") {
      filtered = filtered.filter(
        (token) => !token.is_spam && token.spamConfidence === "NO"
      );
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
    const maybe = tokenData.data.items.filter(
      (t) => !t.is_spam && t.spamConfidence === "MAYBE"
    ).length;
    const safe = total - spam - maybe;

    return { total, spam, safe, maybe };
  }, [tokenData]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#0f172a] via-[#0f1729] to-black text-white">
      <header className="w-full border-b border-gray-800/50 backdrop-blur-md bg-black/20 p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FA4C15] to-[#FF8A3D] rounded-full blur opacity-70"></div>
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="Bitcoin Mining Logo"
                  width={20}
                  height={20}
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FA4C15] to-orange-400 bg-clip-text text-transparent">
              ChainWatchDog
            </h1>
          </div>
          <WalletConnect />
        </div>
      </header>

      <main className="container mx-auto flex flex-1 flex-col items-center justify-center gap-10 p-4 md:p-8">
        <div className="text-center space-y-6 max-w-2xl relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FA4C15]/20 via-transparent to-transparent blur-3xl"></div>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-[#FA4C15] via-orange-500 to-yellow-500 bg-clip-text text-transparent animate-fade-in-up">
            Spam Shield Detector
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed max-w-xl mx-auto animate-fade-in-up animation-delay-100">
            Instantly analyze wallets for spam tokens and security threats
            across{" "}
            <span className="text-[#FA4C15] font-semibold">
              {supportedChains.length}+ blockchains
            </span>
            .
          </p>
        </div>

        <div className="w-full max-w-xl backdrop-blur-lg bg-white/5 p-8 rounded-2xl border border-gray-800/50 shadow-xl relative z-[10] transform transition-all duration-300 hover:shadow-[0_0_50px_-12px_rgba(250,76,21,0.15)]">
          {/* Network selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select Blockchain Network
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className="w-full flex items-center justify-between p-3 bg-white/5 border border-gray-800 rounded-xl hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FA4C15]/50"
                onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    {currentChain.logoUrl ? (
                      <Image
                        src={currentChain.logoUrl}
                        alt={currentChain.name}
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {currentChain.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{currentChain.name}</span>
                  {currentChain.type === "Testnet" && (
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                      Testnet
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 text-gray-400 ${
                    showNetworkDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showNetworkDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-xl shadow-xl z-[100] max-h-[400px] overflow-hidden">
                  <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md p-2 border-b border-gray-800">
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full pl-9 pr-9 py-2 bg-white/5 border border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FA4C15] text-sm"
                        placeholder="Search networks..."
                        value={networkSearchQuery}
                        onChange={(e) => setNetworkSearchQuery(e.target.value)}
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      {networkSearchQuery && (
                        <button
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 hover:text-white"
                          onClick={() => setNetworkSearchQuery("")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-[340px] p-2">
                    {!hasFilteredMainnetResults &&
                      !hasFilteredTestnetResults && (
                        <div className="py-4 text-center text-gray-400">
                          No networks found matching &quot;{networkSearchQuery}
                          &quot;
                        </div>
                      )}

                    {hasFilteredMainnetResults && (
                      <div className="mb-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase sticky top-0 bg-gray-900/95">
                          Mainnet
                        </div>

                        {filteredMainnetChains.evmChains.length > 0 && (
                          <>
                            <div className="px-3 py-1 text-xs text-gray-500">
                              EVM Chains
                            </div>
                            {filteredMainnetChains.evmChains.map((chain) => (
                              <button
                                key={chain.id}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
                                  selectedChain === chain.id
                                    ? "bg-[#FA4C15]/20 text-[#FA4C15]"
                                    : "hover:bg-white/5"
                                }`}
                                onClick={() => {
                                  setSelectedChain(chain.id);
                                  setShowNetworkDropdown(false);
                                }}
                              >
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10">
                                  {chain.logoUrl ? (
                                    <Image
                                      src={chain.logoUrl}
                                      alt={chain.name}
                                      width={16}
                                      height={16}
                                      className="object-contain"
                                    />
                                  ) : (
                                    chain.name.charAt(0)
                                  )}
                                </span>
                                {chain.name}
                                {selectedChain === chain.id && (
                                  <CheckCircle className="h-4 w-4 ml-auto text-[#FA4C15]" />
                                )}
                              </button>
                            ))}
                          </>
                        )}

                        {filteredMainnetChains.layer2Chains.length > 0 && (
                          <>
                            <div className="px-3 py-1 text-xs text-gray-500 mt-2">
                              Layer 2 Solutions
                            </div>
                            {filteredMainnetChains.layer2Chains.map((chain) => (
                              <button
                                key={chain.id}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
                                  selectedChain === chain.id
                                    ? "bg-[#FA4C15]/20 text-[#FA4C15]"
                                    : "hover:bg-white/5"
                                }`}
                                onClick={() => {
                                  setSelectedChain(chain.id);
                                  setShowNetworkDropdown(false);
                                }}
                              >
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10">
                                  {chain.logoUrl ? (
                                    <Image
                                      src={chain.logoUrl}
                                      alt={chain.name}
                                      width={16}
                                      height={16}
                                      className="object-contain"
                                    />
                                  ) : (
                                    chain.name.charAt(0)
                                  )}
                                </span>
                                {chain.name}
                                {selectedChain === chain.id && (
                                  <CheckCircle className="h-4 w-4 ml-auto text-[#FA4C15]" />
                                )}
                              </button>
                            ))}
                          </>
                        )}

                        {filteredMainnetChains.nonEvmChains.length > 0 && (
                          <>
                            <div className="px-3 py-1 text-xs text-gray-500 mt-2">
                              Non-EVM Chains
                            </div>
                            {filteredMainnetChains.nonEvmChains.map((chain) => (
                              <button
                                key={chain.id}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
                                  selectedChain === chain.id
                                    ? "bg-[#FA4C15]/20 text-[#FA4C15]"
                                    : "hover:bg-white/5"
                                }`}
                                onClick={() => {
                                  setSelectedChain(chain.id);
                                  setShowNetworkDropdown(false);
                                }}
                              >
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10">
                                  {chain.logoUrl ? (
                                    <Image
                                      src={chain.logoUrl}
                                      alt={chain.name}
                                      width={16}
                                      height={16}
                                      className="object-contain"
                                    />
                                  ) : (
                                    chain.name.charAt(0)
                                  )}
                                </span>
                                {chain.name}
                                {selectedChain === chain.id && (
                                  <CheckCircle className="h-4 w-4 ml-auto text-[#FA4C15]" />
                                )}
                              </button>
                            ))}
                          </>
                        )}

                        {filteredMainnetChains.otherChains.length > 0 && (
                          <>
                            <div className="px-3 py-1 text-xs text-gray-500 mt-2">
                              Other Chains
                            </div>
                            {filteredMainnetChains.otherChains.map((chain) => (
                              <button
                                key={chain.id}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
                                  selectedChain === chain.id
                                    ? "bg-[#FA4C15]/20 text-[#FA4C15]"
                                    : "hover:bg-white/5"
                                }`}
                                onClick={() => {
                                  setSelectedChain(chain.id);
                                  setShowNetworkDropdown(false);
                                }}
                              >
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10">
                                  {chain.logoUrl ? (
                                    <Image
                                      src={chain.logoUrl}
                                      alt={chain.name}
                                      width={16}
                                      height={16}
                                      className="object-contain"
                                    />
                                  ) : (
                                    chain.name.charAt(0)
                                  )}
                                </span>
                                {chain.name}
                                {selectedChain === chain.id && (
                                  <CheckCircle className="h-4 w-4 ml-auto text-[#FA4C15]" />
                                )}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}

                    {hasFilteredTestnetResults && (
                      <div
                        className={
                          hasFilteredMainnetResults
                            ? "mt-2 pt-2 border-t border-gray-800"
                            : ""
                        }
                      >
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
                          Testnet
                        </div>

                        {filteredTestnetChains.evmChains.length > 0 && (
                          <>
                            <div className="px-3 py-1 text-xs text-gray-500">
                              EVM Chains
                            </div>
                            {filteredTestnetChains.evmChains.map((chain) => (
                              <button
                                key={chain.id}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
                                  selectedChain === chain.id
                                    ? "bg-[#FA4C15]/20 text-[#FA4C15]"
                                    : "hover:bg-white/5"
                                }`}
                                onClick={() => {
                                  setSelectedChain(chain.id);
                                  setShowNetworkDropdown(false);
                                }}
                              >
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10">
                                  {chain.logoUrl ? (
                                    <Image
                                      src={chain.logoUrl}
                                      alt={chain.name}
                                      width={16}
                                      height={16}
                                      className="object-contain"
                                    />
                                  ) : (
                                    chain.name.charAt(0)
                                  )}
                                </span>
                                {chain.name}
                                {selectedChain === chain.id && (
                                  <CheckCircle className="h-4 w-4 ml-auto text-[#FA4C15]" />
                                )}
                              </button>
                            ))}
                          </>
                        )}

                        {filteredTestnetChains.layer2Chains.length > 0 && (
                          <>
                            <div className="px-3 py-1 text-xs text-gray-500 mt-2">
                              Layer 2 Solutions
                            </div>
                            {filteredTestnetChains.layer2Chains.map((chain) => (
                              <button
                                key={chain.id}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
                                  selectedChain === chain.id
                                    ? "bg-[#FA4C15]/20 text-[#FA4C15]"
                                    : "hover:bg-white/5"
                                }`}
                                onClick={() => {
                                  setSelectedChain(chain.id);
                                  setShowNetworkDropdown(false);
                                }}
                              >
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10">
                                  {chain.logoUrl ? (
                                    <Image
                                      src={chain.logoUrl}
                                      alt={chain.name}
                                      width={16}
                                      height={16}
                                      className="object-contain"
                                    />
                                  ) : (
                                    chain.name.charAt(0)
                                  )}
                                </span>
                                {chain.name}
                                {selectedChain === chain.id && (
                                  <CheckCircle className="h-4 w-4 ml-auto text-[#FA4C15]" />
                                )}
                              </button>
                            ))}
                          </>
                        )}

                        {filteredTestnetChains.nonEvmChains.length > 0 && (
                          <>
                            <div className="px-3 py-1 text-xs text-gray-500 mt-2">
                              Non-EVM Chains
                            </div>
                            {filteredTestnetChains.nonEvmChains.map((chain) => (
                              <button
                                key={chain.id}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
                                  selectedChain === chain.id
                                    ? "bg-[#FA4C15]/20 text-[#FA4C15]"
                                    : "hover:bg-white/5"
                                }`}
                                onClick={() => {
                                  setSelectedChain(chain.id);
                                  setShowNetworkDropdown(false);
                                }}
                              >
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10">
                                  {chain.logoUrl ? (
                                    <Image
                                      src={chain.logoUrl}
                                      alt={chain.name}
                                      width={16}
                                      height={16}
                                      className="object-contain"
                                    />
                                  ) : (
                                    chain.name.charAt(0)
                                  )}
                                </span>
                                {chain.name}
                                {selectedChain === chain.id && (
                                  <CheckCircle className="h-4 w-4 ml-auto text-[#FA4C15]" />
                                )}
                              </button>
                            ))}
                          </>
                        )}

                        {filteredTestnetChains.otherChains.length > 0 && (
                          <>
                            <div className="px-3 py-1 text-xs text-gray-500 mt-2">
                              Other Chains
                            </div>
                            {filteredTestnetChains.otherChains.map((chain) => (
                              <button
                                key={chain.id}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
                                  selectedChain === chain.id
                                    ? "bg-[#FA4C15]/20 text-[#FA4C15]"
                                    : "hover:bg-white/5"
                                }`}
                                onClick={() => {
                                  setSelectedChain(chain.id);
                                  setShowNetworkDropdown(false);
                                }}
                              >
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10">
                                  {chain.logoUrl ? (
                                    <Image
                                      src={chain.logoUrl}
                                      alt={chain.name}
                                      width={16}
                                      height={16}
                                      className="object-contain"
                                    />
                                  ) : (
                                    chain.name.charAt(0)
                                  )}
                                </span>
                                {chain.name}
                                {selectedChain === chain.id && (
                                  <CheckCircle className="h-4 w-4 ml-auto text-[#FA4C15]" />
                                )}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <TokenInputForm onSubmit={handleCheckToken} isLoading={isLoading} />
        </div>

        {isLoading && (
          <div className="w-full max-w-xl p-8 backdrop-blur-lg bg-white/5 rounded-2xl border border-gray-800/50 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-t-2 border-b-2 border-[#FA4C15] animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-[#FA4C15]" />
              </div>
            </div>
            <p className="text-gray-300 mt-4 animate-pulse">
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
              <h3 className="font-medium text-red-400 mb-1">Error</h3>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {tokenData && !error && !isLoading && (
          <div className="w-full max-w-4xl space-y-8 relative z-[5] animate-fade-in">
            {/* Wallet Summary Card */}
            <div className="p-6 backdrop-blur-lg bg-white/5 rounded-2xl border border-gray-800/50 shadow-lg overflow-hidden relative">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#FA4C15]/10 via-transparent to-transparent"></div>

              <div className="flex items-center gap-2 mb-6">
                <div className="h-9 w-9 rounded-lg bg-[#FA4C15]/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-[#FA4C15]" />
                </div>
                <h3 className="text-xl font-bold">Wallet Security Overview</h3>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="space-y-4 text-gray-300 flex-1">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Address</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono bg-white/5 py-1 px-2 rounded-lg truncate">
                        {tokenData.data.address}
                      </span>
                      <a
                        href={`${currentChain.explorer}/address/${tokenData.data.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/5 text-[#FA4C15] hover:bg-white/10 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Network</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-white/5 py-1 px-2 rounded-lg">
                        <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
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
                        <span className="text-sm font-medium">
                          {currentChain.name}
                        </span>
                        {currentChain.type === "Testnet" && (
                          <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                            Testnet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Last Scanned</span>
                    <div className="text-sm bg-white/5 py-1 px-2 rounded-lg">
                      {new Date(tokenData.data.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 flex-1">
                  <div className="p-4 bg-white/5 rounded-xl border border-gray-800 text-center transform transition-all duration-300 hover:scale-105">
                    <div className="text-3xl font-bold text-white mb-1">
                      {spamStats.total}
                    </div>
                    <div className="text-xs text-gray-400">Total Tokens</div>
                  </div>
                  <div className="p-4 bg-red-950/20 rounded-xl border border-red-500/30 text-center transform transition-all duration-300 hover:scale-105">
                    <div className="text-3xl font-bold text-red-400 mb-1">
                      {spamStats.spam}
                    </div>
                    <div className="text-xs text-red-400">Spam Tokens</div>
                  </div>
                  <div className="p-4 bg-green-950/20 rounded-xl border border-green-500/30 text-center transform transition-all duration-300 hover:scale-105">
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      {spamStats.safe}
                    </div>
                    <div className="text-xs text-green-400">Safe Tokens</div>
                  </div>
                </div>
              </div>

              {spamStats.spam > 0 && (
                <div className="mt-6 p-4 border border-red-500/30 bg-red-950/20 rounded-xl flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-400 text-sm">
                      Security Alert
                    </h4>
                    <p className="text-red-300 text-sm">
                      This wallet contains {spamStats.spam} known spam tokens
                      that could be potential scams.
                    </p>
                  </div>
                </div>
              )}

              {spamStats.spam === 0 && (
                <div className="mt-6 p-4 border border-green-500/30 bg-green-950/20 rounded-xl flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-400 text-sm">
                      Security Status
                    </h4>
                    <p className="text-green-300 text-sm">
                      No known spam tokens detected in this wallet.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tokens List */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-4 rounded-xl border border-gray-800/50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#FA4C15]/10 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-[#FA4C15]"
                    >
                      <circle cx="8" cy="21" r="1" />
                      <circle cx="19" cy="21" r="1" />
                      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold">Token Holdings</h3>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-60">
                    <input
                      type="text"
                      placeholder="Search tokens..."
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FA4C15] text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    {searchQuery && (
                      <button
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 hover:text-white"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex p-1 bg-white/5 border border-gray-800 rounded-lg overflow-hidden">
                    <button
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        filterType === "all"
                          ? "bg-[#FA4C15] text-white"
                          : "text-gray-400 hover:bg-white/10"
                      }`}
                      onClick={() => setFilterType("all")}
                    >
                      All
                    </button>
                    <button
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        filterType === "spam"
                          ? "bg-[#FA4C15] text-white"
                          : "text-gray-400 hover:bg-white/10"
                      }`}
                      onClick={() => setFilterType("spam")}
                    >
                      Spam
                    </button>
                    <button
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        filterType === "safe"
                          ? "bg-[#FA4C15] text-white"
                          : "text-gray-400 hover:bg-white/10"
                      }`}
                      onClick={() => setFilterType("safe")}
                    >
                      Safe
                    </button>
                  </div>
                </div>
              </div>

              {filteredTokens.length === 0 && (
                <div className="p-12 backdrop-blur-lg bg-white/5 rounded-2xl border border-gray-800/50 text-center">
                  <div className="h-16 w-16 mx-auto mb-4 text-gray-500 opacity-60">
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
                  <h3 className="text-lg font-medium text-gray-400 mb-2">
                    No tokens found
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    No tokens match your current filters. Try changing your
                    search or filter settings.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {filteredTokens.map((token, index) => (
                  <div
                    key={token.contract_address}
                    className={`p-5 backdrop-blur-lg rounded-xl border flex flex-col md:flex-row md:items-center gap-4 transition-all duration-300 hover:shadow-lg animate-fade-in ${
                      token.is_spam
                        ? "bg-red-950/10 border-red-500/30"
                        : token.spamConfidence === "MAYBE"
                        ? "bg-yellow-950/10 border-yellow-500/30"
                        : "bg-white/5 border-gray-800/50 hover:border-gray-700/80"
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 relative rounded-full overflow-hidden bg-white/10 flex-shrink-0 border border-gray-800/50">
                        {token.logo_url ? (
                          <Image
                            src={token.logo_url}
                            alt={token.contract_name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <span className="text-lg font-semibold text-gray-400">
                              {token.contract_ticker_symbol.charAt(0)}
                            </span>
                          </div>
                        )}

                        {/* Security indicator dot */}
                        <div
                          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black ${
                            token.is_spam
                              ? "bg-red-500"
                              : token.spamConfidence === "MAYBE"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        ></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-medium truncate">
                            {token.contract_name}
                          </h4>
                          <span className="text-sm px-2 py-0.5 bg-white/10 rounded-full text-gray-400">
                            {token.contract_ticker_symbol}
                          </span>

                          {token.is_spam && (
                            <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Spam Token
                            </span>
                          )}

                          {!token.is_spam &&
                            token.spamConfidence === "MAYBE" && (
                              <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Caution
                              </span>
                            )}

                          {!token.is_spam && token.spamConfidence === "NO" && (
                            <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Safe
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                          <div className="text-gray-400">
                            Balance:{" "}
                            <span className="text-white font-medium">
                              {parseFloat(token.balance) /
                                Math.pow(10, token.contract_decimals)}{" "}
                              {token.contract_ticker_symbol}
                            </span>
                          </div>
                          <div className="text-gray-400">
                            Value:{" "}
                            <span className="text-white font-medium">
                              {token.pretty_quote}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 text-xs font-mono text-gray-500 truncate">
                          {token.contract_address}
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-2 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-800/50 md:ml-auto">
                      <div
                        className={`text-center px-3 py-1 rounded-lg ${
                          token.is_spam
                            ? "bg-red-500/20 text-red-400"
                            : token.spamConfidence === "MAYBE"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        <div className="text-xs font-medium">Risk Level</div>
                        <div className="text-sm font-semibold">
                          {token.spamScore}
                        </div>
                      </div>

                      <a
                        href={getExplorerUrl(
                          selectedChain,
                          token.contract_address
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-gray-800 rounded-lg text-gray-300 hover:text-[#FA4C15] transition-colors text-xs gap-1.5"
                      >
                        <ExternalLink className="h-3 w-3" /> View in Explorer
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full border-t border-gray-800/50 backdrop-blur-md bg-black/20 p-6 text-center mt-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image
              src="/logo.png"
              alt="Bitcoin Mining Logo"
              width={20}
              height={20}
            />
            <p className="text-lg font-semibold text-white">ChainWatchDog</p>
          </div>
          <p className="text-sm text-gray-400">
            Powered by{" "}
            <span className="text-[#FA4C15] font-semibold">ChainWatchDog</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Spam detection powered by CovalentHQ threat intelligence
          </p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
