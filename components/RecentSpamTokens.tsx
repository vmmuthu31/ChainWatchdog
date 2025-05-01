"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, Clock, Search } from "lucide-react";
import { Press_Start_2P, VT323 } from "next/font/google";
import { getExplorerUrl } from "@/lib/services/goldrush";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

const pixelMonoFont = VT323({
  weight: "400",
  subsets: ["latin"],
});

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

export function RecentSpamTokens({ chainId }: RecentSpamTokensProps) {
  const [recentSpamTokens, setRecentSpamTokens] = useState<SpamToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecentFromAll, setShowRecentFromAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  useEffect(() => {
    fetchRecentSpamTokens();
  }, [chainId, showRecentFromAll]);

  const fetchRecentSpamTokens = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let apiUrl = "";

      if (showRecentFromAll) {
        apiUrl = `/api/spam-tokens?recent=true`;
      } else {
        apiUrl = chainId
          ? `/api/spam-tokens?chainId=${chainId}`
          : "/api/spam-tokens";
      }

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setRecentSpamTokens(data.tokens);
    } catch (err) {
      console.error("Error fetching recent spam tokens:", err);
      setError("Failed to load recent spam tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setSearchResult(null);

    try {
      const apiUrl = `/api/spam-tokens?token=${searchTerm.trim()}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setSearchResult(data);
    } catch (err) {
      console.error("Error searching for token:", err);
      setError("Failed to search for token");
    } finally {
      setIsSearching(false);
    }
  };

  const toggleModeLabel = showRecentFromAll
    ? "Show chain specific tokens"
    : "Show most recent from all chains";

  // Search UI
  const renderSearchSection = () => (
    <div className="mb-4 pt-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search token address"
            className="w-full px-3 py-2 bg-black/70 border border-[#ff0000]/30 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#ff0000] placeholder:text-gray-500"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 rounded-full border-t-2 border-b-2 border-[#ff0000] animate-spin"></div>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-3 py-2 bg-[#ff0000]/10 hover:bg-[#ff0000]/20 text-[#ff8888] rounded-lg border border-[#ff0000]/30 flex items-center gap-1 transition-colors disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
        </button>
      </form>

      {searchResult && (
        <div className="mt-3 p-3 bg-black/70 border border-[#ff0000]/30 rounded-lg animate-fade-in">
          {searchResult.found ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  className={`${pixelMonoFont.className} text-[#ff0000] font-bold`}
                >
                  SPAM ALERT!
                </span>
                <span className={`${pixelMonoFont.className} text-[#ff8888]`}>
                  Token found in {searchResult.network} spam list
                </span>
              </div>
              <a
                href={
                  searchResult.networkId &&
                  getExplorerUrl(searchResult.networkId, searchTerm)
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs text-[#ff8888] hover:text-[#ff5555] flex items-center gap-1 transition-colors w-fit"
              >
                <ExternalLink className="h-3 w-3" />
                View on explorer
              </a>
            </div>
          ) : (
            <p className={`${pixelMonoFont.className} text-green-400`}>
              This token was not found in our spam lists. However, always do
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
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-[#ff0000]/10 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff0000]" />
          </div>
          <h3
            className={`${pixelFont.className} text-base sm:text-lg font-bold text-[#ff0000]`}
          >
            RECENT SPAM ALERTS
          </h3>
        </div>
        {renderSearchSection()}
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-t-2 border-b-2 border-[#ff0000] animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || recentSpamTokens.length === 0) {
    return (
      <div className="p-4 sm:p-6 backdrop-blur-lg bg-black/50 rounded-xl border border-[#ff0000]/30 shadow-[0_0_15px_rgba(255,0,0,0.2)] relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ff0000]/10 via-transparent to-transparent blur-3xl"></div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-[#ff0000]/10 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff0000]" />
          </div>
          <h3
            className={`${pixelFont.className} text-base sm:text-lg font-bold text-[#ff0000]`}
          >
            RECENT SPAM ALERTS
          </h3>
        </div>
        {renderSearchSection()}
        <div className="text-center py-4">
          <p className={`${pixelMonoFont.className} text-[#ff8888]`}>
            {error || "No recent spam tokens found"}
          </p>
          <button
            onClick={() => setShowRecentFromAll(!showRecentFromAll)}
            className="mt-3 px-3 py-1 rounded-md bg-[#ff0000]/10 text-[#ff8888] hover:bg-[#ff0000]/20 transition-colors text-sm"
          >
            {toggleModeLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 backdrop-blur-lg bg-black/50 rounded-xl border border-[#ff0000]/30 shadow-[0_0_15px_rgba(255,0,0,0.2)] relative animate-fade-in">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ff0000]/10 via-transparent to-transparent blur-3xl"></div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-[#ff0000]/10 flex items-center justify-center">
            {showRecentFromAll ? (
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff0000]" />
            ) : (
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff0000]" />
            )}
          </div>
          <h3
            className={`${pixelFont.className} text-base sm:text-lg font-bold text-[#ff0000]`}
          >
            {showRecentFromAll ? "MOST RECENT SPAM" : "RECENT SPAM ALERTS"}
          </h3>
        </div>
        <button
          onClick={() => setShowRecentFromAll(!showRecentFromAll)}
          className="px-2 py-1 text-xs rounded-md bg-[#ff0000]/10 text-[#ff8888] hover:bg-[#ff0000]/20 transition-colors"
        >
          {showRecentFromAll ? "Show by chain" : "Show most recent"}
        </button>
      </div>

      {renderSearchSection()}

      <p className={`${pixelMonoFont.className} text-sm text-[#ff8888] mb-3`}>
        {showRecentFromAll
          ? "These are the most recently identified spam tokens across all chains."
          : "These tokens have recently been flagged as spam. Be cautious if you encounter them."}
      </p>

      <div className="space-y-3">
        {recentSpamTokens.map((token, index) => (
          <div
            key={token.address + token.networkId}
            className="p-3 bg-black/70 border border-[#ff0000]/30 rounded-lg flex items-center gap-3 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-black/80 flex-shrink-0 border border-[#ff0000]/30 flex items-center justify-center">
              <span
                className={`${pixelMonoFont.className} text-sm font-semibold text-[#ff0000]`}
              >
                {token.symbol?.[0] ||
                  token.address.substring(2, 4).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4
                  className={`${pixelMonoFont.className} text-sm font-medium truncate text-[#ff5555]`}
                >
                  {token.name ||
                    `Unknown Token (${token.address.substring(
                      0,
                      6
                    )}...${token.address.substring(38)})`}
                </h4>
                {token.symbol && (
                  <span
                    className={`${pixelMonoFont.className} text-xs px-1.5 py-0.5 bg-black/80 rounded-full text-[#ff0000] border border-[#ff0000]/30`}
                  >
                    {token.symbol}
                  </span>
                )}
                {token.score && (
                  <span
                    className={`${pixelMonoFont.className} text-xs px-1.5 py-0.5 bg-black/80 rounded-full text-[#ff0000] border border-[#ff0000]/30`}
                  >
                    Score: {token.score}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`${pixelMonoFont.className} text-xs text-[#ff0000]/80`}
                >
                  {token.network}
                </span>
                <span
                  className={`${pixelMonoFont.className} text-xs text-[#ff8888] truncate`}
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
              className="inline-flex items-center justify-center p-2 rounded-full bg-black/80 text-[#ff0000] hover:text-[#ff5555] transition-colors border border-[#ff0000]/30"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentSpamTokens;
