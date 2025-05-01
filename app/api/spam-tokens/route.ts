import { NextResponse } from "next/server";
import yaml from "js-yaml";

const networkMapping: Record<
  string,
  { id: string; name: string; yamlUrl: string }
> = {
  ETHEREUM_MAINNET: {
    id: "eth-mainnet",
    name: "Ethereum",
    yamlUrl:
      "https://raw.githubusercontent.com/covalenthq/goldrush-enhanced-spam-lists/main/src/lists/erc20/eth_mainnet_token_spam_contracts_yes.yaml",
  },
  BSC_MAINNET: {
    id: "bsc-mainnet",
    name: "BSC",
    yamlUrl:
      "https://raw.githubusercontent.com/covalenthq/goldrush-enhanced-spam-lists/main/src/lists/erc20/bsc_mainnet_token_spam_contracts_yes_1.yaml",
  },
  POLYGON_MAINNET: {
    id: "matic-mainnet",
    name: "Polygon",
    yamlUrl:
      "https://raw.githubusercontent.com/covalenthq/goldrush-enhanced-spam-lists/main/src/lists/erc20/pol_mainnet_token_spam_contracts_yes.yaml",
  },
  OPTIMISM_MAINNET: {
    id: "optimism-mainnet",
    name: "Optimism",
    yamlUrl:
      "https://raw.githubusercontent.com/covalenthq/goldrush-enhanced-spam-lists/main/src/lists/erc20/op_mainnet_token_spam_contracts_yes.yaml",
  },
  GNOSIS_MAINNET: {
    id: "gnosis-mainnet",
    name: "Gnosis",
    yamlUrl:
      "https://raw.githubusercontent.com/covalenthq/goldrush-enhanced-spam-lists/main/src/lists/erc20/gnosis_mainnet_token_spam_contracts_yes.yaml",
  },
  BASE_MAINNET: {
    id: "base-mainnet",
    name: "Base",
    yamlUrl:
      "https://raw.githubusercontent.com/covalenthq/goldrush-enhanced-spam-lists/main/src/lists/erc20/base_mainnet_token_spam_contracts_yes.yaml",
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

interface SpamListEntry {
  name?: string;
  symbol?: string;
  timestamp?: number;
  score?: number;
  address?: string;
  chain?: string;
}

type SpamToken = {
  address: string;
  networkId: string;
  network: string;
  name?: string;
  symbol?: string;
  timestamp?: number;
  score?: number;
};

const tokenCache: Record<string, SpamToken[]> = {};
const recentTokensCache: SpamToken[] = [];
const yamlCache: Record<string, string> = {};

const CACHE_EXPIRY_MS = 60 * 60 * 1000;
let lastCacheUpdate = 0;
let isCacheUpdating = false;
let cacheInitPromise: Promise<void> | null = null;

function getRandomTimestamp() {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  return oneDayAgo - Math.floor(Math.random() * (oneDayAgo - thirtyDaysAgo));
}

async function fetchWithCache(url: string): Promise<string> {
  if (yamlCache[url]) {
    return yamlCache[url];
  }

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 },
      cache: "force-cache",
      headers: {
        Accept: "application/vnd.github.v3.raw",
        "User-Agent": "ChainWatchdog",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const text = await response.text();
    yamlCache[url] = text;
    return text;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);

    // If in production and likely a CORS issue, try a proxy approach
    if (
      process.env.NODE_ENV === "production" &&
      url.includes("githubusercontent.com")
    ) {
      try {
        // Convert GitHub raw URL to API URL that might have different CORS policy
        const githubApiUrl = url
          .replace("raw.githubusercontent.com", "api.github.com/repos")
          .replace(/\/main\/(.+)$/, "/contents/$1");

        console.log(`Trying GitHub API fallback: ${githubApiUrl}`);

        const apiResponse = await fetch(githubApiUrl, {
          headers: {
            Accept: "application/vnd.github.v3.raw",
            "User-Agent": "ChainWatchdog",
          },
        });

        if (!apiResponse.ok) {
          throw new Error(
            `GitHub API fallback failed: ${apiResponse.statusText}`
          );
        }

        const content = await apiResponse.text();
        yamlCache[url] = content;
        return content;
      } catch (proxyError) {
        console.error(`GitHub API fallback failed for ${url}:`, proxyError);
        throw error; // Throw the original error if proxy fails
      }
    }

    throw error;
  }
}

async function parseSpamList(
  networkKey: string,
  yamlUrl: string,
  limit = 100
): Promise<SpamListEntry[]> {
  try {
    const yamlText = await fetchWithCache(yamlUrl);
    const parsed = yaml.load(yamlText) as { SpamContracts?: string[] };

    const tokenEntries: SpamListEntry[] = [];

    if (parsed && Array.isArray(parsed.SpamContracts)) {
      const entries = parsed.SpamContracts.slice(0, limit);

      entries.forEach((entry) => {
        const parts = entry.split("/");
        if (parts.length === 3) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [chainId, address, scoreStr] = parts;
          const score = parseInt(scoreStr, 10);

          tokenEntries.push({
            address: address.toLowerCase(),
            name: `Spam Token (${address.substring(0, 6)}...)`,
            symbol: "SPAM",
            timestamp: getRandomTimestamp(),
            score: score,
            chain: networkKey,
          });
        }
      });
    }

    return tokenEntries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch (error) {
    console.error(`Error parsing spam list from ${yamlUrl}:`, error);
    return [];
  }
}

async function initializeCache() {
  if (cacheInitPromise) {
    return cacheInitPromise;
  }

  cacheInitPromise = updateAllCaches();
  return cacheInitPromise;
}

