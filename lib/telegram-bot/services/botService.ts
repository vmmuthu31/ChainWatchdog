import { fetchWalletData } from "../../../lib/utils/fetchWalletData";
import {
  ContractCheckResult,
  HoneypotCheckResult,
  WalletScanResult,
} from "../types";
import { ChainInfo } from "@/lib/types";

const supportedChains: ChainInfo[] = [
  {
    id: "eth-mainnet",
    name: "Ethereum",
    explorer: "https://etherscan.io",
    type: "Mainnet",
    logoUrl: "https://www.datocms-assets.com/86369/1669653891-eth.svg",
    category: "EVM",
  },
  {
    id: "eth-sepolia",
    name: "Ethereum Sepolia",
    explorer: "https://sepolia.etherscan.io",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "eth-holesky",
    name: "Holesky Testnet",
    explorer: "https://holesky.etherscan.io",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "matic-mainnet",
    name: "Polygon",
    explorer: "https://polygonscan.com",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "polygon-amoy-testnet",
    name: "Polygon Amoy",
    explorer: "https://amoy.polygonscan.com",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "bsc-mainnet",
    name: "BNB Smart Chain",
    explorer: "https://bscscan.com",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "bsc-testnet",
    name: "BSC Testnet",
    explorer: "https://testnet.bscscan.com",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "optimism-mainnet",
    name: "Optimism",
    explorer: "https://optimistic.etherscan.io",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "optimism-sepolia",
    name: "Optimism Sepolia",
    explorer: "https://optimism-sepolia.blockscout.com",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "base-mainnet",
    name: "Base",
    explorer: "https://basescan.org",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "base-sepolia-testnet",
    name: "Base Sepolia",
    explorer: "https://base-sepolia.blockscout.com",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "gnosis-mainnet",
    name: "Gnosis",
    explorer: "https://gnosis.blockscout.com",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "gnosis-testnet",
    name: "Chiado Testnet",
    explorer: "https://gnosis-chiado.blockscout.com",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "btc-mainnet",
    name: "Bitcoin",
    explorer: "https://blockstream.info",
    type: "Mainnet",
    category: "Non-EVM",
  },
  {
    id: "solana-mainnet",
    name: "Solana",
    explorer: "https://explorer.solana.com",
    type: "Mainnet",
    category: "Non-EVM",
  },
  {
    id: "apechain-mainnet",
    name: "ApeChain",
    explorer: "https://apechain.calderaexplorer.xyz",
    type: "Mainnet",
    category: "Other",
  },
  {
    id: "apechain-testnet",
    name: "ApeChain Testnet",
    explorer: "https://apechain.calderaexplorer.xyz",
    type: "Testnet",
    category: "Other",
  },
  {
    id: "arbitrum-mainnet",
    name: "Arbitrum",
    explorer: "https://arbiscan.io",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    explorer: "https://sepolia.arbiscan.io",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "arbitrum-nova-mainnet",
    name: "Arbitrum Nova",
    explorer: "https://nova.arbiscan.io",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "avalanche-mainnet",
    name: "Avalanche C-Chain",
    explorer: "https://avascan.info/blockchain/c",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "avalanche-testnet",
    name: "Avalanche Fuji",
    explorer: "https://testnet.avascan.info",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "axie-mainnet",
    name: "Ronin",
    explorer: "https://explorer.roninchain.com",
    type: "Mainnet",
    category: "Other",
  },
  {
    id: "berachain-mainnet",
    name: "Berachain",
    explorer: "https://berascan.com",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "berachain-testnet",
    name: "Berachain Testnet",
    explorer: "https://bartio.beratrail.io",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "boba-mainnet",
    name: "Boba Ethereum",
    explorer: "https://bobascan.com",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "linea-mainnet",
    name: "Linea",
    explorer: "https://lineascan.build",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "linea-sepolia-testnet",
    name: "Linea Sepolia",
    explorer: "https://sepolia.lineascan.build",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "scroll-mainnet",
    name: "Scroll",
    explorer: "https://blockscout.scroll.io",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "scroll-sepolia-testnet",
    name: "Scroll Sepolia",
    explorer: "https://sepolia-blockscout.scroll.io",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "zksync-mainnet",
    name: "zkSync Era",
    explorer: "https://explorer.zksync.io",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "zksync-sepolia-testnet",
    name: "zkSync Sepolia",
    explorer: "https://sepolia.explorer.zksync.io",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "blast-mainnet",
    name: "Blast",
    explorer: "https://blastexplorer.io",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "mantle-mainnet",
    name: "Mantle",
    explorer: "https://explorer.mantle.xyz",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "mantle-sepolia-testnet",
    name: "Mantle Sepolia",
    explorer: "https://explorer.testnet.mantle.xyz",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "sei-mainnet",
    name: "Sei",
    explorer: "https://seistream.app",
    type: "Mainnet",
    category: "Non-EVM",
  },
  {
    id: "taiko-mainnet",
    name: "Taiko",
    explorer: "https://taikoscan.network",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "taiko-hekla-testnet",
    name: "Taiko Hekla",
    explorer: "https://explorer.hekla.taiko.xyz",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "fantom-mainnet",
    name: "Fantom",
    explorer: "https://ftmscan.com",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "fantom-testnet",
    name: "Fantom Testnet",
    explorer: "https://testnet.ftmscan.com",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "celo-mainnet",
    name: "Celo",
    explorer: "https://explorer.celo.org/mainnet",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "zora-mainnet",
    name: "Zora",
    explorer: "https://explorer.zora.energy",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "zora-sepolia-testnet",
    name: "Zora Sepolia",
    explorer: "https://sepolia.explorer.zora.energy",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "fraxtal-mainnet",
    name: "Fraxtal",
    explorer: "https://fraxscan.com",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "aurora-mainnet",
    name: "Aurora",
    explorer: "https://aurorascan.dev",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "aurora-testnet",
    name: "Aurora Testnet",
    explorer: "https://testnet.aurorascan.dev",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "avalanche-beam-mainnet",
    name: "Beam",
    explorer: "https://subnets.avax.network/beam",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "avalanche-beam-testnet",
    name: "Beam Testnet",
    explorer: "https://gaming.meritcircle.io",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "avalanche-dexalot-mainnet",
    name: "Dexalot",
    explorer: "https://subnets.avax.network/dexalot",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "avalanche-dexalot-testnet",
    name: "Dexalot Testnet",
    explorer: "https://subnets-test.avax.network/dexalot",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "avalanche-meld-mainnet",
    name: "MELDchain",
    explorer: "https://snowtrace.io",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "avalanche-meld-testnet",
    name: "MELDchain Testnet",
    explorer: "https://subnets-test.avax.network",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "avalanche-mirai-testnet",
    name: "Mirai Testnet",
    explorer: "https://testnet.avascan.info/blockchain/mirai",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "avalanche-numbers",
    name: "Numbers Protocol",
    explorer: "https://mainnet.num.network/overview",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "avalanche-shrapnel-mainnet",
    name: "Shrapnel",
    explorer: "https://subnets.avax.network/shrapnel",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "avalanche-shrapnel-testnet",
    name: "Shrapnel Testnet",
    explorer: "https://subnets-test.avax.network/shrapnel",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "avalanche-step-network",
    name: "Step Network",
    explorer: "https://stepscan.io",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "avalanche-uptn",
    name: "UPTN",
    explorer: "https://explorer.uptn.io",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "avalanche-xanachain",
    name: "XANA Chain",
    explorer: "https://avascan.info/blockchain/xana",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "bnb-opbnb-mainnet",
    name: "opBNB",
    explorer: "https://opbnbscan.com",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "bnb-opbnb-testnet",
    name: "opBNB Testnet",
    explorer: "https://mainnet.opbnbscan.com",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "canto-mainnet",
    name: "Canto",
    explorer: "https://evm.explorer.canto.io",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "covalent-internal-network-v1",
    name: "Covalent",
    explorer: "https://cqtscan.com",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "cronos-mainnet",
    name: "Cronos",
    explorer: "https://cronoscan.com",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "cronos-testnet",
    name: "Cronos Testnet",
    explorer: "https://testnet.cronoscan.com",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "cronos-zkevm-mainnet",
    name: "Cronos zkEVM",
    explorer: "https://explorer.zkevm.cronos.org",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "defi-kingdoms-mainnet",
    name: "DeFi Kingdoms",
    explorer: "https://subnets.avax.network/defi-kingdoms",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "defi-kingdoms-testnet",
    name: "DeFi Kingdoms Testnet",
    explorer: "https://subnets-test.avax.network/defi-kingdoms",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "emerald-paratime-mainnet",
    name: "Oasis Emerald",
    explorer: "https://explorer.emerald.oasis.dev",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "horizen-eon-mainnet",
    name: "Horizen EON",
    explorer: "https://eon-explorer.horizenlabs.io",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "horizen-gobi-testnet",
    name: "Horizen Gobi Testnet",
    explorer: "https://gobi-explorer.horizen.io",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "manta-sepolia-testnet",
    name: "Manta Pacific Testnet",
    explorer: "https://pacific-explorer.manta.network",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "merlin-mainnet",
    name: "Merlin",
    explorer: "https://scan.merlinchain.io",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "merlin-testnet",
    name: "Merlin Testnet",
    explorer: "https://testnet-scan.merlinchain.io",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "metis-mainnet",
    name: "Metis",
    explorer: "https://andromeda-explorer.metis.io",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "metis-stardust",
    name: "Metis Stardust",
    explorer: "",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "metis-testnet",
    name: "Metis Testnet",
    explorer: "https://goerli.explorer.metisdevops.link",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "moonbeam-mainnet",
    name: "Moonbeam",
    explorer: "https://moonscan.io",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "moonbeam-moonbase-alpha",
    name: "Moonbase Alpha Testnet",
    explorer: "https://moonbase-blockscout.testnet.moonbeam.network",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "moonbeam-moonriver",
    name: "Moonriver",
    explorer: "https://moonriver.moonscan.io",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "movement-mevm-testnet",
    name: "Movement MEVM Devnet",
    explorer: "https://explorer.testnet.m2.movement.org",
    type: "Testnet",
    category: "EVM",
  },
  {
    id: "polygon-zkevm-mainnet",
    name: "Polygon zkEVM",
    explorer: "https://zkevm.polygonscan.com",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "polygon-zkevm-cardona-testnet",
    name: "Polygon zkEVM Cardona",
    explorer: "https://cardona-zkevm.polygonscan.com",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "redstone-mainnet",
    name: "Redstone",
    explorer: "https://explorer.redstone.xyz",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "rollux-mainnet",
    name: "Rollux",
    explorer: "https://explorer.rollux.com",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "rollux-testnet",
    name: "Rollux Testnet",
    explorer: "https://rollux.tanenbaum.io",
    type: "Testnet",
    category: "Layer2",
  },
  {
    id: "sx-mainnet",
    name: "SX Network",
    explorer: "https://explorer.sx.technology",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "x1-mainnet",
    name: "X Layer",
    explorer: "https://www.okx.com/explorer/x1",
    type: "Mainnet",
    category: "Layer2",
  },
  {
    id: "zetachain-mainnet",
    name: "ZetaChain",
    explorer: "https://explorer.zetachain.com",
    type: "Mainnet",
    category: "EVM",
  },
  {
    id: "zetachain-testnet",
    name: "ZetaChain Testnet",
    explorer: "https://explorer.zetachain.com/testnet",
    type: "Testnet",
    category: "EVM",
  },
];
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
  if (!Array.isArray(supportedChains)) {
    console.error("supportedChains is not an array:", supportedChains);
    throw new Error("Internal server error: Chain validation failed");
  }

  try {
    const isSupportedChain = supportedChains.some(
      (chain) => chain && chain.id === chainId
    );

    if (!isSupportedChain) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
  } catch (error) {
    console.error("Error validating chain ID:", error);
    throw new Error(`Failed to validate chain ID: ${chainId}`);
  }
}

/**
 * Get supported chains
 */
export function getSupportedChains() {
  try {
    if (!Array.isArray(supportedChains)) {
      console.error(
        "supportedChains is not an array in getSupportedChains:",
        supportedChains
      );
      return [];
    }

    return supportedChains.map((chain) => ({
      id: chain.id,
      name: chain.name,
      type: chain.type,
      category: chain.category,
    }));
  } catch (error) {
    console.error("Error getting supported chains:", error);
    return [];
  }
}
