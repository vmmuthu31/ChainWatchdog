"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, ExternalLink, Search } from "lucide-react";
import { Press_Start_2P, VT323 } from "next/font/google";
import { getExplorerUrl } from "@/lib/services/goldrush";
import yaml from "js-yaml";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

const pixelMonoFont = VT323({
  weight: "400",
  subsets: ["latin"],
});

// Network configuration
const networkMapping: Record<
  string,
  { id: string; name: string; yamlPath: string; nftYamlPath: string }
> = {
  ETHEREUM_MAINNET: {
    id: "eth-mainnet",
    name: "Ethereum",
    yamlPath: "/spam-lists/tokens/eth_mainnet_token_spam_contracts_yes.yaml",
    nftYamlPath: "/spam-lists/nft/eth_mainnet_nft_spam_contracts.yaml",
  },
  BSC_MAINNET: {
    id: "bsc-mainnet",
    name: "BSC",
    yamlPath: "/spam-lists/tokens/bsc_mainnet_token_spam_contracts_yes_1.yaml",
    nftYamlPath: "/spam-lists/nft/bsc_mainnet_nft_spam_contracts.yaml",
  },
  POLYGON_MAINNET: {
    id: "matic-mainnet",
    name: "Polygon",
    yamlPath: "/spam-lists/tokens/pol_mainnet_token_spam_contracts_yes.yaml",
    nftYamlPath: "/spam-lists/nft/pol_mainnet_nft_spam_contracts.yaml",
  },
  OPTIMISM_MAINNET: {
    id: "optimism-mainnet",
    name: "Optimism",
    yamlPath: "/spam-lists/tokens/op_mainnet_token_spam_contracts_yes.yaml",
    nftYamlPath: "/spam-lists/nft/op_mainnet_nft_spam_contracts.yaml",
  },
  GNOSIS_MAINNET: {
    id: "gnosis-mainnet",
    name: "Gnosis",
    yamlPath: "/spam-lists/tokens/gnosis_mainnet_token_spam_contracts_yes.yaml",
    nftYamlPath: "/spam-lists/nft/gnosis_mainnet_nft_spam_contracts.yaml",
  },
  BASE_MAINNET: {
    id: "base-mainnet",
    name: "Base",
    yamlPath: "/spam-lists/tokens/base_mainnet_token_spam_contracts_yes.yaml",
    nftYamlPath: "/spam-lists/nft/base_mainnet_nft_spam_contracts.yaml",
  },
};

const chainToNetwork: Record<string, { networkKey: string }> = {
  "eth-mainnet": { networkKey: "ETHEREUM_MAINNET" },
  "bsc-mainnet": { networkKey: "BSC_MAINNET" },
  "matic-mainnet": { networkKey: "POLYGON_MAINNET" },
  "optimism-mainnet": { networkKey: "OPTIMISM_MAINNET" },
  "gnosis-mainnet": { networkKey: "GNOSIS_MAINNET" },
  "base-mainnet": { networkKey: "BASE_MAINNET" },
};

type SpamToken = {
  address: string;
  networkId: string;
  network: string;
  name?: string;
  symbol?: string;
  timestamp?: number;
  score?: number;
};

type SearchResult = {
  found: boolean;
  network?: string;
  networkId?: string;
};

interface RecentSpamTokensProps {
  chainId?: string;
}

// Client-side cache for YAML content
const yamlCache: Record<string, { SpamContracts?: string[] }> = {};

// Add renderChainNotification function
const renderChainNotification = (chainId: string | undefined) => {
  // Only in the recent spam tab, show a message when using unsupported chain
  const supportedChainIds = [
    "eth-mainnet",
    "bsc-mainnet",
    "matic-mainnet",
    "optimism-mainnet",
    "gnosis-mainnet",
    "base-mainnet",
  ];

  if (chainId && !supportedChainIds.includes(chainId)) {
    return (
      <div className="mb-4 p-3 bg-black/70 border border-[#ff0000]/30 rounded-lg">
        <p className={`${pixelMonoFont.className} text-base text-[#ff8888]`}>
          Note: Spam token data is only available for Ethereum, BSC, Polygon,
          Optimism, Gnosis, and Base chains. Showing data from Ethereum.
        </p>
      </div>
    );
  }

  return null;
};

