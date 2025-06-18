import { getExplorerUrl } from "../../utils/getExplorerUrl";
import { InlineKeyboardButton } from "node-telegram-bot-api";

/**
 * Get an explorer URL for a given chain and address, formatted for Telegram
 *
 * @param chainId Chain ID like "eth-mainnet", "bsc-mainnet", etc.
 * @param address Contract or wallet address
 * @param isContract Whether the address is a contract (for token page) or a wallet
 * @returns Formatted string with explorer link for markdown
 */
export function getExplorerLinkForTelegram(
  chainId: string,
  address: string,
  isContract: boolean = true
): string {
  const normalizedChainId = normalizeChainId(chainId);
  const internalChainId = convertChainIdFormat(normalizedChainId);

  let explorerUrl = getExplorerUrl(internalChainId, address);

  if (
    isContract &&
    normalizedChainId !== "solana-mainnet" &&
    !explorerUrl.includes("/token/")
  ) {
    explorerUrl = explorerUrl.replace("/address/", "/token/");
  }

  const chainName = getChainName(normalizedChainId);
  return `[View on ${chainName} Explorer](${explorerUrl})`;
}

/**
 * Get an explorer button for Telegram inline keyboard
 *
 * @param chainId Chain ID like "eth-mainnet", "bsc-mainnet", etc. or numeric IDs like "1", "56", "8453"
 * @param address Contract or wallet address
 * @param isContract Whether the address is a contract (for token page) or a wallet
 * @returns Telegram inline keyboard markup with explorer button
 */
export function getExplorerButtonForTelegram(
  chainId: string,
  address: string,
  isContract: boolean = true
): { inline_keyboard: InlineKeyboardButton[][] } {
  const normalizedChainId = normalizeChainId(chainId);

  const internalChainId = convertChainIdFormat(normalizedChainId);

  let explorerUrl = getExplorerUrl(internalChainId, address);

  if (
    isContract &&
    normalizedChainId !== "solana-mainnet" &&
    !explorerUrl.includes("/token/")
  ) {
    explorerUrl = explorerUrl.replace("/address/", "/token/");
  }

  const chainName = getChainName(normalizedChainId);

  return {
    inline_keyboard: [[{ text: `📝 ${chainName}`, url: explorerUrl }]],
  };
}

/**
 * Get a human-readable chain name
 */
function getChainName(chainId: string): string {
  switch (chainId) {
    case "eth-mainnet":
      return "Ethereum";
    case "bsc-mainnet":
      return "BscScan";
    case "matic-mainnet":
      return "Polygon";
    case "solana-mainnet":
      return "Solana";
    case "base-mainnet":
      return "Base";
    case "optimism-mainnet":
      return "Optimism";
    case "arbitrum-mainnet":
      return "Arbitrum";
    case "avalanche-mainnet":
      return "Avalanche";
    case "fantom-mainnet":
      return "Fantom";
    default:
      return "Block";
  }
}

/**
 * Convert from our internal chain ID format to the format expected by explorer APIs
 */
function convertChainIdFormat(chainId: string): string {
  const chainMapping: Record<string, string> = {
    "eth-mainnet": "1",
    "bsc-mainnet": "56",
    "matic-mainnet": "137",
    "optimism-mainnet": "10",
    "base-mainnet": "8453",
    "arbitrum-mainnet": "42161",
    "avalanche-mainnet": "43114",
    "fantom-mainnet": "250",
  };

  return chainMapping[chainId] || chainId;
}

/**
 * Normalize chain ID to our internal format
 * Converts numeric chain IDs like "1", "56", "8453" to string format like "eth-mainnet", "bsc-mainnet", "base-mainnet"
 */
function normalizeChainId(chainId: string): string {
  if (chainId.includes("-mainnet") || chainId === "solana-mainnet") {
    return chainId;
  }

  const reverseChainMapping: Record<string, string> = {
    "1": "eth-mainnet",
    "56": "bsc-mainnet",
    "137": "matic-mainnet",
    "10": "optimism-mainnet",
    "8453": "base-mainnet",
    "42161": "arbitrum-mainnet",
    "43114": "avalanche-mainnet",
    "250": "fantom-mainnet",
  };

  return reverseChainMapping[chainId] || chainId;
}
