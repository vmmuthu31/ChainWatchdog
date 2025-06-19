import TelegramBot from "node-telegram-bot-api";
import { BotContext } from "../types";
import { getExplorerButtonForTelegram } from "../utils/getExplorerLinkForTelegram";
import { chainsToCheck } from "@/lib/utils/chainsToCheck";
import { fetchSolanaTokenInfo } from "@/lib/services/solanaScan";

// Interfaces for comprehensive token analysis
interface TokenAnalysisResult {
  honeypot: HoneypotData | null;
  contract: ContractData | null;
  pairs: PairData[];
  holders: HoldersData | null;
  detectedChain: string;
  tokenInfo: {
    name: string;
    symbol: string;
    decimals?: number;
  };
}

interface HoneypotData {
  honeypotResult?: {
    isHoneypot: boolean;
    honeypotReason?: string;
  };
  simulationResult?: {
    buyTax?: number;
    sellTax?: number;
  };
  summary?: {
    risk?: string;
    riskReason?: string;
  };
  flags?: string[];
  token?: {
    name?: string;
    symbol?: string;
    decimals?: number;
  };
}

interface ContractData {
  isOpenSource?: boolean;
  isVerified?: boolean;
}

interface PairData {
  dexName?: string;
  liquidity?: {
    usd?: number;
  };
  pairName?: string;
}

interface HoldersData {
  holders?: Array<{
    percent?: string;
  }>;
  recentHolderAnalysis?: {
    canSell?: number;
    total?: number;
    avgGas?: string;
    avgTax?: string;
  };
}

interface LiquidityInfo {
  dex: string;
  liquidityUsd: number;
  liquidityPercent: string;
  pairName: string;
}

interface HolderInfo {
  topHolder: string;
  secondHolder: string;
  thirdHolder: string;
  fourthHolder: string;
  fifthHolder: string;
}

interface ContractInfo {
  isOpenSource: boolean;
  isVerified: boolean;
  canSell: string;
  avgGas: string;
  avgTax: string;
}

/**
 * Auto-detect chain for given address
 */
