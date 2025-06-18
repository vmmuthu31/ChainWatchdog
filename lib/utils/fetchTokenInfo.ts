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
    if (chainId === "1") {
      const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "";

      const response = await fetch(
        `https://api.etherscan.io/api?module=account&action=tokentx&address=${contractAddress}&apikey=${apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "1" && data.result && data.result[0]) {
          if (data.result[0].ContractName) {
            const contractName = data.result[0].ContractName;
            if (
              contractName !== "Token" &&
              !contractName.includes("Standard")
            ) {
              tokenName = contractName.replace("Token", "").trim();
            }
          }
        }
      }

      const erc20Response = await fetch(
        `https://api.etherscan.io/api?module=account&action=tokentx&address=${contractAddress}&page=1&offset=1&sort=asc&apikey=${apiKey}`
      );

      if (erc20Response.ok) {
        const data = await erc20Response.json();
        if (data.status === "1" && data.result && data.result.length > 0) {
          tokenName = data.result[0].tokenName || tokenName;
          tokenSymbol = data.result[0].tokenSymbol || tokenSymbol;
        }
      }
    } else if (chainId === "8453") {
      const apiKey = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || "";

      const response = await fetch(
        `https://api.basescan.org/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "1" && data.result && data.result[0]) {
          if (data.result[0].ContractName) {
            const contractName = data.result[0].ContractName;
            if (
              contractName !== "Token" &&
              !contractName.includes("Standard")
            ) {
              tokenName = contractName.replace("Token", "").trim();
            }
          }
        }
      }

      const erc20Response = await fetch(
        `https://api.basescan.org/api?module=account&action=tokentx&address=${contractAddress}&page=1&offset=1&sort=asc&apikey=${apiKey}`
      );

      if (erc20Response.ok) {
        const data = await erc20Response.json();
        if (data.status === "1" && data.result && data.result.length > 0) {
          tokenName = data.result[0].tokenName || tokenName;
          tokenSymbol = data.result[0].tokenSymbol || tokenSymbol;
        }
      }
    } else if (chainId === "56") {
      const apiKey = process.env.NEXT_PUBLIC_BSCSCAN_API_KEY || "";

      const response = await fetch(
        `https://api.bscscan.com/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "1" && data.result && data.result[0]) {
          if (data.result[0].ContractName) {
            const contractName = data.result[0].ContractName;
            if (
              contractName !== "Token" &&
              !contractName.includes("Standard")
            ) {
              tokenName = contractName.replace("Token", "").trim();
            }
          }
        }
      }

      const erc20Response = await fetch(
        `https://api.bscscan.com/api?module=account&action=tokentx&address=${contractAddress}&page=1&offset=1&sort=asc&apikey=${apiKey}`
      );

      if (erc20Response.ok) {
        const data = await erc20Response.json();
        if (data.status === "1" && data.result && data.result.length > 0) {
          tokenName = data.result[0].tokenName || tokenName;
          tokenSymbol = data.result[0].tokenSymbol || tokenSymbol;
        }
      }
    } else {
      try {
        const goldrushApiKey = process.env.NEXT_PUBLIC_GOLDRUSH_API_KEY || "";
        const covalentResponse = await fetch(
          `https://api.covalenthq.com/v1/${chainId}/tokens/${contractAddress}/`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(
                goldrushApiKey + ":"
              ).toString("base64")}`,
            },
          }
        );

        if (covalentResponse.ok) {
          const data = await covalentResponse.json();
          if (data.data && data.data.items && data.data.items[0]) {
            tokenName = data.data.items[0].contract_name || tokenName;
            tokenSymbol =
              data.data.items[0].contract_ticker_symbol || tokenSymbol;
          }
        }
      } catch (error) {
        console.error("Error using Covalent API:", error);
      }

      console.log(
        `Attempted fallback for chain ID: ${chainId} using Covalent API`
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
export async function performBasicRiskCheck(
  contractAddress?: string,
  chainId?: string
): Promise<{
  isHighRisk: boolean;
  reason?: string;
  buyTax?: number;
  sellTax?: number;
}> {
  try {
    if (!contractAddress || !chainId) {
      return {
        isHighRisk: false,
        reason:
          "Limited analysis available. Unable to determine honeypot status.",
        buyTax: undefined,
        sellTax: undefined,
      };
    }

    let contractName = "";

    let apiUrl = "";
    let apiKey = "";

    if (chainId === "1") {
      apiUrl = "https://api.etherscan.io/api";
      apiKey = "PY1BBD1Y1SRVKRMHHRKB7TM19MGGTSAK3C";
    } else if (chainId === "56") {
      apiUrl = "https://api.bscscan.com/api";
      apiKey = "16X26SKXEC3DPAGN88S869HAUAY1T1MAWY";
    } else if (chainId === "8453") {
      apiUrl = "https://api.basescan.org/api";
      apiKey = "G6GEJQZDVW7MKWD7JTUAIPZ6JCPN1QQFZG";
    }

    if (apiUrl) {
      const response = await fetch(
        `${apiUrl}?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKey}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.status === "1" && data.result && data.result[0]) {
          const sourceCode = data.result[0].SourceCode;
          contractName = data.result[0].ContractName || "";

          if (sourceCode && sourceCode.length > 10) {
            const isProxy =
              contractName.toLowerCase().includes("proxy") ||
              sourceCode.toLowerCase().includes("delegatecall") ||
              sourceCode.toLowerCase().includes("implementation");

            const hasRevertOnSell =
              sourceCode.toLowerCase().includes("revert") &&
              (sourceCode.toLowerCase().includes("sell") ||
                sourceCode.toLowerCase().includes("transfer"));

            const hasFeeManipulation =
              sourceCode.toLowerCase().includes("fee") &&
              (sourceCode.toLowerCase().includes("change") ||
                sourceCode.toLowerCase().includes("set"));

            if (hasRevertOnSell || hasFeeManipulation) {
              return {
                isHighRisk: true,
                reason: `Contract has suspicious code patterns that may indicate a honeypot. ${
                  hasRevertOnSell ? "Contains code that may block selling." : ""
                } ${
                  hasFeeManipulation
                    ? "Contains functions that can change fees."
                    : ""
                }`,
                buyTax: hasRevertOnSell ? 5 : 3,
                sellTax: hasRevertOnSell ? 100 : hasFeeManipulation ? 20 : 5,
              };
            }

            if (isProxy) {
              return {
                isHighRisk: false,
                reason:
                  "Contract uses proxy pattern. Implementation may be upgradable. Exercise caution.",
                buyTax: 3,
                sellTax: 3,
              };
            }
          } else {
            return {
              isHighRisk: true,
              reason:
                "Contract source code is not verified. This is a risk factor as the code cannot be analyzed.",
              buyTax: 5,
              sellTax: 10,
            };
          }
        } else {
          return {
            isHighRisk: true,
            reason:
              "Could not retrieve contract information. Contract may not exist or may be very new.",
            buyTax: undefined,
            sellTax: undefined,
          };
        }
      }
    }

    return {
      isHighRisk: false,
      reason:
        "Basic check completed. No obvious red flags detected, but limited analysis is available without full simulation.",
      buyTax: 2,
      sellTax: 2,
    };
  } catch (error) {
    console.error("Error performing basic risk check:", error);
    return {
      isHighRisk: false,
      reason:
        "Error analyzing token. Exercise caution and do your own research before trading.",
      buyTax: undefined,
      sellTax: undefined,
    };
  }
}
