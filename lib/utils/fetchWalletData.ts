import GoldRushServices from "../services/goldrush";

export const fetchWalletData = async (
  address: string,
  chainId: string = "eth-mainnet"
) => {
  try {
    const result = await GoldRushServices(address, chainId);
    return result;
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    throw error;
  }
};