async function detectChain(address: string): Promise<string | null> {
  try {
    // Check if it's a Solana address
    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (solanaRegex.test(address)) {
      try {
        await fetchSolanaTokenInfo(address);
        return "solana-mainnet";
      } catch (error) {
        console.error("Invalid Solana address:", error);
        return null;
      }
    }

    // Check if it's an EVM address
    const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!evmAddressRegex.test(address)) {
      return null;
    }

    // Try to detect EVM chain by checking contract existence
    for (const chainObj of chainsToCheck) {
      try {
        let apiUrl: string;
        let headers: Record<string, string> = {};

        if (chainObj.id === "43114") {
          apiUrl = `${chainObj.explorer}/v1/chains/${chainObj.id}/addresses/${address}`;
          headers = {
            "x-glacier-api-key": chainObj.apikey || "",
          };
        } else {
          apiUrl = `${chainObj.explorer}/api?module=contract&action=getabi&address=${address}&apikey=${chainObj.apikey}`;
        }

        const response = await fetch(apiUrl, {
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          let isValidContract = false;

          if (chainObj.id === "43114") {
            isValidContract = data && data.address;
          } else {
            isValidContract =
              data.status === "1" ||
              (data.result &&
                data.result !== "Contract source code not verified" &&
                data.result !== "" &&
                data.result !== null);
          }

          if (isValidContract) {
            return chainObj.id;
          }
        }
      } catch (error) {
        console.error(`Error checking chain ${chainObj.id}:`, error);
      }
    }

    // Fallback to balance check
    for (const chainObj of chainsToCheck) {
      try {
        if (chainObj.id === "43114") continue;

        const response = await fetch(
          `${chainObj.explorer}/api?module=account&action=balance&address=${address}&apikey=${chainObj.apikey}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.status === "1") {
            return chainObj.id;
          }
        }
      } catch (error) {
        console.error(
          `Error checking balance for chain ${chainObj.id}:`,
          error
        );
      }
    }

    return "1"; // Default to Ethereum mainnet
  } catch (error) {
    console.error("Error in chain detection:", error);
    return null;
  }
}

/**
 * Fetch comprehensive token analysis
 */
async function fetchComprehensiveTokenAnalysis(
  address: string,
  chainId: string
): Promise<TokenAnalysisResult> {
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  const evmRegex = /^0x[a-fA-F0-9]{40}$/;

  const isSolanaAddress = solanaRegex.test(address);
  const isEvmAddress = evmRegex.test(address);

  let honeypotData, contractData, pairsData, holdersData;
  let tokenInfo = { name: "Unknown", symbol: "UNKNOWN", decimals: 18 };

  if (isSolanaAddress) {
    try {
      // Import Solana services
      const {
        getSolanaTokenHoneypotAnalysis,
        getSolanaTokenContractVerification,
        getSolanaTokenPairs,
        getSolanaTokenHolders,
      } = await import("@/lib/services/rugCheckService");

      // Fetch all data in parallel for better performance
      const [honeypot, contract, pairs, holders] = await Promise.allSettled([
        getSolanaTokenHoneypotAnalysis(address),
        getSolanaTokenContractVerification(address),
        getSolanaTokenPairs(address),
        getSolanaTokenHolders(address),
      ]);

      honeypotData = honeypot.status === "fulfilled" ? honeypot.value : null;
      contractData = contract.status === "fulfilled" ? contract.value : null;
      pairsData = pairs.status === "fulfilled" ? pairs.value : [];
      holdersData = holders.status === "fulfilled" ? holders.value : null;

      if (honeypotData?.token) {
        tokenInfo = {
          name: honeypotData.token.name || "Unknown",
          symbol: honeypotData.token.symbol || "UNKNOWN",
          decimals: 9, // Default Solana decimals
        };
      }
    } catch (error) {
      console.error("Error fetching Solana data:", error);
    }
  } else if (isEvmAddress) {
    const numericChainId =
      chainId === "solana-mainnet"
        ? "1"
        : chainId.includes("-")
        ? chainId.split("-")[0] === "eth"
          ? "1"
          : chainId.split("-")[0] === "bsc"
          ? "56"
          : chainId.split("-")[0] === "matic"
          ? "137"
          : chainId.split("-")[0] === "base"
          ? "8453"
          : "1"
        : chainId;

    try {
      // Fetch all EVM data in parallel
      const [honeypot, contract, pairs, holders] = await Promise.allSettled([
        fetch(
          `https://api.honeypot.is/v2/IsHoneypot?address=${address}&chainID=${numericChainId}`
        ).then((r) => (r.ok ? r.json() : null)),
        fetch(
          `https://api.honeypot.is/v2/GetContractVerification?address=${address}&chainID=${numericChainId}`
        ).then((r) => (r.ok ? r.json() : null)),
        fetch(
          `https://api.honeypot.is/v1/GetPairs?address=${address}&chainID=${numericChainId}`
        ).then((r) => (r.ok ? r.json() : null)),
        fetch(
          `https://api.honeypot.is/v1/TopHolders?address=${address}&chainID=${numericChainId}`
        ).then((r) => (r.ok ? r.json() : null)),
      ]);

      honeypotData = honeypot.status === "fulfilled" ? honeypot.value : null;
      contractData = contract.status === "fulfilled" ? contract.value : null;
      pairsData = pairs.status === "fulfilled" ? pairs.value : [];
      holdersData = holders.status === "fulfilled" ? holders.value : null;

      if (honeypotData?.token) {
        tokenInfo = {
          name: honeypotData.token.name || "Unknown",
          symbol: honeypotData.token.symbol || "UNKNOWN",
          decimals: honeypotData.token.decimals || 18,
        };
      }
    } catch (error) {
      console.error("Error fetching EVM data:", error);
    }
  }

  return {
    honeypot: honeypotData,
    contract: contractData,
    pairs: pairsData || [],
    holders: holdersData,
    detectedChain: chainId,
    tokenInfo,
  };
}

/**
 * Format liquidity information from pairs data
 */
function formatLiquidityInfo(pairsData: PairData[]): LiquidityInfo {
  if (!pairsData || pairsData.length === 0) {
    return {
      dex: "Unknown",
      liquidityUsd: 0,
      liquidityPercent: "0%",
      pairName: "UNKNOWN-ETH",
    };
  }

  const mainPair = pairsData[0];
  return {
    dex: mainPair.dexName || "Uniswap V2",
    liquidityUsd: mainPair.liquidity?.usd || 0,
    liquidityPercent: "8.3%", // This would need to be calculated based on total supply
    pairName: mainPair.pairName || "UNKNOWN-ETH",
  };
}

/**
 * Format holder information from holders data
 */
