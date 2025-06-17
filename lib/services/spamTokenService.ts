// Define types for Networks and Confidence
export enum Networks {
  ETH_MAINNET = "eth-mainnet",
  BSC_MAINNET = "bsc-mainnet",
  POLYGON_MAINNET = "polygon-mainnet",
  // Add other networks as needed
}

export enum Confidence {
  YES = "yes",
  MAYBE = "maybe",
}

// Skip dynamic imports for now - we'll use our defined enums
// and implement alternative functionality
import { YamlData } from "../types";
import { BASE_COVALENT_SPAM_LIST_GITHUB_URL } from "@/constants/constant";

const dataCache: Record<string, YamlData> = {};

/**
 * Loads YAML data from GitHub
 */
async function loadYaml(filePath: string, useCache = true): Promise<YamlData> {
  if (useCache && dataCache[filePath]) {
    return dataCache[filePath];
  }

  try {
    const response = await fetch(
      `${BASE_COVALENT_SPAM_LIST_GITHUB_URL}/${filePath}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch YAML file: ${response.statusText}`);
    }

    const content = await response.text();
    const data = parseYaml(content);

    if (useCache) {
      dataCache[filePath] = data;
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error loading ${filePath}: ${errorMessage}`);
  }
}

/**
 * Simple YAML parser for browser
 */
function parseYaml(content: string): YamlData {
  const result: YamlData = {};
  const lines = content.split("\n");

  let currentKey = "";
  let inArray = false;
  const arrayItems: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith("#") || !line.trim()) continue;

    if (line.includes(":") && !inArray) {
      const [key, value] = line.split(":").map((s) => s.trim());
      if (value) {
        result[key] = value;
      } else {
        currentKey = key;
        if (line.includes("SpamContracts")) {
          inArray = true;
        } else {
          result[currentKey] = {};
        }
      }
    } else if (inArray && line.trim().startsWith("-")) {
      arrayItems.push(line.trim().substring(2));
    }
  }

  if (inArray) {
    result[currentKey] = arrayItems;
  }

  return result;
}

/**
 * Clears the in-memory cache
 */
export function clearCache(): void {
  Object.keys(dataCache).forEach((key) => {
    delete dataCache[key];
  });
}

/**
 * Gets the ERC20 spam token list for a specific network and confidence level
 */
export async function getERC20List(
  network: Networks,
  confidence: Confidence,
  cache = true
): Promise<string[]> {
  const networkKey = network.replaceAll("-", "_");
  const key = `${networkKey}_token_spam_contracts_${confidence}`;

  if (network === Networks.BSC_MAINNET && confidence === Confidence.YES) {
    try {
      const part1 = await loadYaml(`erc20/${key}_1.yaml`, cache);
      const part2 = await loadYaml(`erc20/${key}_2.yaml`, cache);
      return [...(part1.SpamContracts || []), ...(part2.SpamContracts || [])];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load BSC spam lists: ${errorMessage}`);
    }
  }

  try {
    const data = await loadYaml(`erc20/${key}.yaml`, cache);
    return data.SpamContracts || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Spam list for ${network} with confidence ${confidence} not found: ${errorMessage}`
    );
  }
}

/**
 * Gets the NFT spam token list for a specific network
 */
export async function getNFTList(
  network: Networks,
  cache = true
): Promise<string[]> {
  const networkKey = network.replaceAll("-", "_");
  const key = `${networkKey}_nft_spam_contracts`;

  try {
    const data = await loadYaml(`nft/${key}.yaml`, cache);
    return data.SpamContracts || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`NFT spam list for ${network} not found: ${errorMessage}`);
  }
}

/**
 * Checks if a contract is in a spam list
 */
export function isContractSpam(address: string, spamList: string[]): boolean {
  const normalizedAddress = address.toLowerCase();
  return spamList.some((entry) => {
    const parts = entry.split("/");
    if (parts.length >= 2) {
      return parts?.[1]?.toLowerCase() === normalizedAddress;
    }
    return false;
  });
}

/**
 * Checks if an ERC20 token is spam
 */
export async function isERC20Spam(
  address: string,
  network: Networks,
  confidence = Confidence.YES,
  cache = true
): Promise<boolean> {
  const spamList = await getERC20List(network, confidence, cache);
  return isContractSpam(address, spamList);
}

/**
 * Checks if an NFT is spam
 */
export async function isNFTSpam(
  address: string,
  network: Networks,
  cache = true
): Promise<boolean> {
  const spamList = await getNFTList(network, cache);
  return isContractSpam(address, spamList);
}

/**
 * Gets the spam score for an entry
 */
export function getSpamScore(entry: string): string {
  return entry.split("/")[2];
}

// We've already exported Networks and Confidence above
