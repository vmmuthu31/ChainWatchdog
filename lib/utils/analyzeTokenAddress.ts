import { HoneypotResponse } from "../types";
import { checkLocalSpamList } from "./checkLocalSpamList";
import { convertChainFormat } from "./convertChainFormat";
import { getChainName } from "./getChainName";

const fetchHoneypotData = async (
  address: string,
  chainId: string
): Promise<HoneypotResponse> => {
  try {
    const response = await fetch(
      `https://api.honeypot.is/v2/IsHoneypot?address=${address}&chainID=${chainId}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as HoneypotResponse;
  } catch (error) {
    console.error("Error fetching honeypot data:", error);
    throw error;
  }
};

const detectChain = async (
  address: string,
  setIsProcessing: (value: boolean) => void,
  setSelectedChainId: (value: string) => void
): Promise<string | null> => {
  if (!address || address.length < 42) return null;

  setIsProcessing(true);

  const chainsToCheck = [
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

  try {
    for (const chainObj of chainsToCheck) {
      try {
        if (chainObj.id === "43114") {
          try {
            const response = await fetch(
              `${chainObj.explorer}/v1/chains/${chainObj.id}/addresses/${address}`,
              {
                headers: {
                  "x-glacier-api-key": chainObj.apikey || "",
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data && data.address) {
                setSelectedChainId(chainObj.id);
                return chainObj.id;
              }
            }
          } catch (error) {
            console.error(`Error checking Glacier API for Avalanche:`, error);
          }
          continue;
        }

        const explorerResponse = await fetch(
          `${chainObj.explorer}/api?module=contract&action=getabi&address=${address}&apikey=${chainObj.apikey}`
        );

        if (explorerResponse.ok) {
          const explorerData = await explorerResponse.json();
          if (
            explorerData.status === "1" ||
            (explorerData.result &&
              explorerData.result !== "Contract source code not verified" &&
              explorerData.result !== "" &&
              explorerData.result !== null)
          ) {
            setSelectedChainId(chainObj.id);
            return chainObj.id;
          }
        }
      } catch (error) {
        console.error(
          `Error checking explorer for chain ${chainObj.id} (${chainObj.name}):`,
          error
        );
      }
    }
    for (const chainObj of chainsToCheck) {
      try {
        if (chainObj.id === "43114") continue;

        const response = await fetch(
          `${chainObj.explorer}/api?module=account&action=balance&address=${address}&apikey=${chainObj.apikey}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.status === "1") {
            setSelectedChainId(chainObj.id);
            return chainObj.id;
          }
        }
      } catch (error) {
        console.error(
          `Error checking account balance for chain ${chainObj.id}:`,
          error
        );
      }
    }

    return null;
  } catch (error) {
    console.error("Error in chain detection:", error);
    return null;
  } finally {
    setIsProcessing(false);
  }
};

