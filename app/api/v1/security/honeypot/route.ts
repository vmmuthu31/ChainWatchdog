/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import {
  authenticateApiRequest,
  createAuthenticatedResponse,
  deductCredits,
} from "@/lib/auth/apiAuth";

interface HoneypotAnalysisRequest {
  address: string;
  chain?: string;
}

interface HoneypotAnalysisResponse {
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalHolders: number;
    supply?: string;
  };
  chain: {
    id: string;
    name: string;
    nativeCurrency: string;
  };
  security: {
    isHoneypot: boolean;
    honeypotReason?: string;
    riskLevel: "low" | "medium" | "high";
    riskScore: number;
  };
  trading: {
    buyTax: number;
    sellTax: number;
    transferTax: number;
    maxTxAmount?: string;
    maxWalletAmount?: string;
  };
  contract: {
    isOpenSource: boolean;
    isVerified: boolean;
    isProxy: boolean;
    hasProxyCalls: boolean;
  };
  liquidity: {
    dex: string;
    pairAddress?: string;
    liquidityUsd: number;
    lockedLiquidity?: number;
  };
  holders: {
    total: number;
    canSell: number;
    topHolders: Array<{
      address: string;
      balance: string;
      percentage: number;
    }>;
  };
  flags: string[];
  lastUpdated: string;
}

/**
 * Auto-detect chain for given address
 */
async function detectChain(address: string): Promise<string | null> {
  try {
    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (solanaRegex.test(address)) {
      return "solana-mainnet";
    }

    const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!evmAddressRegex.test(address)) {
      return null;
    }

    // For demo purposes, default to Ethereum if EVM address
    return "1";
  } catch (error) {
    console.error("Error in chain detection:", error);
    return null;
  }
}

/**
 * Analyze token using external services (abstracted)
 */
