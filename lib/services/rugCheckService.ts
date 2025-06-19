/* eslint-disable @typescript-eslint/no-explicit-any */

const RUGCHECK_API_URL = "https://api.rugcheck.xyz/v1";
const HELIUS_API_URL = "https://api.helius.xyz/v0";
const HELIUS_API_KEY = "b477781a-99e7-41be-972e-1942d84d0669";

async function fetchHeliusTokenHolders(
  tokenAddress: string
): Promise<any | null> {
  try {
    const response = await fetch(
      `${HELIUS_API_URL}/addresses/${tokenAddress}/balances?api-key=${HELIUS_API_KEY}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Helius holders API error:", response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching holders from Helius API:", error);
    return null;
  }
}

async function fetchHeliusTokenMetadata(
  tokenAddress: string
): Promise<any | null> {
  try {
    const response = await fetch(
      `${HELIUS_API_URL}/token-metadata?api-key=${HELIUS_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          includeOffChain: false,
          disableCache: false,
          mintAccounts: [tokenAddress],
        }),
      }
    );

    if (!response.ok) {
      console.error("Helius API error:", response.statusText);
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error("Error fetching from Helius API:", error);
    return null;
  }
}

export interface RugCheckTokenReport {
  mint: string;
  tokenProgram: string;
  creator: string;
  creatorBalance: number;
  token: {
    mintAuthority: string | null;
    supply: number;
    decimals: number;
    isInitialized: boolean;
    freezeAuthority: string | null;
  };
  token_extensions: any | null;
  tokenMeta: {
    name: string;
    symbol: string;
    uri: string;
    mutable: boolean;
    updateAuthority: string;
  };
  topHolders: {
    address: string;
    amount: number;
    decimals: number;
    pct: number;
    uiAmount: number;
    uiAmountString: string;
    owner: string;
    insider: boolean;
  }[];
  freezeAuthority: string | null;
  mintAuthority: string | null;
  risks: {
    name: string;
    value: string;
    description: string;
    score: number;
    level: string;
  }[];
  score: number;
  score_normalised: number;
  fileMeta: {
    description: string;
    name: string;
    symbol: string;
    image: string;
  };
  lockerOwners: Record<string, any>;
  lockers: Record<string, any>;
  markets: any | null;
  totalMarketLiquidity: number;
  totalLPProviders: number;
  totalHolders: number;
  price: number;
  rugged: boolean;
  tokenType: string;
  transferFee: {
    pct: number;
    maxAmount: number;
    authority: string;
  };
  knownAccounts: Record<string, { name: string; type: string }>;
  events: any[];
  verification: any | null;
  graphInsidersDetected: number;
  insiderNetworks: any | null;
  detectedAt: string;
  creatorTokens: any | null;
}

export interface RugCheckSummary {
  tokenProgram: string;
  tokenType: string;
  risks: {
    name: string;
    value: string;
    description: string;
    score: number;
    level: string;
  }[];
  score: number;
  score_normalised: number;
  lpLockedPct: number;
}

/**
 * Fetches the full token report from RugCheck API with Helius API fallback
 */