async function updateAllCaches() {
  if (isCacheUpdating) return;

  const now = Date.now();
  if (
    now - lastCacheUpdate < CACHE_EXPIRY_MS &&
    Object.keys(tokenCache).length > 0
  ) {
    return;
  }

  try {
    isCacheUpdating = true;
    const networkEntries = Object.entries(networkMapping);

    await Promise.all(
      networkEntries.map(async ([, network]) => {
        try {
          await fetchWithCache(network.yamlUrl);
        } catch (err) {
          console.error(`Error pre-fetching YAML for ${network.name}:`, err);
        }
      })
    );

    await Promise.all(
      networkEntries.map(async ([networkKey, network]) => {
        try {
          const tokenEntries = await parseSpamList(
            networkKey,
            network.yamlUrl,
            50
          );

          const tokens: SpamToken[] = tokenEntries.map((entry) => ({
            address: entry.address || "",
            networkId: network.id,
            network: network.name,
            name: entry.name,
            symbol: entry.symbol,
            timestamp: entry.timestamp,
            score: entry.score,
          }));

          tokenCache[networkKey] = tokens;
        } catch (err) {
          console.error(`Error updating cache for ${network.name}:`, err);
        }
      })
    );

    let allTokens: SpamToken[] = [];
    Object.values(tokenCache).forEach((tokens) => {
      allTokens = allTokens.concat(tokens);
    });

    recentTokensCache.length = 0;
    recentTokensCache.push(
      ...allTokens
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 20)
    );

    lastCacheUpdate = now;
  } catch (error) {
    console.error("Error updating cache:", error);
  } finally {
    isCacheUpdating = false;
  }
}

initializeCache().catch(console.error);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get("chainId");
    const recentOnly = searchParams.get("recent") === "true";

    if (Object.keys(tokenCache).length === 0) {
      try {
        await initializeCache();
      } catch (error) {
        console.error("Error initializing cache:", error);
      }
    }

    if (Date.now() - lastCacheUpdate > CACHE_EXPIRY_MS) {
      updateAllCaches().catch(console.error);
    }

    if (recentOnly) {
      if (recentTokensCache.length > 0) {
        return NextResponse.json(
          {
            tokens: recentTokensCache.slice(0, 5),
            source: "cache",
          },
          {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          }
        );
      }

      let allRecentTokens: SpamToken[] = [];
      Object.values(tokenCache).forEach((tokens) => {
        allRecentTokens = allRecentTokens.concat(tokens);
      });

      const sortedRecentTokens = allRecentTokens
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 5);

      return NextResponse.json(
        {
          tokens: sortedRecentTokens,
          source: "generated",
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }

    if (chainId && chainToNetwork[chainId]) {
      const networkKey = chainToNetwork[chainId].networkKey;

      if (tokenCache[networkKey] && tokenCache[networkKey].length > 0) {
        return NextResponse.json(
          {
            tokens: tokenCache[networkKey].slice(0, 5),
            source: "cache",
          },
          {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          }
        );
      }

      const network = networkMapping[networkKey];
      if (!network) {
        return NextResponse.json(
          {
            tokens: [],
            error: "Network not supported",
          },
          {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          }
        );
      }

      try {
        const tokenEntries = await parseSpamList(
          networkKey,
          network.yamlUrl,
          30
        );

        const tokens = tokenEntries.map((entry) => ({
          address: entry.address || "",
          networkId: network.id,
          network: network.name,
          name: entry.name,
          symbol: entry.symbol,
          timestamp: entry.timestamp,
          score: entry.score,
        }));

        tokenCache[networkKey] = tokens;

        return NextResponse.json(
          {
            tokens: tokens.slice(0, 5),
            source: "fresh",
          },
          {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          }
        );
      } catch (err) {
        console.error(`Error processing network ${network.name}:`, err);
        return NextResponse.json(
          {
            tokens: [],
            error: "Failed to fetch network data",
          },
          {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          }
        );
      }
    }

    const defaultNetworks = [
      "ETHEREUM_MAINNET",
      "BSC_MAINNET",
      "POLYGON_MAINNET",
    ];
    const allSpamTokens: SpamToken[] = [];

    for (const networkKey of defaultNetworks) {
      if (tokenCache[networkKey] && tokenCache[networkKey].length > 0) {
        allSpamTokens.push(...tokenCache[networkKey].slice(0, 2));
      }
    }

    if (allSpamTokens.length >= 5) {
      const sortedTokens = allSpamTokens
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 5);

      return NextResponse.json(
        {
          tokens: sortedTokens,
          source: "cache",
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }

    const fetchPromises = defaultNetworks.map(async (networkKey) => {
      const network = networkMapping[networkKey];
      if (!network) return;

      try {
        if (!tokenCache[networkKey] || tokenCache[networkKey].length === 0) {
          const tokenEntries = await parseSpamList(
            networkKey,
            network.yamlUrl,
            10
          );

          const tokens = tokenEntries.map((entry) => ({
            address: entry.address || "",
            networkId: network.id,
            network: network.name,
            name: entry.name,
            symbol: entry.symbol,
            timestamp: entry.timestamp,
            score: entry.score,
          }));

          tokenCache[networkKey] = tokens;
          return tokens.slice(0, 2);
        } else {
          return tokenCache[networkKey].slice(0, 2);
        }
      } catch (err) {
        console.error(`Error processing spam list for ${network.name}:`, err);
        return [];
      }
    });

    const tokenArrays = await Promise.all(fetchPromises);
    const freshTokens: SpamToken[] = tokenArrays
      .flat()
      .filter(Boolean) as SpamToken[];
    allSpamTokens.push(...freshTokens);

    const sortedTokens = allSpamTokens
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5);

    return NextResponse.json(
      {
        tokens: sortedTokens,
        source: "mixed",
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching spam tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch spam tokens", tokens: [] },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}

// Add OPTIONS handler for preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
