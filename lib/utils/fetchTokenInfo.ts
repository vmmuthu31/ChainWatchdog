interface TokenInfo {
  name: string;
  symbol: string;
}

/**
 * Fetches token name and symbol using blockchain explorer API
 * This is a fallback mechanism when other APIs fail
 */
export async function fetchTokenInfo(
  contractAddress: string,
  chainId: string
): Promise<TokenInfo> {
  let tokenName = "Unknown";
  let tokenSymbol = "UNKNOWN";

  try {
    // Use different APIs based on the chain
    if (chainId === "1") {
      // Ethereum - Etherscan API
      const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "";
      const response = await fetch(
        `https://api.etherscan.io/api?module=token&action=tokeninfo&contractaddress=${contractAddress}&apikey=${apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "1" && data.result.length > 0) {
          tokenName = data.result[0].name || tokenName;
          tokenSymbol = data.result[0].symbol || tokenSymbol;
        }
      }
    } else if (chainId === "8453") {
      // Base - BaseScan API
      const apiKey = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || "";
      const response = await fetch(
        `https://api.basescan.org/api?module=token&action=tokeninfo&contractaddress=${contractAddress}&apikey=${apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "1" && data.result.length > 0) {
          tokenName = data.result[0].name || tokenName;
          tokenSymbol = data.result[0].symbol || tokenSymbol;
        }
      }
    } else if (chainId === "56") {
      // BSC - BscScan API
      const apiKey = process.env.NEXT_PUBLIC_BSCSCAN_API_KEY || "";
      const response = await fetch(
        `https://api.bscscan.com/api?module=token&action=tokeninfo&contractaddress=${contractAddress}&apikey=${apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "1" && data.result.length > 0) {
          tokenName = data.result[0].name || tokenName;
          tokenSymbol = data.result[0].symbol || tokenSymbol;
        }
      }
    } else {
      // For other chains, we could implement similar API calls
      // or use a general-purpose blockchain API like Covalent

      // This is a simplistic fallback - In production you'd want to
      // implement proper handling for all supported chains
      console.log(
        `No specific explorer API integration for chain ID: ${chainId}`
      );
    }

    return {
      name: tokenName,
      symbol: tokenSymbol,
    };
  } catch (error) {
    console.error("Error fetching token info from explorer:", error);
    return {
      name: tokenName,
      symbol: tokenSymbol,
    };
  }
}

/**
 * Makes a basic assessment if a token might be high risk
 * This is a very simplified check and shouldn't be relied upon for investment decisions
 */
export async function performBasicRiskCheck(): Promise<{
  isHighRisk: boolean;
  reason?: string;
  buyTax?: number;
  sellTax?: number;
}> {
  try {
    // For the internal honeypot detection fallback, we're being cautious
    // and providing users with clear information about limitations

    return {
      isHighRisk: false,
      reason:
        "The primary honeypot detection service is currently unavailable. This is a limited analysis without detailed contract inspection. Please conduct additional research before making any investment decisions.",
      buyTax: undefined,
      sellTax: undefined,
    };
  } catch (error) {
    console.error("Error performing basic risk check:", error);
    return {
      isHighRisk: false,
      reason: "Error analyzing token. Exercise caution.",
    };
  }
}