export async function fetchRugCheckTokenReport(
  tokenAddress: string
): Promise<RugCheckTokenReport | null> {
  try {
    const response = await fetch(
      `${RUGCHECK_API_URL}/tokens/${tokenAddress}/report`
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`RugCheck API error (${response.status}):`, errorData);

      if (
        response.status === 429 ||
        errorData.includes("rate limit") ||
        errorData.includes("unable to generate report")
      ) {
        console.log(
          "RugCheck API rate limited or unavailable, falling back to Helius API"
        );
        const heliusData = await fetchHeliusTokenMetadata(tokenAddress);

        if (heliusData) {
          return {
            mint: tokenAddress,
            tokenProgram: heliusData.onChainAccountInfo.accountInfo.owner,
            creator:
              heliusData.onChainMetadata?.metadata?.updateAuthority || "",
            creatorBalance: 0,
            token: {
              mintAuthority:
                heliusData.onChainAccountInfo.accountInfo.data.parsed.info
                  .mintAuthority || null,
              supply: Number(
                heliusData.onChainAccountInfo.accountInfo.data.parsed.info
                  .supply
              ),
              decimals:
                heliusData.onChainAccountInfo.accountInfo.data.parsed.info
                  .decimals,
              isInitialized:
                heliusData.onChainAccountInfo.accountInfo.data.parsed.info
                  .isInitialized,
              freezeAuthority:
                heliusData.onChainAccountInfo.accountInfo.data.parsed.info
                  .freezeAuthority || null,
            },
            token_extensions: null,
            tokenMeta: {
              name:
                heliusData.onChainMetadata?.metadata?.data?.name || "Unknown",
              symbol:
                heliusData.onChainMetadata?.metadata?.data?.symbol || "UNKNOWN",
              uri: heliusData.onChainMetadata?.metadata?.data?.uri || "",
              mutable: heliusData.onChainMetadata?.metadata?.isMutable || false,
              updateAuthority:
                heliusData.onChainMetadata?.metadata?.updateAuthority || "",
            },
            topHolders: [],
            freezeAuthority:
              heliusData.onChainAccountInfo.accountInfo.data.parsed.info
                .freezeAuthority || null,
            mintAuthority:
              heliusData.onChainAccountInfo.accountInfo.data.parsed.info
                .mintAuthority || null,
            risks: [],
            score: 50,
            score_normalised: 50,
            fileMeta: {
              description: "",
              name:
                heliusData.onChainMetadata?.metadata?.data?.name || "Unknown",
              symbol:
                heliusData.onChainMetadata?.metadata?.data?.symbol || "UNKNOWN",
              image: "",
            },
            lockerOwners: {},
            lockers: {},
            markets: null,
            totalMarketLiquidity: 0,
            totalLPProviders: 0,
            totalHolders: 0,
            price: 0,
            rugged: false,
            tokenType: "Unknown",
            transferFee: {
              pct: 0,
              maxAmount: 0,
              authority: "",
            },
            knownAccounts: {},
            events: [],
            verification: null,
            graphInsidersDetected: 0,
            insiderNetworks: null,
            detectedAt: new Date().toISOString(),
            creatorTokens: null,
          };
        }
      }
      return null;
    }

    const data = await response.json();
    return data as RugCheckTokenReport;
  } catch (error) {
    console.error("Error fetching RugCheck token report:", error);
    return null;
  }
}

/**
 * Fetches the token summary report from RugCheck API
 */
export async function fetchRugCheckTokenSummary(
  tokenAddress: string
): Promise<RugCheckSummary | null> {
  try {
    const response = await fetch(
      `${RUGCHECK_API_URL}/tokens/${tokenAddress}/report/summary`
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`RugCheck API error (${response.status}):`, errorData);
      return null;
    }

    const data = await response.json();
    return data as RugCheckSummary;
  } catch (error) {
    console.error("Error fetching RugCheck token summary:", error);
    return null;
  }
}

/**
 * Determines risk level based on normalized score
 */
function determineRiskLevel(normalizedScore: number): string {
  if (normalizedScore >= 80) return "high";
  if (normalizedScore >= 50) return "medium";
  return "low";
}

/**
 * Creates a HoneypotResponse object from RugCheck data for compatibility
 */
export async function getSolanaTokenHoneypotAnalysis(tokenAddress: string) {
  try {
    const report = await fetchRugCheckTokenReport(tokenAddress);

    if (!report) {
      throw new Error("Failed to fetch RugCheck token report");
    }

    return {
      token: {
        address: report.mint,
        name: report.tokenMeta?.name || "Unknown",
        symbol: report.tokenMeta?.symbol || "UNKNOWN",
        totalHolders: report.totalHolders || 0,
      },
      simulationResult: {
        buyTax: 0,
        sellTax: 0,
        transferTax: report.transferFee?.pct || 0,
        buyGas: 0,
        sellGas: 0,
      },
      contractCode: {
        openSource: true,
        rootOpenSource: true,
        isProxy: false,
        hasProxyCalls: false,
      },
      summary: {
        risk: determineRiskLevel(report.score_normalised),
      },
      honeypotResult: {
        isHoneypot: report.score_normalised > 70,
        honeypotReason:
          report.risks.length > 0 ? report.risks[0].description : "",
      },
      simulationSuccess: true,
      flags: {
        isHoneypot: report.score_normalised > 70,
        isSellable: report.totalMarketLiquidity > 0,
        isOpen: true,
        isAntiWhale: false,
        hasAntiBot: false,
        staysLiquid: report.totalMarketLiquidity > 100,
        routerOkForOps: true,
        hasForeignCalls: false,
        hasPermissions:
          report.token.mintAuthority !== null ||
          report.token.freezeAuthority !== null,
      },
      chain: "solana-mainnet",
      risks: report.risks,
      score: report.score,
      score_normalised: report.score_normalised,
    };
  } catch (error) {
    console.error("Error in getSolanaTokenHoneypotAnalysis:", error);
    throw error;
  }
}

/**
 * Creates a ContractVerificationResponse object from RugCheck data for compatibility
 */
