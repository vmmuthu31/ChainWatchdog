import { checkLocalSpamList } from "./checkLocalSpamList";
import { convertChainFormat } from "./convertChainFormat";
import { fetchWalletData } from "./fetchWalletData";
import { getChainName } from "./getChainName";

export const getTokenBalances = async (
  address: string,
  chainId: string = "eth-mainnet",
  setSelectedChain: (type: string) => void,
  setSelectedChainId: (chainId: string) => void
): Promise<string> => {
  try {
    setSelectedChain(chainId);
    setSelectedChainId(convertChainFormat(chainId, "honeypot"));

    const walletData = await fetchWalletData(address, chainId);
    const chainName = getChainName(chainId);

    if (
      !walletData.data ||
      !walletData.data.items ||
      walletData.data.items.length === 0
    ) {
      return `No tokens found in this wallet on ${chainName}. Try checking another blockchain.`;
    }

    const tokens = walletData.data.items.filter(
      (t) => t.type === "cryptocurrency"
    );
    const nfts = walletData.data.items.filter((t) => t.type === "nft");

    let response = `💰 WALLET BALANCES - ${chainName}\n\nAddress: ${address}\n\n`;

    const sortedTokens = [...tokens].sort((a, b) => {
      const valueA = parseFloat(String(a.quote || "0"));
      const valueB = parseFloat(String(b.quote || "0"));
      return valueB - valueA;
    });

    const spamChecks = await Promise.all(
      sortedTokens.map(async (token) => {
        if (!token.is_spam) {
          return await checkLocalSpamList(token.contract_address, chainId);
        }
        return false;
      })
    );

    if (sortedTokens.length > 0) {
      response += `TOKENS (${sortedTokens.length}):\n`;

      sortedTokens.slice(0, 15).forEach((token, index) => {
        const balance =
          parseFloat(token.balance) / Math.pow(10, token.contract_decimals);

        let formattedBalance;
        if (balance < 0.000001) {
          formattedBalance = balance.toExponential(4);
        } else if (balance < 0.01) {
          formattedBalance = balance.toFixed(6);
        } else if (balance < 1000) {
          formattedBalance = balance.toFixed(4);
        } else {
          formattedBalance = balance.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          });
        }

        const isSpam = token.is_spam || spamChecks[index];
        const spamWarning = isSpam ? " ⚠️" : "";

        response += `${index + 1}. ${token.contract_name} (${
          token.contract_ticker_symbol
        })${spamWarning}: ${formattedBalance} ${token.contract_ticker_symbol}`;
        if (token.pretty_quote) {
          response += ` (${token.pretty_quote})`;
        }

        response += "\n";
      });

      if (sortedTokens.length > 15) {
        response += `...and ${sortedTokens.length - 15} more tokens\n`;
      }
    } else {
      response += "No regular tokens found in this wallet.\n";
    }

    if (nfts.length > 0) {
      response += `\nNFT COLLECTIONS (${nfts.length}):\n`;

      nfts.slice(0, 10).forEach((nft, index) => {
        const balance =
          parseFloat(nft.balance) / Math.pow(10, nft.contract_decimals || 0);
        const spamWarning = nft.is_spam ? " ⚠️" : "";

        response += `${index + 1}. ${
          nft.contract_name
        }${spamWarning}: ${balance} items\n`;
      });

      if (nfts.length > 10) {
        response += `...and ${nfts.length - 10} more NFT collections\n`;
      }
    }
    response +=
      "\nNote: Items marked with ⚠️ are potentially spam or unsafe tokens. Exercise caution.";

    return response;
  } catch (error) {
    console.error("Error fetching token balances:", error);
    return `Error fetching token balances: ${
      error instanceof Error ? error.message : "Unknown error"
    }. Please check the wallet address and try again.`;
  }
};