async function analyzeTokenSecurity(
  address: string,
  chainId: string
): Promise<HoneypotAnalysisResponse> {
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  const isSolanaAddress = solanaRegex.test(address);

  let honeypotData: any = null;
  let contractData: any = null;
  let pairsData: any[] = [];
  let holdersData: any = null;

  if (isSolanaAddress) {
    // Call Solana analysis services
    try {
      const {
        getSolanaTokenHoneypotAnalysis,
        getSolanaTokenContractVerification,
        getSolanaTokenPairs,
        getSolanaTokenHolders,
      } = await import("@/lib/services/rugCheckService");

      const [honeypot, contract, pairs, holders] = await Promise.allSettled([
        getSolanaTokenHoneypotAnalysis(address),
        getSolanaTokenContractVerification(address),
        getSolanaTokenPairs(address),
        getSolanaTokenHolders(address),
      ]);

      honeypotData =
        honeypot.status === "fulfilled"
          ? {
              ...honeypot.value,
              token: {
                ...honeypot.value.token,
                decimals: 0, // Adding required decimals field
              },
            }
          : null;
      contractData = contract.status === "fulfilled" ? contract.value : null;
      pairsData =
        pairs.status === "fulfilled"
          ? pairs.value.map((pair) => ({
              ...pair,
              Reserves: [], // Adding required Reserves field
              Router: "0x0", // Adding required Router field
            }))
          : [];
      holdersData = holders.status === "fulfilled" ? holders.value : null;
    } catch (error) {
      console.error("Error fetching Solana data:", error);
    }
  } else {
    // Call EVM analysis services
    try {
      const numericChainId = chainId === "solana-mainnet" ? "1" : chainId;

      const [
        honeypotResponse,
        contractResponse,
        pairsResponse,
        holdersResponse,
      ] = await Promise.allSettled([
        fetch(
          `https://api.honeypot.is/v2/IsHoneypot?address=${address}&chainID=${numericChainId}`
        ),
        fetch(
          `https://api.honeypot.is/v2/GetContractVerification?address=${address}&chainID=${numericChainId}`
        ),
        fetch(
          `https://api.honeypot.is/v1/GetPairs?address=${address}&chainID=${numericChainId}`
        ),
        fetch(
          `https://api.honeypot.is/v1/TopHolders?address=${address}&chainID=${numericChainId}`
        ),
      ]);

      if (
        honeypotResponse.status === "fulfilled" &&
        honeypotResponse.value.ok
      ) {
        honeypotData = await honeypotResponse.value.json();
      }

      if (
        contractResponse.status === "fulfilled" &&
        contractResponse.value.ok
      ) {
        contractData = await contractResponse.value.json();
      }

      if (pairsResponse.status === "fulfilled" && pairsResponse.value.ok) {
        const pairsJson = await pairsResponse.value.json();
        pairsData = Array.isArray(pairsJson)
          ? pairsJson
          : pairsJson.pairs || [];
      }

      if (holdersResponse.status === "fulfilled" && holdersResponse.value.ok) {
        holdersData = await holdersResponse.value.json();
      }
    } catch (error) {
      console.error("Error fetching EVM data:", error);
    }
  }

  // Process and normalize the data
  const token = {
    address: address,
    name: honeypotData?.token?.name || "Unknown Token",
    symbol: honeypotData?.token?.symbol || "UNKNOWN",
    decimals: honeypotData?.token?.decimals || (isSolanaAddress ? 9 : 18),
    totalHolders:
      honeypotData?.token?.totalHolders || holdersData?.totalHolders || 0,
    supply: honeypotData?.token?.totalSupply || honeypotData?.token?.supply,
  };

  const chain = {
    id: chainId,
    name: getChainName(chainId),
    nativeCurrency: isSolanaAddress ? "SOL" : chainId === "56" ? "BNB" : "ETH",
  };

  const isHoneypot =
    honeypotData?.honeypotResult?.isHoneypot ||
    honeypotData?.summary?.risk === "high" ||
    (honeypotData?.simulationResult?.sellTax &&
      honeypotData.simulationResult.sellTax > 50);

  const riskScore =
    honeypotData?.score_normalised ||
    (isHoneypot ? 85 : honeypotData?.simulationResult?.sellTax > 10 ? 60 : 25);

  const security = {
    isHoneypot,
    honeypotReason:
      honeypotData?.honeypotResult?.honeypotReason ||
      honeypotData?.summary?.riskReason ||
      (isHoneypot ? "High sell tax or blocked selling detected" : undefined),
    riskLevel: (riskScore > 70 ? "high" : riskScore > 40 ? "medium" : "low") as
      | "low"
      | "medium"
      | "high",
    riskScore: Math.round(riskScore),
  };

  const trading = {
    buyTax: honeypotData?.simulationResult?.buyTax || 0,
    sellTax: honeypotData?.simulationResult?.sellTax || 0,
    transferTax: honeypotData?.simulationResult?.transferTax || 0,
  };

  const contract = {
    isOpenSource:
      contractData?.isOpenSource ||
      honeypotData?.contractCode?.openSource ||
      false,
    isVerified:
      contractData?.isVerified ||
      honeypotData?.contractCode?.rootOpenSource ||
      false,
    isProxy:
      contractData?.isProxy || honeypotData?.contractCode?.isProxy || false,
    hasProxyCalls:
      contractData?.hasProxyCalls ||
      honeypotData?.contractCode?.hasProxyCalls ||
      false,
  };

  const mainPair = pairsData?.[0];
  const liquidity = {
    dex: mainPair?.dexName || (isSolanaAddress ? "Raydium" : "Uniswap V2"),
    pairAddress: mainPair?.Pair?.Address || honeypotData?.pair?.pair?.address,
    liquidityUsd:
      mainPair?.liquidity?.usd ||
      mainPair?.Liquidity ||
      honeypotData?.pair?.liquidity ||
      0,
  };

  const topHolders = (holdersData?.holders || [])
    .slice(0, 5)
    .map((holder: any) => ({
      address: holder.address || holder.owner,
      balance: holder.balance || holder.amount?.toString() || "0",
      percentage: parseFloat(
        holder.percentage || holder.pct?.toString() || "0"
      ),
    }));

  const holders = {
    total: token.totalHolders,
    canSell: honeypotData?.holderAnalysis?.successful || token.totalHolders,
    topHolders,
  };

  let flags: string[] = [];
  if (honeypotData?.flags) {
    if (Array.isArray(honeypotData.flags)) {
      flags = honeypotData.flags;
    } else if (typeof honeypotData.flags === "object") {
      flags = Object.keys(honeypotData.flags).filter(
        (key) => honeypotData.flags[key]
      );
    }
  }

  if (honeypotData?.risks && Array.isArray(honeypotData.risks)) {
    honeypotData.risks.forEach((risk: any) => {
      if (risk.level === "danger" || risk.level === "warning") {
        flags.push(
          risk.name?.toUpperCase().replace(/\s+/g, "_") || "UNKNOWN_RISK"
        );
      }
    });
  }

  return {
    token,
    chain,
    security,
    trading,
    contract,
    liquidity,
    holders,
    flags,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get chain name for display
 */
function getChainName(chainId: string): string {
  const chainNames: { [key: string]: string } = {
    "1": "Ethereum Mainnet",
    "56": "BNB Smart Chain",
    "137": "Polygon",
    "8453": "Base",
    "43114": "Avalanche",
    "solana-mainnet": "Solana",
  };
  return chainNames[chainId] || `Chain ${chainId}`;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiRequest(request);

    if (!authResult.success) {
      return authResult.response!;
    }

    const apiKey = authResult.data!;

    // Parse request body
    let body: HoneypotAnalysisRequest;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          error: {
            code: "INVALID_JSON",
            message: "Invalid JSON in request body",
            details:
              "Please provide valid JSON with address and optional chain parameters",
          },
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.address) {
      return Response.json(
        {
          success: false,
          error: {
            code: "MISSING_ADDRESS",
            message: "Address parameter is required",
            details: "Please provide a valid token contract address",
          },
        },
        { status: 400 }
      );
    }

    // Validate address format
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

    if (
      !ethAddressRegex.test(body.address) &&
      !solanaAddressRegex.test(body.address)
    ) {
      return Response.json(
        {
          success: false,
          error: {
            code: "INVALID_ADDRESS",
            message: "Invalid address format",
            details:
              "Please provide a valid Ethereum (0x...) or Solana (base58) address",
          },
        },
        { status: 400 }
      );
    }

    // Detect chain if not provided
    let chainId: string | undefined = body.chain;
    if (!chainId) {
      const detectedChain = await detectChain(body.address);
      chainId = detectedChain ?? undefined;
      if (!chainId) {
        return Response.json(
          {
            success: false,
            error: {
              code: "CHAIN_DETECTION_FAILED",
              message: "Could not detect blockchain for this address",
              details: "Please specify the chain parameter explicitly",
            },
          },
          { status: 400 }
        );
      }
    }

    // Check if user has enough credits
    const creditsRequired = apiKey.tier === "free" ? 2 : 1;
    if (apiKey.credits < creditsRequired) {
      return Response.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_CREDITS",
            message: "Insufficient credits",
            details: `This operation requires ${creditsRequired} credits. You have ${apiKey.credits} credits remaining.`,
          },
        },
        { status: 402 }
      );
    }

    // Perform the analysis
    const analysis = await analyzeTokenSecurity(body.address, chainId);

    // Deduct credits
    deductCredits(apiKey.id, creditsRequired);

    // Return the response
    return createAuthenticatedResponse(analysis, apiKey, creditsRequired);
  } catch (error) {
    console.error("Honeypot analysis error:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "ANALYSIS_ERROR",
          message: "Failed to analyze token",
          details:
            "An error occurred while analyzing the token. Please try again later.",
        },
      },
      { status: 500 }
    );
  }
}
