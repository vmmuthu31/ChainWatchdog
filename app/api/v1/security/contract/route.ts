/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import {
  authenticateApiRequest,
  createAuthenticatedResponse,
  deductCredits,
} from "@/lib/auth/apiAuth";

interface ContractVerificationRequest {
  address: string;
  chain?: string;
}

interface ContractVerificationResponse {
  contract: {
    address: string;
    isVerified: boolean;
    isOpenSource: boolean;
    isProxy: boolean;
    hasProxyCalls: boolean;
    hasPermissions: boolean;
  };
  chain: {
    id: string;
    name: string;
  };
  security: {
    riskLevel: "low" | "medium" | "high";
    risks: string[];
  };
  lastUpdated: string;
}

/**
 * Verify contract using external services (abstracted)
 */
async function verifyContract(
  address: string,
  chainId: string
): Promise<ContractVerificationResponse> {
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  const isSolanaAddress = solanaRegex.test(address);

  let contractData: unknown = null;

  if (isSolanaAddress) {
    try {
      const { getSolanaTokenContractVerification } = await import(
        "@/lib/services/rugCheckService"
      );
      contractData = await getSolanaTokenContractVerification(address);
    } catch (error) {
      console.error("Error fetching Solana contract data:", error);
    }
  } else {
    try {
      const numericChainId = chainId === "solana-mainnet" ? "1" : chainId;
      const response = await fetch(
        `https://api.honeypot.is/v2/GetContractVerification?address=${address}&chainID=${numericChainId}`
      );

      if (response.ok) {
        contractData = await response.json();
      }
    } catch (error) {
      console.error("Error fetching EVM contract data:", error);
    }
  }

  // Process and normalize the data
  const contract = {
    address: address,
    isVerified:
      (contractData as any)?.isVerified ||
      (contractData as any)?.isRootOpenSource ||
      false,
    isOpenSource:
      (contractData as any)?.isOpenSource ||
      (contractData as any)?.rootOpenSource ||
      false,
    isProxy: (contractData as any)?.isProxy || false,
    hasProxyCalls: (contractData as any)?.hasProxyCalls || false,
    hasPermissions: (contractData as any)?.hasPermissions || false,
  };

  const chain = {
    id: chainId,
    name: getChainName(chainId),
  };

  const risks: string[] = [];
  let riskLevel: "low" | "medium" | "high" = "low";

  if (contract.isProxy) {
    risks.push("PROXY_CONTRACT");
    riskLevel = "medium";
  }

  if (contract.hasProxyCalls) {
    risks.push("PROXY_CALLS");
    riskLevel = "medium";
  }

  if (!contract.isVerified) {
    risks.push("UNVERIFIED_CONTRACT");
    if (riskLevel === "low") riskLevel = "medium";
  }

  if (!contract.isOpenSource) {
    risks.push("CLOSED_SOURCE");
    if (riskLevel === "low") riskLevel = "medium";
  }

  if (contract.hasPermissions) {
    risks.push("HAS_ADMIN_PERMISSIONS");
    riskLevel = "high";
  }

  return {
    contract,
    chain,
    security: {
      riskLevel,
      risks,
    },
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
    let body: ContractVerificationRequest;
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
            details: "Please provide a valid contract address",
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

    // Default chain detection
    const chainId =
      body.chain ||
      (solanaAddressRegex.test(body.address) ? "solana-mainnet" : "1");

    // Check if user has enough credits
    const creditsRequired = 1;
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

    // Perform the verification
    const verification = await verifyContract(body.address, chainId);

    // Deduct credits
    deductCredits(apiKey.id, creditsRequired);

    // Return the response
    return createAuthenticatedResponse(verification, apiKey, creditsRequired);
  } catch (error) {
    console.error("Contract verification error:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "VERIFICATION_ERROR",
          message: "Failed to verify contract",
          details:
            "An error occurred while verifying the contract. Please try again later.",
        },
      },
      { status: 500 }
    );
  }
}
