export const chainsToCheck = [
  {
    id: "1",
    name: "Ethereum",
    explorer: "https://api.etherscan.io",
    apikey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
  },
  {
    id: "56",
    name: "BSC",
    explorer: "https://api.bscscan.com",
    apikey: process.env.NEXT_PUBLIC_BSCSCAN_API_KEY,
  },
  {
    id: "137",
    name: "Polygon",
    explorer: "https://api.polygonscan.com",
    apikey: process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY,
  },
  {
    id: "43114",
    name: "Avalanche",
    explorer: "https://glacier-api.avax.network",
    apikey: process.env.NEXT_PUBLIC_AVALANCHE_API_KEY,
  },
  {
    id: "42161",
    name: "Arbitrum",
    explorer: "https://api.arbiscan.io",
    apikey: process.env.NEXT_PUBLIC_ARBITRUM_API_KEY,
  },
  {
    id: "10",
    name: "Optimism",
    explorer: "https://api.optimistic.etherscan.io",
    apikey: process.env.NEXT_PUBLIC_OPTIMISM_API_KEY,
  },
];
