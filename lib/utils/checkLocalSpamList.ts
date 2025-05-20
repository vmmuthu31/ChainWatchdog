import * as yaml from "js-yaml";

export const checkLocalSpamList = async (
  address: string,
  chainId: string
): Promise<boolean> => {
  try {
    const normalizedAddress = address.toLowerCase();

    const networkMapping: Record<
      string,
      { tokensPath: string; nftPath: string }
    > = {
      "eth-mainnet": {
        tokensPath:
          "/spam-lists/tokens/eth_mainnet_token_spam_contracts_yes.yaml",
        nftPath: "/spam-lists/nft/eth_mainnet_nft_spam_contracts.yaml",
      },
      "bsc-mainnet": {
        tokensPath:
          "/spam-lists/tokens/bsc_mainnet_token_spam_contracts_yes_1.yaml",
        nftPath: "/spam-lists/nft/bsc_mainnet_nft_spam_contracts.yaml",
      },
      "matic-mainnet": {
        tokensPath:
          "/spam-lists/tokens/pol_mainnet_token_spam_contracts_yes.yaml",
        nftPath: "/spam-lists/nft/pol_mainnet_nft_spam_contracts.yaml",
      },
      "optimism-mainnet": {
        tokensPath:
          "/spam-lists/tokens/op_mainnet_token_spam_contracts_yes.yaml",
        nftPath: "/spam-lists/nft/op_mainnet_nft_spam_contracts.yaml",
      },
      "gnosis-mainnet": {
        tokensPath:
          "/spam-lists/tokens/gnosis_mainnet_token_spam_contracts_yes.yaml",
        nftPath: "/spam-lists/nft/gnosis_mainnet_nft_spam_contracts.yaml",
      },
      "base-mainnet": {
        tokensPath:
          "/spam-lists/tokens/base_mainnet_token_spam_contracts_yes.yaml",
        nftPath: "/spam-lists/nft/base_mainnet_nft_spam_contracts.yaml",
      },
    };

    if (!networkMapping[chainId]) {
      console.error(`No spam list mapping found for chain ${chainId}`);
      return false;
    }

    try {
      const tokenResponse = await fetch(networkMapping[chainId].tokensPath);
      const nftResponse = await fetch(networkMapping[chainId].nftPath);

      if (!tokenResponse.ok || !nftResponse.ok) {
        console.error("Error loading YAML files");
        return false;
      }

      const tokenYaml = await tokenResponse.text();
      const nftYaml = await nftResponse.text();
      const tokenList = yaml.load(tokenYaml) as string[];
      const nftList = yaml.load(nftYaml) as string[];

      const isSpamToken = tokenList.some(
        (addr) => addr.toLowerCase() === normalizedAddress
      );
      const isSpamNft = nftList.some(
        (addr) => addr.toLowerCase() === normalizedAddress
      );

      return isSpamToken || isSpamNft;
    } catch (yamlError) {
      console.error("Error parsing YAML files:", yamlError);
      return false;
    }
  } catch (error) {
    console.error("Error checking local spam list:", error);
    return false;
  }
};
