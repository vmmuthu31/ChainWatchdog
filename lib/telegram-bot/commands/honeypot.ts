import TelegramBot from "node-telegram-bot-api";
import {
  BotContext,
  ContractData,
  ContractInfo,
  HoldersData,
  HoneypotData,
  LiquidityInfo,
  PairData,
  TokenAnalysisResult,
} from "../types";
import { getExplorerButtonForTelegram } from "../utils/getExplorerLinkForTelegram";
import { chainsToCheck } from "../../utils/chainsToCheck";
import { fetchSolanaTokenInfo } from "../../services/solanaScan";

/**
 * Format percentage with proper rounding
 */
function formatPercentage(num: number | string | undefined): string {
  if (num === undefined || num === null) return "0%";
  const number = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(number)) return "0%";
  return `${Math.round(number * 100) / 100}%`;
}

/**
 * Format large numbers with commas
 */
function formatLargeNumber(num: number | string | undefined): string {
  if (num === undefined || num === null) return "0";
  const number = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(number)) return "0";
  return number.toLocaleString();
}

/**
 * Auto-detect chain for given address
 */
async function detectChain(address: string): Promise<string | null> {
  try {
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

    const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!evmAddressRegex.test(address)) {
      return null;
    }

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

    return "1";
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
      const {
        getSolanaTokenHoneypotAnalysis,
        getSolanaTokenContractVerification,
        getSolanaTokenPairs,
        getSolanaTokenHolders,
      } = await import("../../services/rugCheckService");

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
          decimals: 9,
        };
      }
    } catch (error) {
      console.error("Error fetching Solana data:", error);
    }
  } else if (isEvmAddress) {
    const numericChainId = chainId === "solana-mainnet" ? "1" : chainId;

    try {
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
      } else {
        console.info(
          "Honeypot API failed:",
          honeypotResponse.status === "fulfilled"
            ? honeypotResponse.value.status
            : "Promise rejected"
        );
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
        const holdersJson = await holdersResponse.value.json();

        if (holdersJson && (holdersJson.holders || holdersJson.topHolders)) {
          holdersData = {
            holders: holdersJson.holders || holdersJson.topHolders,
            totalHolders:
              holdersJson.totalHolders ||
              holdersJson.holders?.length ||
              holdersJson.topHolders?.length ||
              0,
          };
        } else if (Array.isArray(holdersJson)) {
          holdersData = {
            holders: holdersJson,
            totalHolders: holdersJson.length,
          };
        } else {
          holdersData = holdersJson;
        }

        const totalSupply =
          honeypotData?.token?.totalSupply ||
          honeypotData?.totalSupply ||
          honeypotData?.token?.supply ||
          honeypotData?.supply ||
          honeypotData?.circulatingSupply;

        if (holdersData && holdersData.holders && totalSupply) {
          holdersData.holders = holdersData.holders.map(
            (holder: {
              address?: string;
              balance?: string;
              percent?: string;
              percentage?: string;
              share?: number;
              amount?: string;
              supply?: string;
              [key: string]: unknown;
            }) => {
              let percent = "N/A";

              if (holder.percent) {
                percent = holder.percent.includes("%")
                  ? holder.percent
                  : `${holder.percent}%`;
              } else if (holder.percentage) {
                percent = holder.percentage.includes("%")
                  ? holder.percentage
                  : `${holder.percentage}%`;
              } else if (holder.share) {
                percent = `${holder.share}%`;
              } else if (holder.balance && totalSupply) {
                const percentage = (
                  (parseFloat(holder.balance) / parseFloat(totalSupply)) *
                  100
                ).toFixed(1);
                percent = `${percentage}%`;
              } else if (holder.amount && holder.supply) {
                const percentage = (
                  (parseFloat(holder.amount) / parseFloat(holder.supply)) *
                  100
                ).toFixed(1);
                percent = `${percentage}%`;
              }

              return {
                ...holder,
                percent: percent,
                percentage: percent.replace("%", ""),
              };
            }
          );
        } else if (holdersData && holdersData.holders) {
          const balances = holdersData.holders
            .map((h: { balance?: string }) => parseFloat(h.balance || "0"))
            .filter((b: number) => b > 0);

          const totalBalance = balances.reduce(
            (sum: number, balance: number) => sum + balance,
            0
          );

          if (totalBalance > 0) {
            holdersData.holders = holdersData.holders.map(
              (holder: { balance?: string; [key: string]: unknown }) => {
                const balance = parseFloat(holder.balance || "0");
                const percentage =
                  totalBalance > 0
                    ? ((balance / totalBalance) * 100).toFixed(1)
                    : "0";

                return {
                  ...holder,
                  percent: `${percentage}%`,
                  percentage: percentage,
                };
              }
            );
          } else {
            holdersData.holders = holdersData.holders.map(
              (holder: { [key: string]: unknown }) => ({
                ...holder,
                percent: "N/A",
                percentage: "N/A",
              })
            );
          }
        }
      } else {
        console.info("Holders API failed or returned empty response");
      }

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
 * Format liquidity information from pairs data or honeypot data
 */
function formatLiquidityInfo(
  pairsData: PairData[],
  honeypotData: HoneypotData | null,
  detectedChain: string
): LiquidityInfo {
  const baseCurrency =
    detectedChain === "solana-mainnet"
      ? "SOL"
      : detectedChain === "56"
      ? "BNB"
      : "ETH";

  if (honeypotData?.pair?.liquidity) {
    const pairName = honeypotData.pair.pair?.name || `UNKNOWN-${baseCurrency}`;
    const dexName = pairName.includes("PancakeSwap")
      ? "PancakeSwap V2"
      : pairName.includes("Uniswap")
      ? "Uniswap V2"
      : detectedChain === "solana-mainnet"
      ? "Raydium"
      : "DEX";

    return {
      dex: dexName,
      liquidityUsd: honeypotData.pair.liquidity,
      liquidityPercent: "N/A",
      pairName: pairName.replace(/^.*?:\s*/, ""),
      pairAddress: honeypotData.pair.pair?.address || honeypotData.pairAddress,
    };
  }

  if (!pairsData || pairsData.length === 0) {
    return {
      dex: "Unknown",
      liquidityUsd: 0,
      liquidityPercent: "N/A",
      pairName: `UNKNOWN-${baseCurrency}`,
    };
  }

  const mainPair = pairsData[0];
  const liquidityUsd = mainPair.liquidity?.usd || mainPair.Liquidity || 0;
  const dexName =
    mainPair.dexName ||
    (detectedChain === "solana-mainnet" ? "Raydium" : "Uniswap V2");
  const pairName =
    mainPair.pairName || mainPair.Pair?.Name || `UNKNOWN-${baseCurrency}`;

  return {
    dex: dexName,
    liquidityUsd: liquidityUsd,
    liquidityPercent: "N/A",
    pairName: pairName,
    pairAddress: mainPair.Pair?.Address,
  };
}

/**
 * Format contract information with enhanced data
 */
function formatContractInfo(
  contractData: ContractData | null,
  honeypotData: HoneypotData | null,
  holdersData: HoldersData | null,
  detectedChain: string
): ContractInfo {
  const canSellCount =
    holdersData?.recentHolderAnalysis?.canSell ||
    honeypotData?.holderAnalysis?.successful ||
    0;
  const totalHolders =
    holdersData?.recentHolderAnalysis?.total ||
    honeypotData?.holderAnalysis?.holders ||
    0;

  const actualHolderCount =
    holdersData?.holders?.length || honeypotData?.token?.totalHolders || 0;
  const isSolana = detectedChain === "solana-mainnet";

  const isOpenSource =
    contractData?.isOpenSource ||
    honeypotData?.contractCode?.openSource ||
    false;
  const isVerified =
    contractData?.isVerified ||
    honeypotData?.contractCode?.rootOpenSource ||
    false;
  const isProxy = honeypotData?.contractCode?.isProxy || false;
  const hasProxyCalls = honeypotData?.contractCode?.hasProxyCalls || false;

  const avgGas =
    holdersData?.recentHolderAnalysis?.avgGas ||
    (honeypotData?.holderAnalysis?.averageGas
      ? formatLargeNumber(honeypotData.holderAnalysis.averageGas)
      : isSolana
      ? "~2,000 SOL"
      : "N/A");

  const avgTax =
    holdersData?.recentHolderAnalysis?.avgTax ||
    (honeypotData?.holderAnalysis?.averageTax
      ? formatPercentage(honeypotData.holderAnalysis.averageTax)
      : "0%");

  return {
    isOpenSource,
    isVerified,
    isProxy,
    hasProxyCalls,
    canSell:
      canSellCount && totalHolders
        ? `${formatLargeNumber(canSellCount)}/${formatLargeNumber(
            totalHolders
          )}`
        : isSolana && actualHolderCount > 0
        ? `${formatLargeNumber(actualHolderCount)}/${formatLargeNumber(
            actualHolderCount
          )}`
        : "N/A",
    avgGas: avgGas,
    avgTax: avgTax,
  };
}

/**
 * Escape special characters for Telegram Markdown
 */
function escapeMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\\]/g, "\\\\")
    .replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}