export const analyzeTokenAddress = async (
  address: string,
  chainId: string | null = null,
  setTokenAddress: (value: string) => void,
  setAnalysisType: (value: string) => void,
  setIsProcessing: (value: boolean) => void,
  setSelectedChainId: (value: string) => void,
  setSelectedChain: (value: string) => void
): Promise<string> => {
  setTokenAddress(address);
  setAnalysisType("honeypot");

  try {
    let finalChainId = chainId;
    if (!finalChainId || finalChainId === "auto") {
      const detectedChain = await detectChain(
        address,
        setIsProcessing,
        setSelectedChainId
      );
      if (detectedChain) {
        finalChainId = detectedChain;
        setSelectedChainId(detectedChain);
        setSelectedChain(convertChainFormat(detectedChain, "goldrush"));
      } else {
        finalChainId = "1";
        setSelectedChainId(finalChainId);
        setSelectedChain("eth-mainnet");
      }
    } else {
      setSelectedChainId(finalChainId);
      setSelectedChain(convertChainFormat(finalChainId, "goldrush"));
    }

    const apiChainId = finalChainId || "1";

    const goldrushChainId = convertChainFormat(apiChainId, "goldrush");
    const isLocalSpam = await checkLocalSpamList(address, goldrushChainId);

    if (isLocalSpam) {
      return `⚠️ SPAM TOKEN DETECTED ⚠️\n\nAddress: ${address}\nChain: ${getChainName(
        apiChainId
      )}\n\nThis token has been identified as SPAM in our database.\n\nRisk Level: HIGH\n\nThis token is listed in our spam token database. It may be used for scams, phishing, or other malicious activities. Do not interact with this token and do not approve any transactions requested by it.`;
    }

    try {
      const honeypotData = await fetchHoneypotData(address, apiChainId);
      const chainName = getChainName(apiChainId);

      if (honeypotData.honeypotResult.isHoneypot) {
        return `⚠️ HONEYPOT DETECTED ⚠️\n\nAddress: ${address}\nChain: ${chainName}\n\nAnalysis results:\n• Token Name: ${
          honeypotData.token.name
        } (${
          honeypotData.token.symbol
        })\n• Honeypot likelihood: HIGH\n• Sell transactions: FAILING\n• Buy tax: ${honeypotData.simulationResult.buyTax.toFixed(
          1
        )}%\n• Sell tax: UNABLE TO SELL\n• Contract verified: ${
          honeypotData.contractCode?.openSource ? "Yes" : "No"
        }\n• Reason: ${
          honeypotData.honeypotResult.honeypotReason || "Unable to sell tokens"
        }\n\nRecommendation: AVOID this token. Our simulation confirms this is a honeypot token designed to prevent selling.`;
      } else if (
        honeypotData.summary.risk === "high" ||
        honeypotData.summary.risk === "very_high"
      ) {
        return `⚠️ HIGH RISK TOKEN DETECTED ⚠️\n\nAddress: ${address}\nChain: ${chainName}\n\nAnalysis results:\n• Token Name: ${
          honeypotData.token.name
        } (${
          honeypotData.token.symbol
        })\n• Risk level: ${honeypotData.summary.risk.toUpperCase()}\n• Buy tax: ${honeypotData.simulationResult.buyTax.toFixed(
          1
        )}%\n• Sell tax: ${honeypotData.simulationResult.sellTax.toFixed(
          1
        )}%\n• Contract verified: ${
          honeypotData.contractCode?.openSource ? "Yes" : "No"
        }\n• Flags: ${honeypotData.flags.join(
          ", "
        )}\n\nRecommendation: PROCEED WITH EXTREME CAUTION. While not a confirmed honeypot, this token shows multiple high-risk characteristics.`;
      } else if (honeypotData.summary.risk === "medium") {
        return `⚠️ MEDIUM RISK TOKEN ⚠️\n\nAddress: ${address}\nChain: ${chainName}\n\nAnalysis results:\n• Token Name: ${
          honeypotData.token.name
        } (${
          honeypotData.token.symbol
        })\n• Risk level: MEDIUM\n• Buy tax: ${honeypotData.simulationResult.buyTax.toFixed(
          1
        )}%\n• Sell tax: ${honeypotData.simulationResult.sellTax.toFixed(
          1
        )}%\n• Contract verified: ${
          honeypotData.contractCode?.openSource ? "Yes" : "No"
        }\n• Holders: ${
          honeypotData.token.totalHolders
        }\n\nRecommendation: PROCEED WITH CAUTION. The token has some potential risk factors but does not appear to be a honeypot.`;
      } else {
        return `✅ NO IMMEDIATE ISSUES DETECTED\n\nAddress: ${address}\nChain: ${chainName}\n\nAnalysis results:\n• Token Name: ${
          honeypotData.token.name
        } (${
          honeypotData.token.symbol
        })\n• Risk level: ${honeypotData.summary.risk.toUpperCase()}\n• Buy tax: ${honeypotData.simulationResult.buyTax.toFixed(
          1
        )}%\n• Sell tax: ${honeypotData.simulationResult.sellTax.toFixed(
          1
        )}%\n• Contract verified: ${
          honeypotData.contractCode?.openSource ? "Yes" : "No"
        }\n• Holders: ${
          honeypotData.token.totalHolders
        }\n\nRecommendation: Standard precautions advised. While initial checks show no major issues, always conduct your own research before investing.`;
      }
    } catch (error) {
      if (isLocalSpam) {
        return `⚠️ SPAM TOKEN DETECTED ⚠️\n\nAddress: ${address}\nChain: ${getChainName(
          apiChainId
        )}\n\nThis token has been identified as SPAM in our database.\n\nRisk Level: HIGH\n\nThis token is listed in our spam token database. It may be used for scams, phishing, or other malicious activities. Do not interact with this token and do not approve any transactions requested by it.`;
      }

      console.error("Error analyzing token with honeypot API:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error analyzing token:", error);
    return `⚠️ ERROR ANALYZING TOKEN ⚠️\n\nAddress: ${address}\nChain: ${getChainName(
      chainId || "1"
    )}\n\nUnable to complete token analysis due to an error. This could be because:\n• The contract address may be invalid\n• The token might not exist on this chain\n• The API service might be experiencing issues\n\nPlease try again or check the contract address on the blockchain explorer.`;
  }
};
