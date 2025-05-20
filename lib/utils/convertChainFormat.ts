export const convertChainFormat = (
  chainIdOrFormat: string,
  targetFormat: "goldrush" | "honeypot"
): string => {
  if (targetFormat === "goldrush" && chainIdOrFormat.includes("-")) {
    return chainIdOrFormat;
  }
  if (targetFormat === "honeypot" && !chainIdOrFormat.includes("-")) {
    return chainIdOrFormat;
  }

  if (targetFormat === "goldrush") {
    switch (chainIdOrFormat) {
      case "1":
        return "eth-mainnet";
      case "56":
        return "bsc-mainnet";
      case "137":
        return "matic-mainnet";
      case "10":
        return "optimism-mainnet";
      case "100":
        return "gnosis-mainnet";
      case "8453":
        return "base-mainnet";
      default:
        return "eth-mainnet";
    }
  }

  if (targetFormat === "honeypot") {
    if (chainIdOrFormat === "eth-mainnet") return "1";
    if (chainIdOrFormat === "bsc-mainnet") return "56";
    if (chainIdOrFormat === "matic-mainnet") return "137";
    if (chainIdOrFormat === "optimism-mainnet") return "10";
    if (chainIdOrFormat === "gnosis-mainnet") return "100";
    if (chainIdOrFormat === "base-mainnet") return "8453";
    return "1";
  }

  return chainIdOrFormat;
};