export function RecentSpamTokens({ chainId }: RecentSpamTokensProps) {
  const [recentSpamTokens, setRecentSpamTokens] = useState<SpamToken[]>([]);
  const [recentSpamNFTs, setRecentSpamNFTs] = useState<SpamToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecentFromAll, setShowRecentFromAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [activeTab, setActiveTab] = useState<"tokens" | "nfts">("tokens");
  const [selectedChain, setSelectedChain] = useState<string | undefined>(
    chainId
  );

  // Function to get a random timestamp in the past
  const getRandomTimestamp = useCallback(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    return (
      thirtyDaysAgo + Math.floor(Math.random() * (oneDayAgo - thirtyDaysAgo))
    );
  }, []);

  // Function to fetch a YAML file with caching
  const fetchYamlWithCache = useCallback(async (path: string) => {
    if (yamlCache[path]) {
      return yamlCache[path];
    }

    try {
      console.log(`Fetching YAML file: ${path}`);
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${path}: ${response.status} ${response.statusText}`
        );
      }

      const text = await response.text();
      const parsed = yaml.load(text) as { SpamContracts?: string[] };
      yamlCache[path] = parsed;
      return parsed;
    } catch (error) {
      console.error(`Error fetching ${path}:`, error);
      throw error;
    }
  }, []);

  // Function to parse spam list entries
  const parseSpamList = useCallback(
    async (networkKey: string, yamlPath: string, limit = 100) => {
      try {
        const parsed = await fetchYamlWithCache(yamlPath);
        const entries: SpamToken[] = [];

        if (parsed && Array.isArray(parsed.SpamContracts)) {
          const contractsList = parsed.SpamContracts.slice(0, limit);

          contractsList.forEach((entry: string) => {
            const parts = entry.split("/");
            if (parts.length >= 2) {
              // The actual Ethereum address is the second part (index 1)
              const address = parts[1];
              // Score is the third part if available
              const scoreStr = parts.length > 2 ? parts[2] : "0";
              const score = parseInt(scoreStr, 10) || 0;

              // Skip entries with invalid addresses
              if (!address || !address.startsWith("0x")) {
                return;
              }

              const networkInfo = networkMapping[networkKey];
              const isNFT = yamlPath.includes("/nft/");

              entries.push({
                address: address.toLowerCase(),
                networkId: networkInfo.id,
                network: networkInfo.name,
                name: isNFT
                  ? `Spam NFT Collection (${address.substring(0, 6)}...)`
                  : `Spam Token (${address.substring(0, 6)}...)`,
                symbol: isNFT ? "NFT" : "SPAM",
                timestamp: getRandomTimestamp(),
                score: score,
              });
            }
          });
        }

        return entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      } catch (error) {
        console.error(`Error parsing spam list from ${yamlPath}:`, error);
        return [];
      }
    },
    [getRandomTimestamp, fetchYamlWithCache]
  );

  // Function to fetch recent spam tokens
  const fetchRecentSpamTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let tokens: SpamToken[] = [];

      if (showRecentFromAll) {
        // Fetch tokens from all networks
        const defaultNetworks = [
          "ETHEREUM_MAINNET",
          "BSC_MAINNET",
          "POLYGON_MAINNET",
          "OPTIMISM_MAINNET",
          "GNOSIS_MAINNET",
          "BASE_MAINNET",
        ];

        const allTokensPromises = defaultNetworks.map(async (networkKey) => {
          const network = networkMapping[networkKey];
          const spamTokens = await parseSpamList(
            networkKey,
            network.yamlPath,
            20
          );
          return spamTokens.slice(0, 5);
        });

        const allTokensArrays = await Promise.all(allTokensPromises);
        tokens = allTokensArrays
          .flat()
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, 5);
      } else if (selectedChain && chainToNetwork[selectedChain]) {
        // Fetch tokens for specific chain
        const { networkKey } = chainToNetwork[selectedChain];
        const network = networkMapping[networkKey];
        tokens = await parseSpamList(networkKey, network.yamlPath, 10);
        tokens = tokens.slice(0, 5);
      } else {
        // Fetch from default networks
        const defaultNetworks = [
          "ETHEREUM_MAINNET",
          "BSC_MAINNET",
          "POLYGON_MAINNET",
          "OPTIMISM_MAINNET",
          "GNOSIS_MAINNET",
          "BASE_MAINNET",
        ];

        const allTokensPromises = defaultNetworks.map(async (networkKey) => {
          const network = networkMapping[networkKey];
          const spamTokens = await parseSpamList(
            networkKey,
            network.yamlPath,
            10
          );
          return spamTokens.slice(0, 2);
        });

        const allTokensArrays = await Promise.all(allTokensPromises);
        tokens = allTokensArrays
          .flat()
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, 5);
      }

      console.log(`Received ${tokens.length} tokens`);
      setRecentSpamTokens(tokens);
    } catch (err: unknown) {
      console.error("Error fetching recent spam tokens:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to load recent spam tokens: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChain, showRecentFromAll, parseSpamList]);

  // Function to fetch recent spam NFTs
  const fetchRecentSpamNFTs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let nfts: SpamToken[] = [];

      if (showRecentFromAll) {
        // Fetch NFTs from all networks
        const defaultNetworks = [
          "ETHEREUM_MAINNET",
          "BSC_MAINNET",
          "POLYGON_MAINNET",
          "OPTIMISM_MAINNET",
          "GNOSIS_MAINNET",
          "BASE_MAINNET",
        ];

        const allNFTsPromises = defaultNetworks.map(async (networkKey) => {
          const network = networkMapping[networkKey];
          const spamNFTs = await parseSpamList(
            networkKey,
            network.nftYamlPath,
            20
          );
          return spamNFTs.slice(0, 5);
        });

        const allNFTsArrays = await Promise.all(allNFTsPromises);
        nfts = allNFTsArrays
          .flat()
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, 5);
      } else if (selectedChain && chainToNetwork[selectedChain]) {
        // Fetch NFTs for specific chain
        const { networkKey } = chainToNetwork[selectedChain];
        const network = networkMapping[networkKey];
        nfts = await parseSpamList(networkKey, network.nftYamlPath, 10);
        nfts = nfts.slice(0, 5);
      } else {
        // Fetch from default networks
        const defaultNetworks = [
          "ETHEREUM_MAINNET",
          "BSC_MAINNET",
          "POLYGON_MAINNET",
          "OPTIMISM_MAINNET",
          "GNOSIS_MAINNET",
          "BASE_MAINNET",
        ];

        const allNFTsPromises = defaultNetworks.map(async (networkKey) => {
          const network = networkMapping[networkKey];
          const spamNFTs = await parseSpamList(
            networkKey,
            network.nftYamlPath,
            10
          );
          return spamNFTs.slice(0, 2);
        });

        const allNFTsArrays = await Promise.all(allNFTsPromises);
        nfts = allNFTsArrays
          .flat()
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, 5);
      }

      console.log(`Received ${nfts.length} NFTs`);
      setRecentSpamNFTs(nfts);
    } catch (err: unknown) {
      console.error("Error fetching recent spam NFTs:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to load recent spam NFTs: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChain, showRecentFromAll, parseSpamList]);

  // Function to handle token search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setSearchResult(null);

    try {
      const searchAddress = searchTerm.trim().toLowerCase();
      console.log(`Searching for contract: ${searchAddress}`);

      for (const [, network] of Object.entries(networkMapping)) {
        // Search in token spam list
        let parsed = await fetchYamlWithCache(network.yamlPath);

        if (
          parsed?.SpamContracts?.some((entry: string) => {
            const parts = entry.toLowerCase().split("/");
            return parts.length >= 2 && parts[1] === searchAddress;
          })
        ) {
          setSearchResult({
            found: true,
            network: network.name,
            networkId: network.id,
          });
          return;
        }

        // Search in NFT spam list
        parsed = await fetchYamlWithCache(network.nftYamlPath);

        if (
          parsed?.SpamContracts?.some((entry: string) => {
            const parts = entry.toLowerCase().split("/");
            return parts.length >= 2 && parts[1] === searchAddress;
          })
        ) {
          setSearchResult({
            found: true,
            network: network.name,
            networkId: network.id,
          });
          return;
        }
      }

      // If we get here, the address wasn't found
      setSearchResult({ found: false });
    } catch (err: unknown) {
      console.error("Error searching for contract:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to search for contract: ${errorMessage}`);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (chainId) {
      // Check if chainId is in our supported list for spam tokens
      const supportedChainIds = [
        "eth-mainnet",
        "bsc-mainnet",
        "matic-mainnet",
        "optimism-mainnet",
        "gnosis-mainnet",
        "base-mainnet",
      ];

      if (supportedChainIds.includes(chainId)) {
        setSelectedChain(chainId);
      } else {
        // Default to Ethereum for unsupported chains
        setSelectedChain("eth-mainnet");
      }
    }
  }, [chainId]);

  useEffect(() => {
    fetchRecentSpamTokens();
    fetchRecentSpamNFTs();
  }, [
    selectedChain,
    showRecentFromAll,
    fetchRecentSpamTokens,
    fetchRecentSpamNFTs,
  ]);

  const toggleModeLabel = showRecentFromAll
    ? "Show chain specific tokens"
    : "Show most recent from all chains";

  // Search UI
  const renderSearchSection = () => (
    <div className="mb-6 pt-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Token or NFT contract address"
            className="w-full px-4 py-3 bg-black/70 border border-[#ff0000]/30 rounded-lg text-[#ffffff] text-base sm:text-lg focus:outline-none focus:ring-1 focus:ring-[#ff0000] placeholder:text-gray-500"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-5 h-5 rounded-full border-t-2 border-b-2 border-[#ff0000] animate-spin"></div>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-4 py-3 bg-[#ff0000]/10 hover:bg-[#ff0000]/20 text-[#ff8888] rounded-lg border border-[#ff0000]/30 flex items-center gap-2 transition-colors disabled:opacity-50 text-base"
        >
          <Search className="h-5 w-5" />
          <span>Search</span>
        </button>
      </form>

      {searchResult && (
        <div className="mt-4 p-4 bg-black/70 border border-[#ff0000]/30 rounded-lg animate-fade-in">
          {searchResult.found ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  className={`${pixelMonoFont.className} text-lg sm:text-xl text-[#ff0000] font-bold`}
                >
                  SPAM ALERT!
                </span>
                <span
                  className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ff8888]`}
                >
                  Contract found in {searchResult.network} spam list
                </span>
              </div>
              <a
                href={
                  searchResult.networkId &&
                  getExplorerUrl(searchResult.networkId, searchTerm)
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-sm sm:text-base text-[#ff8888] hover:text-[#ff5555] flex items-center gap-2 transition-colors w-fit"
              >
                <ExternalLink className="h-4 w-4" />
                View on explorer
              </a>
            </div>
          ) : (
            <p
              className={`${pixelMonoFont.className} text-lg sm:text-xl text-green-400`}
            >
              This contract was not found in our spam lists. However, always do
              your own research.
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 backdrop-blur-lg bg-black/50 rounded-xl border border-[#ff0000]/30 shadow-[0_0_15px_rgba(255,0,0,0.2)] relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ff0000]/10 via-transparent to-transparent blur-3xl"></div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#ff0000]/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-[#ff0000]" />
          </div>
          <h3
            className={`${pixelFont.className} text-base sm:text-lg font-medium text-[#ff0000]`}
          >
            RECENT SPAM TOKENS
          </h3>
        </div>
        {renderSearchSection()}
        <div className="flex justify-center py-8">
          <div className="w-10 h-10 rounded-full border-t-2 border-b-2 border-[#ff0000] animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || (recentSpamTokens.length === 0 && recentSpamNFTs.length === 0)) {
    return (
      <div className="p-4 sm:p-6 backdrop-blur-lg bg-black/50 rounded-xl border border-[#ff0000]/30 shadow-[0_0_15px_rgba(255,0,0,0.2)] relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ff0000]/10 via-transparent to-transparent blur-3xl"></div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#ff0000]/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-[#ff0000]" />
          </div>
          <h3
            className={`${pixelFont.className} text-base sm:text-lg font-medium text-[#ff0000]`}
          >
            RECENT SPAM TOKENS
          </h3>
        </div>
        {renderSearchSection()}
        <div className="text-center py-6">
          <p
            className={`${pixelMonoFont.className} text-lg sm:text-xl text-[#ff8888]`}
          >
            {error || "No recent spam contracts found"}
          </p>
          <button
            onClick={() => setShowRecentFromAll(!showRecentFromAll)}
            className="mt-4 px-4 py-2 rounded-md bg-[#ff0000]/10 text-[#ff8888] hover:bg-[#ff0000]/20 transition-colors text-base sm:text-lg"
          >
            {toggleModeLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 backdrop-blur-lg bg-black/50 rounded-xl border border-[#ff0000]/30 shadow-[0_0_15px_rgba(255,0,0,0.2)] relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ff0000]/10 via-transparent to-transparent blur-3xl"></div>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#ff0000]/10 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-[#ff0000]" />
        </div>
        <h3
          className={`${pixelFont.className} text-base sm:text-lg font-medium text-[#ff0000]`}
        >
          RECENT SPAM TOKENS
        </h3>
      </div>

      {/* Show chain notification if needed */}
      {renderChainNotification(chainId)}

      {/* Search section */}
      {renderSearchSection()}

      {/* Mode toggle button */}
      <div className="mb-4">
        <button
          onClick={() => setShowRecentFromAll(!showRecentFromAll)}
          className="w-full px-4 py-2 rounded-md bg-[#ff0000]/10 text-[#ff8888] hover:bg-[#ff0000]/20 transition-colors text-base sm:text-lg"
        >
          {toggleModeLabel}
        </button>
      </div>

      {/* Tabs for Tokens and NFTs */}
      <Tabs
        defaultValue="tokens"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "tokens" | "nfts")}
        className="space-y-4 mt-2"
      >
        <TabsList className="bg-black/50 border border-[#ff0000]/20 p-1 rounded-lg">
          <TabsTrigger
            value="tokens"
            className={`px-4 py-2 text-base rounded-md data-[state=active]:bg-[#ff0000]/10 data-[state=active]:text-[#ff0000] data-[state=active]:font-semibold text-gray-400`}
          >
            Spam Tokens
          </TabsTrigger>
          <TabsTrigger
            value="nfts"
            className={`px-4 py-2 text-base rounded-md data-[state=active]:bg-[#ff0000]/10 data-[state=active]:text-[#ff0000] data-[state=active]:font-semibold text-gray-400`}
          >
            Spam NFTs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="mt-0">
          <div className="space-y-3">
            {recentSpamTokens.map((token, index) => (
              <div
                key={token.address + token.networkId}
                className="p-4 sm:p-5 bg-black/70 border border-[#ff0000]/30 rounded-lg flex items-center gap-4 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-black/80 flex-shrink-0 border border-[#ff0000]/30 flex items-center justify-center">
                  <span
                    className={`${pixelMonoFont.className} text-base sm:text-lg font-semibold text-[#ff0000]`}
                  >
                    {token.symbol?.[0] ||
                      token.address.substring(2, 4).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4
                      className={`${pixelMonoFont.className} text-lg sm:text-xl font-medium truncate text-[#ff5555]`}
                    >
                      {token.name ||
                        `Unknown Token (${token.address.substring(
                          0,
                          6
                        )}...${token.address.substring(38)})`}
                    </h4>
                    {token.symbol && (
                      <span
                        className={`${pixelMonoFont.className} text-base px-2 py-1 bg-black/80 rounded-full text-[#ff0000] border border-[#ff0000]/30`}
                      >
                        {token.symbol}
                      </span>
                    )}
                    {token.score && (
                      <span
                        className={`${pixelMonoFont.className} text-base px-2 py-1 bg-black/80 rounded-full text-[#ff0000] border border-[#ff0000]/30`}
                      >
                        Score: {token.score}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ff0000]/80`}
                    >
                      {token.network}
                    </span>
                    <span
                      className={`${pixelMonoFont.className} text-sm sm:text-base text-[#ff8888] truncate`}
                    >
                      {token.address.substring(0, 8)}...
                      {token.address.substring(36)}
                    </span>
                  </div>
                </div>

                <a
                  href={getExplorerUrl(token.networkId, token.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center p-3 rounded-full bg-black/80 text-[#ff0000] hover:text-[#ff5555] transition-colors border border-[#ff0000]/30"
                >
                  <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              </div>
            ))}

            {recentSpamTokens.length === 0 && (
              <div className="p-6 text-center bg-black/30 rounded-lg border border-[#ff0000]/20">
                <p
                  className={`${pixelMonoFont.className} text-lg sm:text-xl text-[#ff8888]`}
                >
                  No recent spam tokens found
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="nfts" className="mt-0">
          <div className="space-y-3">
            {recentSpamNFTs.map((nft, index) => (
              <div
                key={nft.address + nft.networkId}
                className="p-4 sm:p-5 bg-black/70 border border-[#ff0000]/30 rounded-lg flex items-center gap-4 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-black/80 flex-shrink-0 border border-[#ff0000]/30 flex items-center justify-center">
                  <span
                    className={`${pixelMonoFont.className} text-base sm:text-lg font-semibold text-[#ff0000]`}
                  >
                    NFT
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4
                      className={`${pixelMonoFont.className} text-lg sm:text-xl font-medium truncate text-[#ff5555]`}
                    >
                      {nft.name || `Unknown NFT Collection`}
                    </h4>
                    <span
                      className={`${pixelMonoFont.className} text-base px-2 py-1 bg-black/80 rounded-full text-[#ff0000] border border-[#ff0000]/30`}
                    >
                      NFT
                    </span>
                    {nft.score && (
                      <span
                        className={`${pixelMonoFont.className} text-base px-2 py-1 bg-black/80 rounded-full text-[#ff0000] border border-[#ff0000]/30`}
                      >
                        Risk: {nft.score}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ff0000]/80`}
                    >
                      {nft.network}
                    </span>
                    <span
                      className={`${pixelMonoFont.className} text-sm sm:text-base text-[#ff8888] truncate`}
                    >
                      {nft.address.substring(0, 8)}...
                      {nft.address.substring(36)}
                    </span>
                  </div>
                </div>

                <a
                  href={getExplorerUrl(nft.networkId, nft.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center p-3 rounded-full bg-black/80 text-[#ff0000] hover:text-[#ff5555] transition-colors border border-[#ff0000]/30"
                >
                  <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              </div>
            ))}

            {recentSpamNFTs.length === 0 && (
              <div className="p-6 text-center bg-black/30 rounded-lg border border-[#ff0000]/20">
                <p
                  className={`${pixelMonoFont.className} text-lg sm:text-xl text-[#ff8888]`}
                >
                  No recent spam NFTs found
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RecentSpamTokens;
