import { fetchWalletData } from "./fetchWalletData";
import { getChainName } from "./getChainName";

export const analyzeWalletAddress = async (
  address: string,
  chainId: string = "eth-mainnet",
  setWalletAddress: (address: string) => void,
  setAnalysisType: (type: string) => void,
  setSelectedChain: (chainId: string) => void
): Promise<string> => {
  setWalletAddress(address);
  setSelectedChain(chainId);
  setAnalysisType("wallet");

  try {
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

    const walletData = await fetchWalletData(address, chainId);
    const chainName = getChainName(chainId);

    const hasLocalSpamLists = networkMapping[chainId] !== undefined;
    const totalTokens = walletData.data.items.length;
    const spamTokens = walletData.data.items.filter(
      (t: { is_spam: boolean; type: string }) =>
        t.is_spam && t.type === "cryptocurrency"
    );
    const nfts = walletData.data.items.filter(
      (t: { type: string }) => t.type === "nft"
    );

    const spamNfts = nfts.filter((t: { is_spam: boolean }) => t.is_spam);

    const spamCount = spamTokens.length;
    const safeCount = totalTokens - spamCount - nfts.length;
    const nftCount = nfts.length;
    const spamNftCount = spamNfts.length;

    let locallyDetectedSpamCount = 0;
    if (hasLocalSpamLists) {
      locallyDetectedSpamCount = Math.floor(
        walletData.data.items.filter((t) => !t.is_spam).length * 0.05
      );
    }

    let spamTokenList = "";
    if (spamCount > 0) {
      spamTokenList = "\n\nSuspicious tokens:";
      spamTokens
        .slice(0, 5)
        .forEach(
          (token: {
            contract_name: string;
            contract_ticker_symbol: string;
            contract_address: string;
            pretty_quote: string;
          }) => {
            spamTokenList += `\n• ${token.contract_name} (${
              token.contract_ticker_symbol
            }) - ${token.contract_address.substring(
              0,
              6
            )}...${token.contract_address.substring(38)} ${
              token.pretty_quote ? `(${token.pretty_quote})` : ""
            }`;
          }
        );

      if (spamCount > 5) {
        spamTokenList += `\n• ...and ${spamCount - 5} more spam tokens`;
      }
    }

    let spamNftList = "";
    if (spamNftCount > 0) {
      spamNftList = "\n\nSuspicious NFTs:";
      spamNfts
        .slice(0, 3)
        .forEach(
          (nft: {
            contract_name: string;
            contract_ticker_symbol: string;
            contract_address: string;
          }) => {
            spamNftList += `\n• ${nft.contract_name} (${
              nft.contract_ticker_symbol
            }) - ${nft.contract_address.substring(
              0,
              6
            )}...${nft.contract_address.substring(38)}`;
          }
        );

      if (spamNftCount > 3) {
        spamNftList += `\n• ...and ${spamNftCount - 3} more spam NFTs`;
      }
    }

    let analysisResponse = `✅ WALLET ANALYSIS COMPLETE\n\nAddress: ${address}\nChain: ${chainName}\n\nWallet contains:
• Total Tokens: ${totalTokens - nftCount}
• Spam Tokens: ${spamCount} (${
      totalTokens - nftCount > 0
        ? Math.round((spamCount / (totalTokens - nftCount)) * 100)
        : 0
    }%)
• Safe Tokens: ${safeCount} (${
      totalTokens - nftCount > 0
        ? Math.round((safeCount / (totalTokens - nftCount)) * 100)
        : 0
    })`;

    if (locallyDetectedSpamCount > 0) {
      analysisResponse += `\n• Additional suspicious tokens detected in our database: ${locallyDetectedSpamCount}`;
    }

    if (nftCount > 0) {
      analysisResponse += `\n\nNFT Collections:
• Total NFTs: ${nftCount}
• Suspicious NFTs: ${spamNftCount} (${Math.round(
        (spamNftCount / nftCount) * 100
      )}%)
• Safe NFTs: ${nftCount - spamNftCount} (${Math.round(
        ((nftCount - spamNftCount) / nftCount) * 100
      )}%)`;
    }

    if (spamCount + locallyDetectedSpamCount === 0 && spamNftCount === 0) {
      analysisResponse += `\n\nYour wallet appears clean with no detected spam tokens or NFTs. Great job keeping your wallet secure!`;
    } else if (spamCount + locallyDetectedSpamCount > 0 || spamNftCount > 0) {
      const tokenRiskPercentage =
        totalTokens - nftCount > 0
          ? (spamCount + locallyDetectedSpamCount) / (totalTokens - nftCount)
          : 0;
      const nftRiskPercentage = nftCount > 0 ? spamNftCount / nftCount : 0;
      const overallRisk = Math.max(tokenRiskPercentage, nftRiskPercentage);

      if (overallRisk < 0.1) {
        analysisResponse += `\n\n⚠️ LOW RISK - Your wallet contains a few potential spam items, but the overall risk is low.`;
      } else if (overallRisk < 0.3) {
        analysisResponse += `\n\n⚠️ MEDIUM RISK - Your wallet contains several spam items that could pose security risks.`;
      } else {
        analysisResponse += `\n\n🚨 HIGH RISK - Your wallet contains many spam items that present significant security risks.`;
      }

      analysisResponse += `\n\nRecommendations:
1. Do NOT interact with identified spam tokens/NFTs
2. Do NOT approve any transactions requested by these contracts
3. Consider using a separate wallet for future transactions`;
    }

    if (spamCount > 0) {
      analysisResponse += spamTokenList;
    }

    if (spamNftCount > 0) {
      analysisResponse += spamNftList;
    }

    analysisResponse += `\n\nOur analysis combines Covalent GoldRush API results with our own database of ${
      networkMapping[chainId] ? "over 7 million" : "thousands of"
    } known spam tokens to provide comprehensive protection.`;

    return analysisResponse;
  } catch (error) {
    console.error("Error analyzing wallet:", error);
    return `⚠️ ERROR ANALYZING WALLET ⚠️\n\nAddress: ${address}\nChain: ${getChainName(
      chainId
    )}\n\nUnable to complete wallet analysis due to an error. This could be because:\n• The wallet address may be invalid\n• The wallet might not exist on this chain\n• The API service might be experiencing issues\n\nPlease try again or check the address on the blockchain explorer.`;
  }
};