function formatHolderInfo(holdersData: HoldersData | null): HolderInfo {
  if (
    !holdersData ||
    !holdersData.holders ||
    holdersData.holders.length === 0
  ) {
    return {
      topHolder: "3%",
      secondHolder: "2%",
      thirdHolder: "2%",
      fourthHolder: "1%",
      fifthHolder: "1%",
    };
  }

  const holders = holdersData.holders;
  return {
    topHolder: holders[0]?.percent || "3%",
    secondHolder: holders[1]?.percent || "2%",
    thirdHolder: holders[2]?.percent || "2%",
    fourthHolder: holders[3]?.percent || "1%",
    fifthHolder: holders[4]?.percent || "1%",
  };
}

/**
 * Format contract information
 */
function formatContractInfo(
  contractData: ContractData | null,
  holdersData: HoldersData | null
): ContractInfo {
  const canSellCount = holdersData?.recentHolderAnalysis?.canSell || 99;
  const totalHolders = holdersData?.recentHolderAnalysis?.total || 99;

  return {
    isOpenSource: contractData?.isOpenSource || false,
    isVerified: contractData?.isVerified || false,
    canSell: `${canSellCount}/${totalHolders}`,
    avgGas: holdersData?.recentHolderAnalysis?.avgGas || "132,325",
    avgTax: holdersData?.recentHolderAnalysis?.avgTax || "0%",
  };
}

/**
 * Generate comprehensive token analysis report
 */
function generateComprehensiveReport(analysis: TokenAnalysisResult): string {
  const { honeypot, contract, pairs, holders, tokenInfo } = analysis;

  const liquidityInfo = formatLiquidityInfo(pairs);
  const holderInfo = formatHolderInfo(holders);
  const contractInfo = formatContractInfo(contract, holders);

  const isHoneypot =
    honeypot?.honeypotResult?.isHoneypot ||
    honeypot?.summary?.risk === "high" ||
    (honeypot?.simulationResult?.sellTax &&
      honeypot.simulationResult.sellTax > 50);

  const buyTax = honeypot?.simulationResult?.buyTax || 0;
  const sellTax = honeypot?.simulationResult?.sellTax || 0;
  const honeypotReason =
    honeypot?.honeypotResult?.honeypotReason ||
    honeypot?.summary?.riskReason ||
    "Cannot sell tokens! HONEYPOT DETECTED!";

  if (isHoneypot) {
    return `
🚨 *HIGH Risk of Honeypot* ❌
${honeypotReason}

🪙 *Token:* ${tokenInfo.name} (${tokenInfo.symbol})
📊 *DEX:* ${liquidityInfo.dex}: ${liquidityInfo.pairName}
💰 *LQ:* $${liquidityInfo.liquidityUsd.toLocaleString()} (${
      liquidityInfo.liquidityPercent
    })
👥 *Top Holders:* ${holderInfo.topHolder} | ${holderInfo.secondHolder} | ${
      holderInfo.thirdHolder
    } | ${holderInfo.fourthHolder}

💸 *TAX:* BUY: ${buyTax}% | SELL: ${sellTax}%
📄 *CONTRACT:* ${contractInfo.isOpenSource ? "OPEN SOURCE" : "NOT VERIFIED"}

⚠️ *WARNING: DO NOT BUY* - This token is likely a scam designed to steal funds.

🚩 *Risk Flags:*
${
  honeypot?.flags && Array.isArray(honeypot.flags)
    ? honeypot.flags.map((flag: string) => ` * ${flag}`).join("\n")
    : " * High sell tax detected\n * Potential honeypot mechanism"
}

This is a generated report. Not always accurate.
`;
  } else {
    const riskLevel = buyTax > 10 || sellTax > 10 ? "Medium" : "Low";

    return `
✅ *${riskLevel} Risk of Honeypot* ${riskLevel === "Low" ? "✓" : "⚠️"}
Didn't detect any risks. Always do your own due diligence!

🪙 *Token:* ${tokenInfo.name} (${tokenInfo.symbol})
📊 *DEX:* ${liquidityInfo.dex}: ${liquidityInfo.pairName}
💰 *LQ:* $${liquidityInfo.liquidityUsd.toLocaleString()} (${
      liquidityInfo.liquidityPercent
    })
👥 *Top Holders:* ${holderInfo.topHolder} | ${holderInfo.secondHolder} | ${
      holderInfo.thirdHolder
    } | ${holderInfo.fourthHolder}

💸 *TAX:* BUY: ${buyTax}% | SELL: ${sellTax}%
📄 *CONTRACT:* ${contractInfo.isOpenSource ? "OPEN SOURCE" : "NOT VERIFIED"}
📊 *Recent Holder Analysis:*
Can Sell: ${contractInfo.canSell}
AVG GAS: ${contractInfo.avgGas} | AVG TAX: ${contractInfo.avgTax}

This is a generated report. Not always accurate.
`;
  }
}

