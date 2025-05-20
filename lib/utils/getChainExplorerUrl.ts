export const getChainExplorerUrl = (
  chainId: string,
  address: string
): string => {
  switch (chainId) {
    case "1":
      return `https://etherscan.io/address/${address}`;
    case "56":
      return `https://bscscan.com/address/${address}`;
    case "137":
      return `https://polygonscan.com/address/${address}`;
    case "10":
      return `https://optimistic.etherscan.io/address/${address}`;
    case "100":
      return `https://gnosisscan.io/address/${address}`;
    case "8453":
      return `https://basescan.org/address/${address}`;
    case "43114":
      return `https://snowtrace.io/address/${address}`;
    case "42161":
      return `https://arbiscan.io/address/${address}`;
    default:
      return `https://etherscan.io/address/${address}`;
  }
};
