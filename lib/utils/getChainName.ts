export const getChainName = (chainId: string) => {
  switch (chainId) {
    case "1":
      return "Ethereum";
    case "56":
      return "Binance Smart Chain";
    case "137":
      return "Polygon";
    case "43114":
      return "Avalanche";
    case "42161":
      return "Arbitrum";
    case "10":
      return "Optimism";
    default:
      return "Unknown Chain";
  }
};
