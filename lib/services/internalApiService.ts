/**
 * Internal API Service
 *
 * This service provides a unified interface to our internal API endpoints,
 * abstracting away external service dependencies and providing authentication.
 */

const API_BASE_URL = "https://rugproofai.com";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  credits_used?: number;
  credits_remaining?: number;
  timestamp?: string;
}

interface HoneypotAnalysisResult {
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

interface ContractVerificationResult {
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
 * Base API client with authentication
 */
class InternalApiClient {
  private apiKey: string | null = null;
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "POST",
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/api${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            code: "HTTP_ERROR",
            message: `HTTP ${response.status}: ${response.statusText}`,
          },
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Failed to connect to API",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Analyze token for honeypot and security risks
   */
  async analyzeToken(
    address: string,
    chain?: string
  ): Promise<ApiResponse<HoneypotAnalysisResult>> {
    return this.makeRequest<HoneypotAnalysisResult>(
      "/v1/security/honeypot",
      "POST",
      {
        address,
        chain,
      }
    );
  }

  /**
   * Verify contract security and source code
   */
  async verifyContract(
    address: string,
    chain?: string
  ): Promise<ApiResponse<ContractVerificationResult>> {
    return this.makeRequest<ContractVerificationResult>(
      "/v1/security/contract",
      "POST",
      {
        address,
        chain,
      }
    );
  }

  /**
   * Get token pairs and liquidity information
   */
  async getTokenPairs(
    address: string,
    chain?: string
  ): Promise<ApiResponse<unknown>> {
    return this.makeRequest("/v1/tokens/pairs", "POST", {
      address,
      chain,
    });
  }

  /**
   * Get token holder information
   */
  async getTokenHolders(
    address: string,
    chain?: string
  ): Promise<ApiResponse<unknown>> {
    return this.makeRequest("/v1/tokens/holders", "POST", {
      address,
      chain,
    });
  }

  /**
   * Analyze wallet for security risks
   */
  async analyzeWallet(
    address: string,
    chain?: string
  ): Promise<ApiResponse<unknown>> {
    return this.makeRequest("/v1/wallets/analysis", "POST", {
      address,
      chain,
    });
  }
}

// Export singleton instance
export const internalApiClient = new InternalApiClient();

/**
 * Legacy compatibility functions that maintain the same interface
 * but now call our internal API instead of external services
 */

/**
 * Analyze token for honeypot (compatible with existing code)
 */
export async function analyzeTokenForHoneypot(
  address: string,
  chainId?: string
): Promise<HoneypotAnalysisResult> {
  // For internal use, we'll use demo API keys
  internalApiClient.setApiKey("demo_dev_key_456");

  const result = await internalApiClient.analyzeToken(address, chainId);

  if (!result.success) {
    throw new Error(result.error?.message || "Failed to analyze token");
  }

  return result.data!;
}

/**
 * Verify contract (compatible with existing code)
 */
export async function verifyTokenContract(
  address: string,
  chainId?: string
): Promise<ContractVerificationResult> {
  // For internal use, we'll use demo API keys
  internalApiClient.setApiKey("demo_dev_key_456");

  const result = await internalApiClient.verifyContract(address, chainId);

  if (!result.success) {
    throw new Error(result.error?.message || "Failed to verify contract");
  }

  return result.data!;
}

/**
 * Get token pairs (compatible with existing code)
 */
export async function getTokenPairsInternal(
  address: string,
  chainId?: string
): Promise<unknown> {
  internalApiClient.setApiKey("demo_dev_key_456");

  const result = await internalApiClient.getTokenPairs(address, chainId);

  if (!result.success) {
    throw new Error(result.error?.message || "Failed to get token pairs");
  }

  return result.data;
}

/**
 * Get token holders (compatible with existing code)
 */
export async function getTokenHoldersInternal(
  address: string,
  chainId?: string
): Promise<unknown> {
  internalApiClient.setApiKey("demo_dev_key_456");

  const result = await internalApiClient.getTokenHolders(address, chainId);

  if (!result.success) {
    throw new Error(result.error?.message || "Failed to get token holders");
  }

  return result.data;
}

/**
 * Public API client for external developers
 */
export class RugProofAiClient {
  private client: InternalApiClient;

  constructor(apiKey: string, baseUrl?: string) {
    this.client = new InternalApiClient(baseUrl);
    this.client.setApiKey(apiKey);
  }

  /**
   * Analyze a token for honeypot and security risks
   */
  async analyzeToken(address: string, options?: { chain?: string }) {
    return this.client.analyzeToken(address, options?.chain);
  }

  /**
   * Verify contract security and source code
   */
  async verifyContract(address: string, options?: { chain?: string }) {
    return this.client.verifyContract(address, options?.chain);
  }

  /**
   * Get token pairs and liquidity information
   */
  async getTokenPairs(address: string, options?: { chain?: string }) {
    return this.client.getTokenPairs(address, options?.chain);
  }

  /**
   * Get token holder information
   */
  async getTokenHolders(address: string, options?: { chain?: string }) {
    return this.client.getTokenHolders(address, options?.chain);
  }

  /**
   * Analyze wallet for security risks
   */
  async analyzeWallet(address: string, options?: { chain?: string }) {
    return this.client.analyzeWallet(address, options?.chain);
  }
}

export default RugProofAiClient;
