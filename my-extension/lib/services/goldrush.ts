/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { GoldRushClient } from "@covalenthq/client-sdk";
import type { Chain } from "@covalenthq/client-sdk";
import { ChainInfo, GoldRushResponse } from "../types";

export const supportedChains: ChainInfo[] = [
  {
    id: "eth-mainnet",
    name: "Ethereum",
    explorer: "https://etherscan.io",
    type: "Mainnet",
    logoUrl: "https://www.datocms-assets.com/86369/1669653891-eth.svg",
    category: "EVM",
  },
  {
    id: "matic-mainnet",
    name: "Polygon",
    explorer: "https://polygonscan.com",
    type: "Mainnet",
    logoUrl: "https://www.datocms-assets.com/86369/1669653893-matic.svg",
    category: "EVM",
  },
  {
    id: "bsc-mainnet",
    name: "BNB Smart Chain",
    explorer: "https://bscscan.com",
    type: "Mainnet",
    logoUrl: "https://www.datocms-assets.com/86369/1669653889-bnb.svg",
    category: "EVM",
  },
  {
    id: "avalanche-mainnet",
    name: "Avalanche C-Chain",
    explorer: "https://snowtrace.io",
    type: "Mainnet",
    logoUrl: "https://www.datocms-assets.com/86369/1669653888-avax.svg",
    category: "EVM",
  },
  {
    id: "arbitrum-mainnet",
    name: "Arbitrum",
    explorer: "https://arbiscan.io",
    type: "Mainnet",
    logoUrl: "https://www.datocms-assets.com/86369/1674587647-arb1.svg",
    category: "EVM",
  },
];

export const getExplorerUrl = (chainId: string, address: string) => {
  const chain = supportedChains.find((c) => c.id === chainId);
  if (!chain) return `https://etherscan.io/address/${address}`;
  return `${chain.explorer}/address/${address}`;
};

const getChainFormatted = (chainId: string): Chain => {
  switch (chainId) {
    case "eth-mainnet":
      return "eth-mainnet";
    case "matic-mainnet":
      return "matic-mainnet";
    case "bsc-mainnet":
      return "bsc-mainnet";
    case "avalanche-mainnet":
      return "avalanche-mainnet";
    case "arbitrum-mainnet":
      return "arbitrum-mainnet";
    default:
      return "eth-mainnet";
  }
};

const fetchGoldRushData = async (
  address: string,
  chainId: string = "eth-mainnet"
): Promise<GoldRushResponse> => {
  try {
    const chain = getChainFormatted(chainId);
    let apiKey = process.env.NEXT_PUBLIC_GOLDRUSH_API_KEY || "";

    if (typeof window !== "undefined" && "chrome" in window) {
      try {
        const chromeAPI = (window as any).chrome;
        if (chromeAPI?.storage?.local?.get) {
          const result = await new Promise<{ covalentApiKey?: string }>(
            (resolve) => {
              chromeAPI.storage.local.get("covalentApiKey", (data: any) => {
                resolve(data);
              });
            }
          );

          if (result && result.covalentApiKey) {
            apiKey = result.covalentApiKey;
          }
        }
      } catch (err) {
        console.error("Error accessing chrome storage:", err);
      }
    }

    const client = new GoldRushClient(apiKey);

    const response =
      await client.BalanceService.getTokenBalancesForWalletAddress(
        chain,
        address,
        { nft: false }
      );

    const processedResponse: GoldRushResponse = {
      data: {
        address: address,
        updated_at: new Date().toISOString(),
        items:
          response.data?.items?.map((item) => ({
            contract_decimals: item.contract_decimals ?? 0,
            contract_name: item.contract_name ?? "",
            contract_ticker_symbol: item.contract_ticker_symbol ?? "",
            contract_address: item.contract_address ?? "",
            logo_url: item.logo_url ?? "",
            balance:
              item.balance !== undefined && item.balance !== null
                ? item.balance.toString()
                : "0",
            quote: item.quote ?? 0,
            pretty_quote: item.quote_rate
              ? `$${(item.quote || 0).toFixed(2)}`
              : "$0.00",
            is_spam: item.is_spam ?? false,
            spamScore: item.is_spam ?? false ? "High" : "Low",
          })) ?? [],
        pagination: {
          has_more: false,
          page_number: 0,
          page_size: 0,
          total_count: 0,
        },
      },
    };

    return processedResponse;
  } catch (error) {
    console.error("Error in GoldRush Service:", error);
    throw error;
  }
};

export default fetchGoldRushData;
