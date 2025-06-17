import fetchWalletData from "../../services/goldrush";
import { supportedChains } from "../../services/goldrush";
import {
  ContractCheckResult,
  HoneypotCheckResult,
  WalletScanResult,
} from "../types";

/**
 * Scan a wallet for tokens and analyze them for spam
 */
export async function scanWallet(
  walletAddress: string,
  chainId: string = "eth-mainnet"
): Promise<WalletScanResult> {
  try {
    // Validate chain ID
    validateChainId(chainId);

    // Fetch wallet data
    const walletData = await fetchWalletData(walletAddress, chainId);

    // Count tokens
    const totalTokens = walletData.data.items.length;
    const spamTokensCount = walletData.data.items.filter(
      (t) => t.is_spam
    ).length;
    const safeTokensCount = totalTokens - spamTokensCount;

    return {
      address: walletAddress,
      chainId,
      spamTokensCount,
      safeTokensCount,
      totalTokens,
    };
  } catch (error) {
    console.error("Error scanning wallet:", error);
    throw new Error(
      `Failed to scan wallet: ${(error as Error).message || "Unknown error"}`
    );
  }
}

/**
 * Check if a contract is a honeypot
 */
export async function checkHoneypot(
  contractAddress: string,
  chainId: string = "eth-mainnet"
): Promise<HoneypotCheckResult> {
  try {
    // Validate chain ID
    validateChainId(chainId);

    // Convert chain to format needed by API
    const apiChainId = convertChainForAPI(chainId);

    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    const evmRegex = /^0x[a-fA-F0-9]{40}$/;

    const isSolanaAddress = solanaRegex.test(contractAddress);
    const isEvmAddress = evmRegex.test(contractAddress);

    if (isSolanaAddress) {
      return await checkSolanaHoneypot(contractAddress);
    }

    if (isEvmAddress) {
      return await checkEvmHoneypot(contractAddress, apiChainId);
    }

    throw new Error("Invalid contract address format");
  } catch (error) {
    console.error("Error checking honeypot:", error);
    throw new Error(
      `Failed to check honeypot: ${(error as Error).message || "Unknown error"}`
    );
  }
}

/**
 * Convert internal chain ID to API format
 */
function convertChainForAPI(chainId: string): string {
  // Map common chains to their API ID format
  const chainMapping: Record<string, string> = {
    "eth-mainnet": "1",
    "bsc-mainnet": "56",
    "matic-mainnet": "137",
    "optimism-mainnet": "10",
    "base-mainnet": "8453",
    "arbitrum-mainnet": "42161",
    "avalanche-mainnet": "43114",
  };

  return chainMapping[chainId] || chainId;
}

/**
 * Check Solana token for honeypot
 */
async function checkSolanaHoneypot(
  contractAddress: string
): Promise<HoneypotCheckResult> {
  try {
    // Import here to avoid circular dependencies
    const { analyzeSolanaTokenForHoneypot } = await import(
      "@/lib/services/solanaScan"
    );
    const solanaResult = await analyzeSolanaTokenForHoneypot(contractAddress);

    return {
      address: contractAddress,
      chainId: "solana-mainnet",
      isHoneypot: solanaResult.honeypotResult?.isHoneypot || false,
      honeypotReason: solanaResult.honeypotResult?.honeypotReason,
      buyTax: solanaResult.simulationResult.buyTax,
      sellTax: solanaResult.simulationResult.sellTax,
      tokenName: solanaResult.token.name,
      tokenSymbol: solanaResult.token.symbol,
    };
  } catch (error) {
    console.error("Error checking Solana honeypot:", error);
    throw new Error(
      `Failed to check Solana token: ${
        (error as Error).message || "Unknown error"
      }`
    );
  }
}

/**
 * Check EVM token for honeypot
 */
