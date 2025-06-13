export const getExplorerUrl = (chainId: string, address?: string) => {
  let baseUrl = "";

  switch (chainId) {
    case "1":
      baseUrl = "https://etherscan.io";
      break;
    case "56":
      baseUrl = "https://bscscan.com";
      break;
    case "137":
      baseUrl = "https://polygonscan.com";
      break;
    case "43114":
      baseUrl = "https://snowtrace.io";
      break;
    case "10":
      baseUrl = "https://optimistic.etherscan.io";
      break;
    case "8453":
      baseUrl = "https://basescan.org";
      break;
    case "100":
      baseUrl = "https://gnosisscan.io";
      break;
    case "solana-mainnet":
      if (address) {
        return `https://explorer.solana.com/address/${address}`;
      }
      return "https://explorer.solana.com";
    default:
      return "https://etherscan.io";
  }

  if (address) {
    return `${baseUrl}/address/${address}`;
  }

  return baseUrl;
};
