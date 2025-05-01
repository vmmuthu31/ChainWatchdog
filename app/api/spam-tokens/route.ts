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
  ARBITRUM_MAINNET: {
    id: "arbitrum-mainnet",
    name: "Arbitrum",
    yamlUrl:
      "https://raw.githubusercontent.com/covalenthq/goldrush-enhanced-spam-lists/main/src/lists/erc20/arbitrum_mainnet_token_spam_contracts_yes.yaml",
  },
  OPTIMISM_MAINNET: {
    id: "optimism-mainnet",
    name: "Optimism",
    yamlUrl:
      "https://raw.githubusercontent.com/covalenthq/goldrush-enhanced-spam-lists/main/src/lists/erc20/op_mainnet_token_spam_contracts_yes.yaml",
  },
};

const chainToNetwork: Record<string, { networkKey: string }> = {
  "eth-mainnet": { networkKey: "ETHEREUM_MAINNET" },
  "bsc-mainnet": { networkKey: "BSC_MAINNET" },
  "matic-mainnet": { networkKey: "POLYGON_MAINNET" },
  "arbitrum-mainnet": { networkKey: "ARBITRUM_MAINNET" },
  "optimism-mainnet": { networkKey: "OPTIMISM_MAINNET" },
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

const recentTokensCache: Record<string, SpamToken[]> = {};
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
let lastCacheUpdate = 0;

function getRandomTimestamp() {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  return thirtyDaysAgo + Math.floor(Math.random() * (now - thirtyDaysAgo));
}

async function fetchSpamList(
  networkKey: string,
  yamlUrl: string,
  limit = 100
): Promise<SpamListEntry[]> {
  try {
    const response = await fetch(yamlUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch spam list: ${response.statusText}`);
    }

    const yamlText = await response.text();
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
    console.error(`Error fetching spam list from ${yamlUrl}:`, error);
    return [];
  }
}

async function updateRecentTokensCache() {
  const now = Date.now();

  if (
    now - lastCacheUpdate < CACHE_EXPIRY_MS &&
    Object.keys(recentTokensCache).length > 0
  ) {
    return;
  }

  const networkEntries = Object.entries(networkMapping);

  Object.keys(recentTokensCache).forEach((key) => {
    delete recentTokensCache[key];
  });

  await Promise.all(
    networkEntries.map(async ([networkKey, network]) => {
      try {
        const tokenEntries = await fetchSpamList(
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

        recentTokensCache[networkKey] = tokens;
      } catch (err) {
        console.error(`Error updating cache for ${network.name}:`, err);
      }
    })
  );

  lastCacheUpdate = now;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get("chainId");
    const recentOnly = searchParams.get("recent") === "true";

    if (recentOnly) {
      await updateRecentTokensCache();

      let allRecentTokens: SpamToken[] = [];

      Object.values(recentTokensCache).forEach((tokens) => {
        allRecentTokens = allRecentTokens.concat(tokens);
      });

      const sortedRecentTokens = allRecentTokens
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 5);

      return NextResponse.json({ tokens: sortedRecentTokens });
    }

    let networksToFetch: string[] = [
      "ETHEREUM_MAINNET",
      "BSC_MAINNET",
      "POLYGON_MAINNET",
    ];

    if (chainId && chainToNetwork[chainId]) {
      networksToFetch = [chainToNetwork[chainId].networkKey];
    }

    const allSpamTokens: SpamToken[] = [];

    await Promise.all(
      networksToFetch.map(async (networkKey) => {
        const network = networkMapping[networkKey];
        if (!network) return;

        try {
          const tokenEntries = await fetchSpamList(
            networkKey,
            network.yamlUrl,
            30
          );

          const tokensFromNetwork = tokenEntries.map((entry) => ({
            address: entry.address || "",
            networkId: network.id,
            network: network.name,
            name: entry.name,
            symbol: entry.symbol,
            timestamp: entry.timestamp,
            score: entry.score,
          }));

          allSpamTokens.push(...tokensFromNetwork.slice(0, 10));
        } catch (err) {
          console.error(`Error processing spam list for ${network.name}:`, err);
        }
      })
    );

    const sortedTokens = allSpamTokens
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5);

    return NextResponse.json({ tokens: sortedTokens });
  } catch (error) {
    console.error("Error fetching spam tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch spam tokens" },
      { status: 500 }
    );
  }
}