async function checkEvmHoneypot(
  contractAddress: string,
  chainId: string
): Promise<HoneypotCheckResult> {
  try {
    const response = await fetch(
      `https://api.honeypot.is/v2/IsHoneypot?address=${contractAddress}&chainID=${chainId}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();

    return {
      address: contractAddress,
      chainId,
      isHoneypot: data.honeypotResult?.isHoneypot || false,
      honeypotReason: data.honeypotResult?.honeypotReason,
      buyTax: data.simulationResult?.buyTax,
      sellTax: data.simulationResult?.sellTax,
      tokenName: data.token?.name,
      tokenSymbol: data.token?.symbol,
    };
  } catch (error) {
    console.error("Error checking EVM honeypot:", error);
    throw new Error(
      `Failed to check token: ${(error as Error).message || "Unknown error"}`
    );
  }
}

/**
 * Check contract details
 */
export async function checkContract(
  contractAddress: string,
  chainId: string = "eth-mainnet"
): Promise<ContractCheckResult> {
  try {
    // Validate chain ID
    validateChainId(chainId);

    // Convert chain to format needed by API
    const apiChainId = convertChainForAPI(chainId);

    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    const evmRegex = /^0x[a-fA-F0-9]{40}$/;

    const isSolanaAddress = solanaRegex.test(contractAddress);
    const isEvmAddress = evmRegex.test(contractAddress);

    if (isSolanaAddress) {
      return await checkSolanaContract(contractAddress);
    }

    if (isEvmAddress) {
      return await checkEvmContract(contractAddress, apiChainId);
    }

    throw new Error("Invalid contract address format");
  } catch (error) {
    console.error("Error checking contract:", error);
    throw new Error(
      `Failed to check contract: ${(error as Error).message || "Unknown error"}`
    );
  }
}

/**
 * Check Solana contract
 */
async function checkSolanaContract(
  contractAddress: string
): Promise<ContractCheckResult> {
  try {
    // Import here to avoid circular dependencies
    const { getSolanaTokenContractVerification } = await import(
      "@/lib/services/rugCheckService"
    );
    const contractData = await getSolanaTokenContractVerification(
      contractAddress
    );

    return {
      address: contractAddress,
      chainId: "solana-mainnet",
      isContract: contractData.isContract || false,
      isOpenSource: contractData.isRootOpenSource || false,
      hasProxyCalls: contractData.summary?.hasProxyCalls,
      securityRisks: {
        hasMintAuthority: contractData.securityRisks?.hasMintAuthority || false,
        hasFreezeAuthority:
          contractData.securityRisks?.hasFreezeAuthority || false,
        isMutable: contractData.securityRisks?.isMutable || false,
        hasTransferFee: contractData.securityRisks?.hasTransferFee || false,
      },
    };
  } catch (error) {
    console.error("Error checking Solana contract:", error);
    throw new Error(
      `Failed to check Solana contract: ${
        (error as Error).message || "Unknown error"
      }`
    );
  }
}

/**
 * Check EVM contract
 */
async function checkEvmContract(
  contractAddress: string,
  chainId: string
): Promise<ContractCheckResult> {
  try {
    const response = await fetch(
      `https://api.honeypot.is/v2/GetContractVerification?address=${contractAddress}&chainID=${chainId}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();

    return {
      address: contractAddress,
      chainId,
      isContract: true, // If we got a response, it's a contract
      isOpenSource: data.isRootOpenSource || false,
      hasProxyCalls: data.summary?.hasProxyCalls || false,
      securityRisks: {
        hasMintAuthority: data.securityRisks?.hasMintAuthority || false,
        hasFreezeAuthority: data.securityRisks?.hasFreezeAuthority || false,
        isMutable: data.securityRisks?.isMutable || false,
        hasTransferFee: data.securityRisks?.hasTransferFee || false,
      },
    };
  } catch (error) {
    console.error("Error checking EVM contract:", error);
    throw new Error(
      `Failed to check contract: ${(error as Error).message || "Unknown error"}`
    );
  }
}

/**
 * Validate that the chain ID is supported
 */
function validateChainId(chainId: string): void {
  const isSupportedChain = supportedChains.some(
    (chain) => chain.id === chainId
  );
  if (!isSupportedChain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}

/**
 * Get supported chains
 */
export function getSupportedChains() {
  return supportedChains.map((chain) => ({
    id: chain.id,
    name: chain.name,
    type: chain.type,
  }));
}