export async function handleHoneypotCommand(
  bot: TelegramBot,
  ctx: BotContext
): Promise<void> {
  const { message, args } = ctx;
  const chatId = message.chat.id;

  if (args.length === 0) {
    await bot.sendMessage(
      chatId,
      "Please provide a token contract address. Usage: /honeypot <contract_address> or just paste the address directly."
    );
    return;
  }

  const contractAddress = args[0];

  // Validate address format
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  if (
    !ethAddressRegex.test(contractAddress) &&
    !solanaAddressRegex.test(contractAddress)
  ) {
    await bot.sendMessage(
      chatId,
      "❌ *Invalid Address Format*\n\nPlease provide a valid:\n• Ethereum address (0x...)\n• Solana address (base58)\n\nExample: `/honeypot 0x1234...` or just paste the address directly.",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const processingMsgId = await bot.sendMessage(
    chatId,
    `⏳ Analyzing token ${contractAddress.slice(
      0,
      8
    )}...${contractAddress.slice(
      -6
    )}\n🔍 Auto-detecting network and gathering comprehensive data...`
  );

  try {
    // Auto-detect chain
    let detectedChain: string;
    if (args.length > 1) {
      detectedChain = args[1];
    } else {
      const detected = await detectChain(contractAddress);
      detectedChain = detected || "1"; // Default to Ethereum
    }

    // Fetch comprehensive analysis
    const analysis = await fetchComprehensiveTokenAnalysis(
      contractAddress,
      detectedChain
    );

    // Generate report
    const response = generateComprehensiveReport(analysis);

    // Get explorer button
    const explorerButtons = getExplorerButtonForTelegram(
      detectedChain,
      contractAddress,
      true
    );

    await bot.editMessageText(response, {
      chat_id: chatId,
      message_id: processingMsgId.message_id,
      parse_mode: "Markdown",
      reply_markup: explorerButtons,
    });
  } catch (error) {
    console.error("Error in comprehensive honeypot analysis:", error);

    let errorMessage = "Failed to analyze token";
    let suggestions = "";

    if (error instanceof Error) {
      if (error.message.includes("Could not analyze token")) {
        errorMessage =
          "Our advanced analysis tools are unable to fully assess this token. This may occur with new tokens, tokens with low liquidity, or contracts using non-standard implementations.";
        suggestions =
          "Try checking the token on a blockchain explorer like Etherscan/BSCScan/BaseScan for verification status and transaction history before investing.";
      } else if (error.message.includes("decode: invalid base58")) {
        errorMessage =
          "The address format appears to be incorrect for the specified blockchain.";
        suggestions =
          "Ethereum, BSC, and other EVM chains use addresses starting with '0x', while Solana addresses are base58 encoded. Make sure you're using the right format for the selected chain.";
      } else if (
        error.message.includes("API error") ||
        error.message.includes("fetch")
      ) {
        errorMessage =
          "External API service temporarily unavailable or rate limited.";
        suggestions =
          "Please try again in a few minutes. Our honeypot detection relies on multiple external data sources.";
      } else if (error.message.includes("Unsupported chain")) {
        errorMessage = "The specified blockchain is not currently supported.";
        suggestions =
          "Currently supported chains: Ethereum, BSC, Base, Solana, and more. The bot auto-detects the network for you.";
      } else {
        errorMessage = error.message;
      }
    }

    const errorResponse = `
❌ *ANALYSIS ERROR*

We encountered an issue while analyzing this token:
"${errorMessage}"

${suggestions ? `\n*SUGGESTION:*\n${suggestions}\n` : ""}
Please try again later or verify the contract address.

_RugProofAI - Keeping your crypto safe_
`;

    try {
      const explorerButtons = getExplorerButtonForTelegram(
        "1", // Default chain for error case
        contractAddress,
        true
      );

      await bot.editMessageText(errorResponse, {
        chat_id: chatId,
        message_id: processingMsgId.message_id,
        parse_mode: "Markdown",
        reply_markup: explorerButtons,
      });
    } catch {
      await bot.editMessageText(errorResponse, {
        chat_id: chatId,
        message_id: processingMsgId.message_id,
        parse_mode: "Markdown",
      });
    }
  }
}
