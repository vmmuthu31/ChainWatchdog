import { pixelMonoFont } from "@/lib/font";
import { CheckCircle, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import TokenLogo from "../TokenLogo";

const spamSupportedChainIds = [
  "eth-mainnet",
  "bsc-mainnet",
  "matic-mainnet",
  "optimism-mainnet",
  "gnosis-mainnet",
  "base-mainnet",
];
type Chain = {
  id: string;
  name: string;
  type: string;
  category?: string;
  logoUrl?: string;
};

type NetworkDropdownProps = {
  supportedChains: Chain[];
  selectedChain: string;
  setSelectedChain: (chainId: string) => void;
  activeTab: string;
  isLoading: boolean;
  currentChain: Chain;
};

function NetworkDropdown({
  supportedChains,
  selectedChain,
  setSelectedChain,
  activeTab,
  isLoading,
  currentChain,
}: NetworkDropdownProps) {
  const [networkSearchQuery, setNetworkSearchQuery] = useState("");
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

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
    if (!showNetworkDropdown) {
      setNetworkSearchQuery("");
    }
  }, [showNetworkDropdown]);

  useEffect(() => {
    if (
      activeTab === "recent" &&
      !spamSupportedChainIds.includes(selectedChain)
    ) {
      setSelectedChain("eth-mainnet");
    }
  }, [activeTab, selectedChain, spamSupportedChainIds]);
  return (
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
              {!hasFilteredMainnetResults && !hasFilteredTestnetResults && (
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

                  {filteredMainnetChains.nonEvmChains.length > 0 &&
                    activeTab !== "recent" && (
                      <>
                        <div className="px-3 py-1 text-xs text-gray-500 mt-2">
                          Non-EVM Chains
                        </div>
                        {filteredMainnetChains.nonEvmChains.map((chain) => (
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

                  {filteredMainnetChains.otherChains.length > 0 &&
                    activeTab !== "recent" && (
                      <>
                        <div className="px-3 py-1 text-xs text-gray-500 mt-2">
                          Other Chains
                        </div>
                        {filteredMainnetChains.otherChains.map((chain) => (
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
                          {chain.name}
                          {selectedChain === chain.id && (
                            <CheckCircle className="h-4 w-4 ml-auto text-[#00ff00]" />
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
  );
}

export default NetworkDropdown;