export async function getSolanaTokenContractVerification(tokenAddress: string) {
  try {
    const report = await fetchRugCheckTokenReport(tokenAddress);

    if (!report) {
      throw new Error("Failed to fetch RugCheck token report");
    }

    const hasMintAuthority = !!report.token.mintAuthority;
    const hasFreezeAuthority = !!report.token.freezeAuthority;

    return {
      isContract: true,
      isRootOpenSource: true,
      fullCheckPerformed: true,
      summary: {
        isOpenSource: true,
        hasProxyCalls: false,
        tokenProgram: report.tokenProgram,
      },
      solanaSpecific: {
        tokenProgram: report.tokenProgram,
        mintAuthority: report.token.mintAuthority,
        freezeAuthority: report.token.freezeAuthority,
        creator: report.creator,
        updateAuthority: report.tokenMeta?.updateAuthority,
        mutable: report.tokenMeta?.mutable,
        tokenSupply: report.token.supply,
        tokenDecimals: report.token.decimals,
        transferFee: report.transferFee,
      },
      securityRisks: {
        hasMintAuthority,
        hasFreezeAuthority,
        isMutable: report.tokenMeta?.mutable || false,
        hasTransferFee: report.transferFee?.pct > 0,
      },
      verification: report.verification,
    };
  } catch (error) {
    console.error("Error in getSolanaTokenContractVerification:", error);
    throw error;
  }
}

/**
 * Creates a TopHoldersResponse object from RugCheck data for compatibility
 */
export async function getSolanaTokenHolders(tokenAddress: string) {
  try {
    const report = await fetchRugCheckTokenReport(tokenAddress);

    if (!report) {
      const heliusHolders = await fetchHeliusTokenHolders(tokenAddress);

      if (heliusHolders && heliusHolders.tokens) {
        return {
          holders: heliusHolders.tokens.slice(0, 10).map((token: any) => ({
            address: token.owner,
            balance: token.amount.toString(),
            alias: "",
            percent: `${(
              (token.amount / heliusHolders.total_supply) *
              100
            ).toFixed(1)}%`,
            percentage: (
              (token.amount / heliusHolders.total_supply) *
              100
            ).toString(),
            isContract: false,
            isInsider: false,
            uiAmount: token.amount,
            uiAmountString: token.amount.toString(),
          })),
          totalSupply: heliusHolders.total_supply?.toString() || "0",
        };
      }

      throw new Error(
        "Failed to fetch RugCheck token report and Helius fallback failed"
      );
    }

    return {
      holders: report.topHolders.map((holder) => ({
        address: holder.owner,
        balance: holder.amount.toString(),
        alias: report.knownAccounts[holder.owner]?.name || "",
        percent: `${holder.pct.toFixed(1)}%`,
        percentage: holder.pct.toString(),
        isContract: false,
        isInsider: holder.insider,
        uiAmount: holder.uiAmount,
        uiAmountString: holder.uiAmountString,
      })),
      totalSupply: report.token.supply.toString(),
    };
  } catch (error) {
    console.error("Error in getSolanaTokenHolders:", error);
    throw error;
  }
}

/**
 * Creates a PairResponse array from RugCheck data for compatibility
 */
export async function getSolanaTokenPairs(tokenAddress: string) {
  try {
    const report = await fetchRugCheckTokenReport(tokenAddress);

    if (!report) {
      throw new Error("Failed to fetch RugCheck token report");
    }

    if (!report.markets) {
      return [];
    }

    const pairs = [];

    if (Array.isArray(report.markets)) {
      for (const market of report.markets) {
        if (!market) continue;

        pairs.push({
          Pair: {
            Address: market.address || "Unknown",
            Name: market.name || `${report.tokenMeta?.symbol || "SOL"} Pair`,
          },
          ChainID: -1,
          Liquidity: market.liquidity || report.totalMarketLiquidity || 0,
        });
      }
    } else if (typeof report.markets === "object") {
      for (const address in report.markets) {
        const market = report.markets[address];
        if (!market) continue;

        pairs.push({
          Pair: {
            Address: address,
            Name: market.name || `${report.tokenMeta?.symbol || "SOL"} Pair`,
          },
          ChainID: -1,
          Liquidity: market.liquidity || 0,
        });
      }
    }

    return pairs.length > 0
      ? pairs
      : [
          {
            Pair: {
              Address: tokenAddress,
              Name: `${report.tokenMeta?.symbol || "Unknown"}/SOL`,
            },
            ChainID: -1,
            Liquidity: report.totalMarketLiquidity || 0,
          },
        ];
  } catch (error) {
    console.error("Error in getSolanaTokenPairs:", error);
    return [];
  }
}
