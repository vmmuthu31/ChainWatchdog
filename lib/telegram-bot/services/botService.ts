import { fetchWalletData } from "../../../lib/utils/fetchWalletData";
import { supportedChains } from "../../../lib/services/goldrush";
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
    validateChainId(chainId);

    const walletData = await fetchWalletData(walletAddress, chainId);

    const totalTokens = walletData.data.items.length;
    const spamTokensCount = walletData.data.items.filter(
      (t) => t.is_spam
    ).length;
    const safeTokensCount = totalTokens - spamTokensCount;

    const tokens = walletData.data.items.map((token) => {
      const balance = token.balance || "0";
      const decimals = token.contract_decimals || 18;
      const numericBalance = parseFloat(balance) / Math.pow(10, decimals);

      let formattedBalance;
      if (numericBalance < 0.000001) {
        formattedBalance = numericBalance.toExponential(4);
      } else if (numericBalance < 0.01) {
        formattedBalance = numericBalance.toFixed(6);
      } else if (numericBalance < 1000) {
        formattedBalance = numericBalance.toFixed(4);
      } else {
        formattedBalance = numericBalance.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        });
      }

      return {
        name: token.contract_name || "Unknown Token",
        symbol: token.contract_ticker_symbol || "???",
        balance: balance,
        formattedBalance: formattedBalance,
        value: token.quote || 0,
        isSpam: token.is_spam || false,
        contractAddress: token.contract_address,
      };
    });

    const totalValue = tokens.reduce(
      (sum, token) => sum + (token.value || 0),
      0
    );

    return {
      address: walletAddress,
      chainId,
      spamTokensCount,
      safeTokensCount,
      totalTokens,
      totalValue,
      tokens,
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
    validateChainId(chainId);

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
    const { analyzeSolanaTokenForHoneypot } = await import(
      "../../../lib/services/solanaScan"
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
    try {
      const response = await fetch(
        `https://api.honeypot.is/v2/IsHoneypot?address=${contractAddress}&chainID=${chainId}`
      );

      if (response.ok) {
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
      }
    } catch (honeypotApiError) {
      console.log(
        "Honeypot.is API error, falling back to internal implementation:",
        honeypotApiError
      );
    }

    console.log("Using internal honeypot detection for", contractAddress);

    try {
      const { fetchTokenInfo, performBasicRiskCheck } = await import(
        "../../../lib/utils/fetchTokenInfo"
      );

      const tokenInfo = await fetchTokenInfo(contractAddress, chainId);

      const riskCheck = await performBasicRiskCheck(contractAddress, chainId);

      return {
        address: contractAddress,
        chainId,
        isHoneypot: riskCheck.isHighRisk,
        honeypotReason:
          riskCheck.reason ||
          "Analysis complete. No critical issues detected, but exercise caution.",
        buyTax: riskCheck.buyTax !== undefined ? riskCheck.buyTax : 0,
        sellTax: riskCheck.sellTax !== undefined ? riskCheck.sellTax : 0,
        tokenName: tokenInfo.name,
        tokenSymbol: tokenInfo.symbol,
      };
    } catch (fallbackError) {
      console.error("Error in fallback token analysis:", fallbackError);
      throw new Error(
        "Could not analyze token with internal honeypot detection"
      );
    }
  } catch (error) {
    console.error("Error checking EVM honeypot:", error);
    throw new Error(
      `Failed to check EVM token: ${
        (error as Error).message || "Unknown error"
      }`
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
    validateChainId(chainId);

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
    const { getSolanaTokenContractVerification } = await import(
      "../../../lib/services/rugCheckService"
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
      isContract: true,
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
    category: chain.category,
  }));
}