/**
 * Generate comprehensive token analysis report with enhanced formatting
 */
function generateComprehensiveReport(analysis: TokenAnalysisResult): string {
  const { honeypot, contract, pairs, holders, tokenInfo } = analysis;

  const liquidityInfo = formatLiquidityInfo(
    pairs,
    honeypot,
    analysis.detectedChain
  );
  const contractInfo = formatContractInfo(
    contract,
    honeypot,
    holders,
    analysis.detectedChain
  );

  const tokenHolders =
    holders?.totalHolders ||
    honeypot?.token?.totalHolders ||
    holders?.holders?.length ||
    0;

  const isHoneypot =
    honeypot?.honeypotResult?.isHoneypot ||
    honeypot?.summary?.risk === "high" ||
    honeypot?.summary?.risk === "honeypot" ||
    (honeypot?.simulationResult?.sellTax &&
      honeypot.simulationResult.sellTax > 50) ||
    (honeypot?.flags &&
      Array.isArray(honeypot.flags) &&
      honeypot.flags.includes("EXTREMELY_HIGH_TAXES"));

  const buyTax = formatPercentage(honeypot?.simulationResult?.buyTax || 0);
  const sellTax = formatPercentage(honeypot?.simulationResult?.sellTax || 0);
  const transferTax = formatPercentage(
    honeypot?.simulationResult?.transferTax || 0
  );

  const honeypotReason =
    honeypot?.honeypotResult?.honeypotReason ||
    honeypot?.summary?.riskReason ||
    "Cannot sell tokens! HONEYPOT DETECTED!";

  let riskFlags: string[] = [];
  if (honeypot?.flags) {
    if (Array.isArray(honeypot.flags)) {
      riskFlags = honeypot.flags;
    } else if (typeof honeypot.flags === "object") {
      if (!honeypot.flags.isSellable) riskFlags.push("NOT_SELLABLE");
      if (!honeypot.flags.isOpen) riskFlags.push("NOT_OPEN_SOURCE");
      if (honeypot.flags.isAntiWhale) riskFlags.push("ANTI_WHALE");
      if (honeypot.flags.hasAntiBot) riskFlags.push("ANTI_BOT");
      if (!honeypot.flags.staysLiquid) riskFlags.push("LIQUIDITY_ISSUES");
      if (honeypot.flags.hasForeignCalls) riskFlags.push("FOREIGN_CALLS");
      if (honeypot.flags.hasPermissions) riskFlags.push("HAS_PERMISSIONS");
    }
  }

  if (honeypot?.risks && Array.isArray(honeypot.risks)) {
    honeypot.risks.forEach((risk) => {
      if (risk.level === "danger" || risk.level === "warning") {
        riskFlags.push(
          `${risk.name?.toUpperCase().replace(/\s+/g, "_")}: ${risk.value}`
        );
      }
    });
  }

  const holderAnalysisText = honeypot?.holderAnalysis
    ? `📊 *HOLDER ANALYSIS:* ${formatLargeNumber(
        honeypot.holderAnalysis.holders
      )} analyzed | ${formatLargeNumber(
        honeypot.holderAnalysis.successful
      )} can sell | ${formatLargeNumber(
        honeypot.holderAnalysis.failed
      )} failed | Highest tax: ${formatPercentage(
        honeypot.holderAnalysis.highestTax
      )}
`
    : "";

  const gasInfo = honeypot?.simulationResult
    ? `⛽ *GAS:* Buy: ${formatLargeNumber(
        honeypot.simulationResult.buyGas
      )} | Sell: ${formatLargeNumber(honeypot.simulationResult.sellGas)} units
`
    : "";

  const safeName = escapeMarkdown(tokenInfo.name);
  const safeSymbol = escapeMarkdown(tokenInfo.symbol);
  const safeDex = escapeMarkdown(liquidityInfo.dex);
  const safePairName = escapeMarkdown(liquidityInfo.pairName);
  const safeHoneypotReason = escapeMarkdown(honeypotReason);

  if (isHoneypot) {
    return `🚨 *CRITICAL WARNING - HONEYPOT DETECTED* 🚨
⚠️ *DO NOT BUY THIS TOKEN* ⚠️
${safeHoneypotReason}

🪙 *TOKEN:* ${safeName} (${safeSymbol}) | ${formatLargeNumber(
      tokenHolders
    )} holders
📱 *CHAIN:* ${honeypot?.chain?.name || getChainName(analysis.detectedChain)}

💱 *TRADING:* ${
      liquidityInfo.dex === "Unknown"
        ? "❌ No liquidity data"
        : `${safeDex} | ${safePairName} | $${formatLargeNumber(
            liquidityInfo.liquidityUsd
          )}`
    }

💸 *TAXES:* Buy: ${buyTax} | Sell: ${sellTax}${
      transferTax !== "0%" ? ` | Transfer: ${transferTax}` : ""
    }

📄 *CONTRACT:* ${contractInfo.isOpenSource ? "✅ Open" : "❌ Closed"} | ${
      contractInfo.isVerified ? "✅ Verified" : "❌ Unverified"
    }${contractInfo.isProxy ? " | ⚠️ Proxy" : ""}${
      contractInfo.hasProxyCalls ? " | ⚠️ Proxy Calls" : ""
    }

${holderAnalysisText}${gasInfo}🚩 *RISK FLAGS:*
${
  riskFlags.length > 0
    ? riskFlags.map((flag) => ` • ${escapeMarkdown(flag)}`).join("\n")
    : " • High sell tax detected\n • Potential honeypot mechanism"
}

⚠️ *RUGPROOFAI: EXTREMELY HIGH RISK*
This token shows clear signs of being a honeypot scam.

*Generated by RugProofAI - Not financial advice*`;
  } else {
    const riskLevel =
      parseFloat(buyTax) > 10 || parseFloat(sellTax) > 10 ? "Medium" : "Low";
    const riskEmoji = riskLevel === "Low" ? "✅" : "⚠️";

    const riskScoreText = honeypot?.score_normalised
      ? `\n🎯 *Risk Score:* ${honeypot.score_normalised}/100`
      : "";

    return `${riskEmoji} *${riskLevel.toUpperCase()} RISK TOKEN* ${riskEmoji}
No critical honeypot mechanisms detected. Always DYOR!

🪙 *TOKEN:* ${safeName} (${safeSymbol}) | ${formatLargeNumber(
      tokenHolders
    )} holders
📱 *CHAIN:* ${
      honeypot?.chain?.name || getChainName(analysis.detectedChain)
    }${riskScoreText}

💱 *TRADING:* ${
      liquidityInfo.dex === "Unknown"
        ? "❌ No liquidity data"
        : `${safeDex} | ${safePairName} | $${formatLargeNumber(
            liquidityInfo.liquidityUsd
          )}`
    }

💸 *TAXES:* Buy: ${buyTax} | Sell: ${sellTax}${
      transferTax !== "0%" ? ` | Transfer: ${transferTax}` : ""
    }

📄 *CONTRACT:* ${contractInfo.isOpenSource ? "✅ Open" : "❌ Closed"} | ${
      contractInfo.isVerified ? "✅ Verified" : "❌ Unverified"
    }${contractInfo.isProxy ? " | ℹ️ Proxy" : ""}${
      contractInfo.hasProxyCalls ? " | ℹ️ Proxy Calls" : ""
    }

📊 *TRADING:* Can sell: ${contractInfo.canSell} | Gas: ${
      contractInfo.avgGas
    } | Tax: ${contractInfo.avgTax}

${holderAnalysisText}${gasInfo}${
      riskFlags.length > 0
        ? `🔍 *FLAGS:* ${riskFlags
            .map((flag) => escapeMarkdown(flag))
            .join(" | ")}

`
        : ""
    }✅ *RUGPROOFAI: ${riskLevel.toUpperCase()} RISK*
${
  riskLevel === "Low"
    ? "Token appears legitimate, but always DYOR."
    : "Some risk factors detected. Review before investing."
}

*Generated by RugProofAI - Not financial advice*`;
  }
}

/**
 * Get chain name for display
 */
function getChainName(chainId: string): string {
  const chainNames: { [key: string]: string } = {
    "1": "Ethereum",
    "56": "BSC",
    "137": "Polygon",
    "8453": "Base",
    "43114": "Avalanche",
    "solana-mainnet": "Solana",
  };
  return chainNames[chainId] || `Chain ${chainId}`;
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
    let detectedChain: string;
    if (args.length > 1) {
      detectedChain = args[1];
    } else {
      const detected = await detectChain(contractAddress);
      detectedChain = detected || "1";
    }

    const analysis = await fetchComprehensiveTokenAnalysis(
      contractAddress,
      detectedChain
    );

    const response = generateComprehensiveReport(analysis);
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
        "1",
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
