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
  ChevronDown,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useMemo, useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { RecentSpamTokens } from "@/components/RecentSpamTokens";
import Link from "next/link";
import { pixelFont, pixelMonoFont } from "@/lib/font";
import Navbar from "@/components/Navbar";

const TokenLogo = ({
  src,
  alt,
  size = 40,
}: {
  src?: string;
  alt: string;
  size?: number;
}) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className="flex items-center justify-center bg-gradient-to-br from-black to-gray-900 border border-[#00ff00]/10 rounded-full overflow-hidden"
        style={{ width: size, height: size }}
      >
        <span
          className={`${pixelMonoFont.className} text-lg sm:text-xl font-semibold text-[#00ff00]`}
        >
          {alt?.[0]?.toUpperCase() || "?"}
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="object-cover"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  );
};

export default function Home() {
  const [tokenData, setTokenData] = useState<GoldRushResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "spam" | "safe">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [networkSearchQuery, setNetworkSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState(supportedChains[0].id);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "wallet" | "recent">(
    "search"
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [walletTokens, setWalletTokens] = useState<any[]>([]);
  const [isLoadingWalletTokens, setIsLoadingWalletTokens] = useState(false);

  const spamSupportedChainIds = [
    "eth-mainnet",
    "bsc-mainnet",
    "matic-mainnet",
    "optimism-mainnet",
    "gnosis-mainnet",
    "base-mainnet",
  ];

  const { address: walletAddress, isConnected } = useAccount();

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

  useEffect(() => {
    if (isConnected && walletAddress && activeTab === "wallet") {
      fetchWalletTokens(walletAddress);
    }
  }, [isConnected, walletAddress, activeTab, selectedChain]);

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

  useEffect(() => {
    if (
      activeTab === "recent" &&
      !spamSupportedChainIds.includes(selectedChain)
    ) {
      setSelectedChain("eth-mainnet");
    }
  }, [activeTab, selectedChain, spamSupportedChainIds]);

  const filteredMainnetChains = useMemo(() => {
    const results = {
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

    if (activeTab === "recent") {
      return {
        evmChains: results.evmChains.filter((chain) =>
          spamSupportedChainIds.includes(chain.id)
        ),
        layer2Chains: results.layer2Chains.filter((chain) =>
          spamSupportedChainIds.includes(chain.id)
        ),
        nonEvmChains: [],
        otherChains: [],
      };
    }

    return results;
  }, [
    categorizedMainnetChains,
    networkSearchQuery,
    activeTab,
    spamSupportedChainIds,
  ]);

  const filteredTestnetChains = useMemo(() => {
    if (activeTab === "recent") {
      return {
        evmChains: [],
        layer2Chains: [],
        nonEvmChains: [],
        otherChains: [],
      };
    }

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
  }, [categorizedTestnetChains, networkSearchQuery, activeTab]);

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
          <div className="mb-6">
            <label
              className={`${pixelMonoFont.className} block text-lg sm:text-xl font-medium text-[#00ff00] mb-2`}
            >
              Select Blockchain Network
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className="w-full flex items-center justify-between p-2 sm:p-3 bg-black/80 border border-[#00ff00]/50 rounded-xl hover:bg-black/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00ff00]/50"
                onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {currentChain.logoUrl && (
                    <TokenLogo
                      src={currentChain.logoUrl}
                      alt={currentChain.name}
                      size={16}
                    />
                  )}
                  <span
                    className={`${pixelMonoFont.className} text-xs sm:text-base font-medium text-[#00ffff] truncate max-w-[150px] sm:max-w-none`}
                  >
                    {currentChain.name}
                  </span>
                  {currentChain.type === "Testnet" && (
                    <span
                      className={`${pixelMonoFont.className} text-[10px] xs:text-xs px-1 sm:px-2 py-0.5 bg-[#ff00ff]/20 text-[#ff00ff] rounded-full`}
                    >
                      Testnet
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-200 text-[#00ff00] ${
                    showNetworkDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showNetworkDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-md border border-[#00ff00]/30 rounded-xl shadow-[0_0_15px_rgba(0,255,0,0.3)] z-[100] max-h-[60vh] sm:max-h-[400px] overflow-hidden">
                  <div className="sticky top-0 bg-black/95 backdrop-blur-md p-2 border-b border-[#00ff00]/30">
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full pl-8 sm:pl-9 pr-9 py-1.5 sm:py-2 bg-black/80 border border-[#00ff00]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00ff00] text-[#00ffff] text-xs sm:text-sm"
                        placeholder="Search networks..."
                        value={networkSearchQuery}
                        onChange={(e) => setNetworkSearchQuery(e.target.value)}
                      />
                      <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00ff00]" />
                      {networkSearchQuery && (
                        <button
                          className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00ff00] hover:text-[#00ffff]"
                          onClick={() => setNetworkSearchQuery("")}
                        >
                          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-[calc(60vh-48px)] sm:max-h-[340px] p-2">
                    {!hasFilteredMainnetResults &&
                      !hasFilteredTestnetResults && (
                        <div className="py-4 text-center text-[#00ff00]">
                          No networks found matching &quot;{networkSearchQuery}
                          &quot;
                        </div>
                      )}

                    {hasFilteredMainnetResults && (
                      <div className="mb-2">
                        <div
                          className={`${pixelMonoFont.className} px-3 py-2 text-xs font-semibold text-[#00ffff] uppercase top-0 bg-black/95`}
                        >
                          Mainnet
                        </div>

                        {/* Filter EVM chains based on active tab */}
                        {filteredMainnetChains.evmChains.length > 0 && (
                          <>
                            <div className="px-3 py-1 text-xs text-gray-500">
                              EVM Chains
                            </div>
                            {filteredMainnetChains.evmChains
                              .filter(
                                (chain) =>
                                  activeTab !== "recent" ||
                                  spamSupportedChainIds.includes(chain.id)
                              )
                              .map((chain) => (
                                <button
                                  key={chain.id}
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
                                    selectedChain === chain.id
                                      ? "bg-[#00ff00]/20 text-[#00ff00]"
                                      : "hover:bg-black/80"
                                  }`}
                                  onClick={() => {
                                    setSelectedChain(chain.id);
                                    setShowNetworkDropdown(false);
                                  }}
                                >
                                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-black/80">
                                    {chain.logoUrl ? (
                                      <TokenLogo
                                        src={chain.logoUrl}
                                        alt={chain.name}
                                        size={16}
                                      />
                                    ) : (
                                      chain.name.charAt(0)
                                    )}
                                  </span>
                                  {chain.name}
                                  {selectedChain === chain.id && (
                                    <CheckCircle className="h-4 w-4 ml-auto text-[#00ff00]" />
                                  )}
                                </button>
                              ))}
                          </>
                        )}

                        {/* Filter Layer 2 chains based on active tab */}
                        {filteredMainnetChains.layer2Chains.length > 0 && (
                          <>
                            <div className="px-3 py-1 text-xs text-gray-500 mt-2">
                              Layer 2 Solutions
                            </div>
                            {filteredMainnetChains.layer2Chains
                              .filter(
                                (chain) =>
                                  activeTab !== "recent" ||
                                  spamSupportedChainIds.includes(chain.id)
                              )
                              .map((chain) => (
                                <button
                                  key={chain.id}
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
                                    selectedChain === chain.id
                                      ? "bg-[#00ff00]/20 text-[#00ff00]"
                                      : "hover:bg-black/80"
                                  }`}
                                  onClick={() => {
                                    setSelectedChain(chain.id);
                                    setShowNetworkDropdown(false);
                                  }}
                                >
                                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-black/80">
                                    {chain.logoUrl ? (
                                      <TokenLogo
                                        src={chain.logoUrl}
                                        alt={chain.name}
                                        size={16}
                                      />
                                    ) : (
                                      chain.name.charAt(0)
                                    )}
                                  </span>
                                  {chain.name}
                                  {selectedChain === chain.id && (
                                    <CheckCircle className="h-4 w-4 ml-auto text-[#00ff00]" />
                                  )}
                                </button>
                              ))}
                          </>
                        )}

                        {/* Filter Non-EVM chains based on active tab */}
                        {filteredMainnetChains.nonEvmChains.length > 0 &&
                          activeTab !== "recent" && (
                            <>
                              <div className="px-3 py-1 text-xs text-gray-500 mt-2">
                                Non-EVM Chains
                              </div>
                              {filteredMainnetChains.nonEvmChains.map(
                                (chain) => (
                                  <button
                                    key={chain.id}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
                                      selectedChain === chain.id
                                        ? "bg-[#00ff00]/20 text-[#00ff00]"
                                        : "hover:bg-black/80"
                                    }`}
                                    onClick={() => {
                                      setSelectedChain(chain.id);
                                      setShowNetworkDropdown(false);
                                    }}
                                  >
                                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-black/80">
                                      {chain.logoUrl ? (
                                        <TokenLogo
                                          src={chain.logoUrl}
                                          alt={chain.name}
                                          size={16}
                                        />
                                      ) : (
                                        chain.name.charAt(0)
                                      )}
                                    </span>
                                    {chain.name}
                                    {selectedChain === chain.id && (
                                      <CheckCircle className="h-4 w-4 ml-auto text-[#00ff00]" />
                                    )}
                                  </button>
                                )
                              )}
                            </>
                          )}

                        {/* Filter Other chains based on active tab */}
                        {filteredMainnetChains.otherChains.length > 0 &&
                          activeTab !== "recent" && (
                            <>
                              <div className="px-3 py-1 text-xs text-gray-500 mt-2">
                                Other Chains
                              </div>
                              {filteredMainnetChains.otherChains.map(
                                (chain) => (
                                  <button
                                    key={chain.id}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
                                      selectedChain === chain.id
                                        ? "bg-[#00ff00]/20 text-[#00ff00]"
                                        : "hover:bg-black/80"
                                    }`}
                                    onClick={() => {
                                      setSelectedChain(chain.id);
                                      setShowNetworkDropdown(false);
                                    }}
                                  >
                                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-black/80">
                                      {chain.logoUrl ? (
                                        <TokenLogo
                                          src={chain.logoUrl}
                                          alt={chain.name}
                                          size={16}
                                        />
                                      ) : (
                                        chain.name.charAt(0)
                                      )}
                                    </span>
                                    {chain.name}
                                    {selectedChain === chain.id && (
                                      <CheckCircle className="h-4 w-4 ml-auto text-[#00ff00]" />
                                    )}
                                  </button>
                                )
                              )}
                            </>
                          )}
                      </div>
                    )}

                    {/* Hide testnets in recent tab */}
                    {hasFilteredTestnetResults && activeTab !== "recent" && (
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
                                    ? "bg-[#00ff00]/20 text-[#00ff00]"
                                    : "hover:bg-black/80"
                                }`}
                                onClick={() => {
                                  setSelectedChain(chain.id);
                                  setShowNetworkDropdown(false);
                                }}
                              >
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-black/80">
                                  {chain.logoUrl ? (
                                    <TokenLogo
                                      src={chain.logoUrl}
                                      alt={chain.name}
                                      size={16}
                                    />
                                  ) : (
                                    chain.name.charAt(0)
                                  )}
                                </span>
                                {chain.name}
                                {selectedChain === chain.id && (
                                  <CheckCircle className="h-4 w-4 ml-auto text-[#00ff00]" />
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
                                    ? "bg-[#00ff00]/20 text-[#00ff00]"
                                    : "hover:bg-black/80"
                                }`}
                                onClick={() => {
                                  setSelectedChain(chain.id);
                                  setShowNetworkDropdown(false);
                                }}
                              >
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-black/80">
                                  {chain.logoUrl ? (
                                    <TokenLogo
                                      src={chain.logoUrl}
                                      alt={chain.name}
                                      size={16}
                                    />
                                  ) : (
                                    chain.name.charAt(0)
                                  )}
                                </span>
                                ` {chain.name}
                                {selectedChain === chain.id && (
                                  <CheckCircle className="h-4 w-4 ml-auto text-[#00ff00]" />
                                )}
                                `
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
                                    ? "bg-[#00ff00]/20 text-[#00ff00]"
                                    : "hover:bg-black/80"
                                }`}
                                onClick={() => {
                                  setSelectedChain(chain.id);
                                  setShowNetworkDropdown(false);
                                }}
                              >
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-black/80">
                                  {chain.logoUrl ? (
                                    <TokenLogo
                                      src={chain.logoUrl}
                                      alt={chain.name}
                                      size={16}
                                    />
                                  ) : (
                                    chain.name.charAt(0)
                                  )}
                                </span>
                                {chain.name}
                                {selectedChain === chain.id && (
                                  <CheckCircle className="h-4 w-4 ml-auto text-[#00ff00]" />
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
                                    ? "bg-[#00ff00]/20 text-[#00ff00]"
                                    : "hover:bg-black/80"
                                }`}
                                onClick={() => {
                                  setSelectedChain(chain.id);
                                  setShowNetworkDropdown(false);
                                }}
                              >
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-black/80">
                                  {chain.logoUrl ? (
                                    <TokenLogo
                                      src={chain.logoUrl}
                                      alt={chain.name}
                                      size={16}
                                    />
                                  ) : (
                                    chain.name.charAt(0)
                                  )}
                                </span>
                                {chain.name}
                                {selectedChain === chain.id && (
                                  <CheckCircle className="h-4 w-4 ml-auto text-[#00ff00]" />
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
          {/* Tab Selector */}
          <div className="flex p-1 bg-black/80 border border-[#00ff00]/50 rounded-lg overflow-hidden mb-4">
            <button
              className={`flex-1 px-2 xs:px-3 cursor-pointer py-2 text-[10px] xs:text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center ${
                activeTab === "search"
                  ? "bg-[#00ff00] text-black"
                  : "text-[#00ff00] hover:bg-black/90"
              }`}
              onClick={() => setActiveTab("search")}
            >
              <Search className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 inline-block mr-1" />
              <span>Search</span>
            </button>
            {isConnected && (
              <button
                className={`flex-1 px-2 xs:px-3 cursor-pointer py-2 text-[10px] xs:text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center ${
                  activeTab === "wallet"
                    ? "bg-[#00ff00] text-black"
                    : "text-[#00ff00] hover:bg-black/90"
                }`}
                onClick={() => setActiveTab("wallet")}
              >
                <ShieldCheck className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 inline-block mr-1" />
                <span>My Wallet</span>
              </button>
            )}
            <button
              className={`flex-1 px-2 xs:px-3 cursor-pointer py-2 text-[10px] xs:text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center ${
                activeTab === "recent"
                  ? "bg-[#ff0000] text-white"
                  : "text-[#ff0000] hover:bg-black/90"
              }`}
              onClick={() => setActiveTab("recent")}
            >
              <AlertTriangle className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 inline-block mr-1" />
              <span>Recent Spam</span>
            </button>
          </div>
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
      <footer className="w-full border-t border-[#00ff00]/20 backdrop-blur-md bg-black/50 p-4 sm:p-6 md:p-8 text-center mt-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="flex flex-col md:flex-row md:justify-between gap-6 sm:gap-8 py-4">
            {/* Logo and Brand */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="RugProof Logo"
                  width={40}
                  height={40}
                  className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px]"
                />
                <p
                  className={`${pixelFont.className} text-2xl sm:text-3xl font-semibold text-[#00ff00]`}
                >
                  RugProof
                </p>
              </div>
              <p
                className={`${pixelMonoFont.className} text-base sm:text-lg text-[#00ffff] mb-4 sm:text-left`}
              >
                RETRO FUTURISM IN DIGITAL FORM
              </p>
            </div>

            {/* About */}
            <div className="flex flex-col items-center md:items-end max-w-md">
              <p
                className={`${pixelMonoFont.className} text-base sm:text-lg text-gray-400 sm:text-right leading-relaxed`}
              >
                RugProof helps you identify and protect against crypto scams,
                spam tokens, and honeypots across multiple blockchains.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center md:justify-end gap-3">
                <span
                  className={`${pixelMonoFont.className} text-base sm:text-lg text-gray-400`}
                >
                  Powered by{" "}
                  <Link
                    href="https://goldrush.dev/docs/resources/enhanced-spam-lists"
                    className="text-[#ff00ff] font-medium"
                  >
                    Covalent
                  </Link>
                </span>
                <span className="text-gray-500 mx-1">•</span>
                <span
                  className={`${pixelMonoFont.className} text-base sm:text-lg text-gray-400`}
                >
                  Built by{" "}
                  <span className="text-[#00ffff] font-medium">ForgeX</span>
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#00ff00]/10 mt-4 pt-4 flex flex-col sm:flex-row justify-between items-center">
            <p className={`${pixelMonoFont.className} text-base text-gray-500`}>
              © {new Date().getFullYear()} RugProof. All rights reserved.
            </p>
            <div className="flex mt-3 sm:mt-0 gap-4">
              <Link
                href="/"
                className={`${pixelMonoFont.className} text-base text-[#00ff00] hover:text-[#00ffff] transition-colors`}
              >
                SPAM DETECTION
              </Link>
              <Link
                href="/honeypot"
                className={`${pixelMonoFont.className} text-base text-[#ffa500] hover:text-[#ffcc00] transition-colors`}
              >
                HONEYPOT CHECKER
              </Link>
            </div>
          </div>
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

        @keyframes pulseSlow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-pulse-slow {
          animation: pulseSlow 3s ease-in-out infinite;
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

        .glow-green-sm {
          text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
        }

        .glow-green-md {
          text-shadow: 0 0 10px rgba(0, 255, 0, 0.7);
        }

        .glow-cyan-sm {
          text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
        }

        .glow-red-sm {
          text-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
        }

        body {
          background-color: #000;
          background-image: linear-gradient(
              rgba(0, 255, 0, 0.05) 1px,
              transparent 1px
            ),
            linear-gradient(90deg, rgba(0, 255, 0, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
        }
      `}</style>
    </div>
  );
}
