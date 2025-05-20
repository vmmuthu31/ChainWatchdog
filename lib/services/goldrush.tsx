"use client";
import { Chain, GoldRushClient } from "@covalenthq/client-sdk";
import { ChainInfo, GoldRushResponse } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let isERC20Spam: any = null;

type ConfidenceLevel = "YES" | "MAYBE";

if (typeof window === "undefined") {
  import("@covalenthq/goldrush-enhanced-spam-lists")
    .then((module) => {
      isERC20Spam = module.isERC20Spam;
    })
    .catch((error) => {
      console.error("Failed to import enhanced-spam-lists:", error);
    });
}

export const supportedChains: ChainInfo[] = [
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

export const getExplorerUrl = (
  chainId: string,
  tokenAddress: string
): string => {
  const chain = supportedChains.find((c) => c.id === chainId);
  if (!chain) return `https://etherscan.io/token/${tokenAddress}`;
  return `${chain.explorer}/token/${tokenAddress}`;
};

const checkTokenSpam = async (
  tokenAddress: string,
  chainId: string,
  confidenceLevel: ConfidenceLevel
): Promise<boolean> => {
  try {
    if (typeof isERC20Spam !== "function") {
      return false;
    }

    return await isERC20Spam(tokenAddress, chainId, confidenceLevel, true);
  } catch (error) {
    console.error(`Enhanced spam check error for ${tokenAddress}:`, error);
    return false;
  }
};

const GoldRushServices = (
  walletAddress: string,
  chainId: string = "eth-mainnet"
): Promise<GoldRushResponse> => {
  return fetchGoldRushData(walletAddress, chainId);
};

async function fetchGoldRushData(
  walletAddress: string,
  chainId: string
): Promise<GoldRushResponse> {
  const client = new GoldRushClient(
    process.env.NEXT_PUBLIC_GOLDRUSH_API_KEY || ""
  );

  try {
    const response =
      await client.BalanceService.getTokenBalancesForWalletAddress(
        chainId as Chain,
        walletAddress
      );

    if (!response.error) {
      const enhancedResponse = response as unknown as GoldRushResponse;

      await Promise.all(
        enhancedResponse.data.items.map(async (token) => {
          try {
            if (token.is_spam) {
              token.spamConfidence = "YES";
              token.spamScore = "High";
              return;
            }

            if (typeof isERC20Spam === "function") {
              const isDefiniteSpam = await checkTokenSpam(
                token.contract_address,
                chainId,
                "YES"
              );

              if (isDefiniteSpam) {
                token.is_spam = true;
                token.spamConfidence = "YES";
                token.spamScore = "High";
                return;
              }

              const isPotentialSpam = await checkTokenSpam(
                token.contract_address,
                chainId,
                "MAYBE"
              );

              if (isPotentialSpam) {
                token.spamConfidence = "MAYBE";
                token.spamScore = "Medium";
                return;
              }
            }

            if (token.type === "dust" || parseFloat(token.balance) === 0) {
              token.spamConfidence = "MAYBE";
              token.spamScore = "Medium";
            } else {
              token.spamConfidence = "NO";
              token.spamScore = "Low";
            }
          } catch (error) {
            console.error(
              `Error checking token ${token.contract_address}:`,
              error
            );
            if (token.type === "dust" || parseFloat(token.balance) === 0) {
              token.spamConfidence = "MAYBE";
              token.spamScore = "Medium";
            } else {
              token.spamConfidence = "NO";
              token.spamScore = "Low";
            }
          }
        })
      );

      return enhancedResponse;
    } else {
      throw new Error(
        response.error_message || "Failed to fetch token balances"
      );
    }
  } catch (error) {
    throw error;
  }
}

export default GoldRushServices;
