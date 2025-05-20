export const getExplorerUrl = (chainId: string) => {
  switch (chainId) {
    case "1":
      return "https://etherscan.io";
    case "56":
      return "https://bscscan.com";
    case "137":
      return "https://polygonscan.com";
    case "43114":
      return "https://snowtrace.io";
  }
};
