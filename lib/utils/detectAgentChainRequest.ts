export const detectAgentChainRequest = (text: string): string | null => {
  const lowercaseText = text.toLowerCase();

  if (lowercaseText.includes("ethereum") || lowercaseText.includes(" eth ")) {
    return "eth-mainnet";
  } else if (
    lowercaseText.includes("binance") ||
    lowercaseText.includes("bsc") ||
    lowercaseText.includes("bnb chain")
  ) {
    return "bsc-mainnet";
  } else if (
    lowercaseText.includes("polygon") ||
    lowercaseText.includes(" matic ")
  ) {
    return "matic-mainnet";
  } else if (
    lowercaseText.includes("optimism") ||
    lowercaseText.includes(" op ")
  ) {
    return "optimism-mainnet";
  } else if (lowercaseText.includes("base")) {
    return "base-mainnet";
  } else if (
    lowercaseText.includes("gnosis") ||
    lowercaseText.includes("xdai")
  ) {
    return "gnosis-mainnet";
  } else if (
    lowercaseText.includes("avalanche") ||
    lowercaseText.includes(" avax ")
  ) {
    return "avalanche-mainnet";
  } else if (lowercaseText.includes("arbitrum")) {
    return "arbitrum-mainnet";
  }

  if (
    lowercaseText.includes(" chain id 1") ||
    lowercaseText.includes(" chain 1")
  ) {
    return "eth-mainnet";
  } else if (
    lowercaseText.includes(" chain id 56") ||
    lowercaseText.includes(" chain 56")
  ) {
    return "bsc-mainnet";
  } else if (
    lowercaseText.includes(" chain id 137") ||
    lowercaseText.includes(" chain 137")
  ) {
    return "matic-mainnet";
  } else if (
    lowercaseText.includes(" chain id 10") ||
    lowercaseText.includes(" chain 10")
  ) {
    return "optimism-mainnet";
  } else if (
    lowercaseText.includes(" chain id 8453") ||
    lowercaseText.includes(" chain 8453")
  ) {
    return "base-mainnet";
  } else if (
    lowercaseText.includes(" chain id 100") ||
    lowercaseText.includes(" chain 100")
  ) {
    return "gnosis-mainnet";
  }

  return null;
};
