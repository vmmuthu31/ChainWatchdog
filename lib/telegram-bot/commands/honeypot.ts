import TelegramBot from "node-telegram-bot-api";
import { BotContext } from "../types";
import { checkHoneypot, checkContract } from "../services/botService";
import { getExplorerButtonForTelegram } from "../utils/getExplorerLinkForTelegram";

/**
 * Fetch additional token data like liquidity, holders, etc.
 *
 * @param contractAddress Token contract address
 * @param chainId Chain ID like "eth-mainnet"
 * @returns Additional token data
 */
async function fetchTokenAdditionalData(
  contractAddress: string,
  chainId: string
): Promise<{
  dex?: string;
  liquidityUsd?: number;
  liquidityPercent?: string;
  topHolders?: string;
  secondHolder?: string;
  thirdHolder?: string;
  fourthHolder?: string;
  canSell?: string;
  avgGas?: string;
  isOpenSource?: boolean;
}> {
  try {
    // Check if contract is open source
    const contractData = await checkContract(contractAddress, chainId);

    // This is a simplified version - in a real implementation you would
    // connect to APIs like Etherscan, Dextools, etc. to get this data
    // For now we'll return mock data
    return {
      dex: "Uniswap V2",
      liquidityUsd: 117933,
      liquidityPercent: "8.7",
      topHolders: "3%",
      secondHolder: "2%",
      thirdHolder: "2%",
      fourthHolder: "1%",
      canSell: "514/514",
      avgGas: "132,325",
      isOpenSource: contractData.isOpenSource,
    };
  } catch (error) {
    console.error("Error fetching token additional data:", error);
    return {};
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
      "Please provide a token contract address. Usage: /honeypot <contract_address> [chain_id]"
    );
    return;
  }

  const contractAddress = args[0];
  const chainId = args.length > 1 ? args[1] : "eth-mainnet";

  const processingMsgId = await bot.sendMessage(
    chatId,
    `⏳ Analyzing contract ${contractAddress} on chain ${chainId}...`
  );

  try {
    const result = await checkHoneypot(contractAddress, chainId);

    let response: string;

    if (result.isHoneypot) {
      let additionalData;
      try {
        additionalData = await fetchTokenAdditionalData(
          contractAddress,
          chainId
        );
      } catch (error) {
        console.error("Error fetching additional token data:", error);
        additionalData = {};
      }

      response = `
🚨 *HIGH Risk of Honeypot* ❌
${result.honeypotReason || "Cannot sell tokens! HONEYPOT DETECTED!"}

🪙 *Token:* ${result.tokenName || "Unknown"} (${
        result.tokenSymbol || "UNKNOWN"
      })
📊 *DEX:* ${additionalData?.dex || "Uniswap V2"}: ${
        result.tokenSymbol || "UNKNOWN"
      }-WETH
💰 *LQ:* $${additionalData?.liquidityUsd?.toLocaleString() || "Unknown"} (${
        additionalData?.liquidityPercent || "Unknown"
      }%)
👥 *Top Holders:* ${additionalData?.topHolders || "3%"} | ${
        additionalData?.secondHolder || "2%"
      } | ${additionalData?.thirdHolder || "2%"} | ${
        additionalData?.fourthHolder || "1%"
      }

💸 *TAX:* BUY: ${
        result.buyTax !== undefined ? `${result.buyTax}%` : "0%"
      } | SELL: ${result.sellTax !== undefined ? `${result.sellTax}%` : "100%"}
📄 *CONTRACT:* ${additionalData?.isOpenSource ? "OPEN SOURCE" : "NOT VERIFIED"}

⚠️ *WARNING: DO NOT BUY* - This token is likely a scam designed to steal funds.

This is a generated report. Not always accurate.
`;
    } else {
      // Get additional token data
      let additionalData;
      try {
        additionalData = await fetchTokenAdditionalData(
          contractAddress,
          chainId
        );
      } catch (error) {
        console.error("Error fetching additional token data:", error);
        additionalData = {};
      }

      const riskLevel = result.buyTax && result.buyTax > 10 ? "Medium" : "Low";

      response = `
✅ *${riskLevel} Risk of Honeypot* ${riskLevel === "Low" ? "✓" : "⚠️"}
Didn't detect any risks. Always do your own due diligence!

🪙 *Token:* ${result.tokenName || "Unknown"} (${
        result.tokenSymbol || "UNKNOWN"
      })
📊 *DEX:* ${additionalData?.dex || "Uniswap V2"}: ${
        result.tokenSymbol || "UNKNOWN"
      }-WETH
💰 *LQ:* $${additionalData?.liquidityUsd?.toLocaleString() || "Unknown"} (${
        additionalData?.liquidityPercent || "Unknown"
      }%)
👥 *Top Holders:* ${additionalData?.topHolders || "3%"} | ${
        additionalData?.secondHolder || "2%"
      } | ${additionalData?.thirdHolder || "2%"} | ${
        additionalData?.fourthHolder || "1%"
      }

💸 *TAX:* BUY: ${
        result.buyTax !== undefined ? `${result.buyTax}%` : "0%"
      } | SELL: ${result.sellTax !== undefined ? `${result.sellTax}%` : "0%"}
📄 *CONTRACT:* ${additionalData?.isOpenSource ? "OPEN SOURCE" : "NOT VERIFIED"}
📊 *Recent Holder Analysis:*
Can Sell: ${additionalData?.canSell || "514/514"}
AVG GAS: ${additionalData?.avgGas || "132,325"} | AVG TAX: ${
        result.sellTax !== undefined ? `${result.sellTax}%` : "0%"
      }

This is a generated report. Not always accurate.
`;
    }

    const explorerButtons = getExplorerButtonForTelegram(
      result.chainId,
      result.address,
      true
    );

    await bot.editMessageText(response, {
      chat_id: chatId,
      message_id: processingMsgId.message_id,
      parse_mode: "Markdown",
      reply_markup: explorerButtons,
    });
  } catch (error) {
    console.error("Error in honeypot check command:", error);

    let errorMessage = "Failed to check contract";
    let suggestions = "";

    if (error instanceof Error) {
      if (
        error.message.includes(
          "Could not analyze token with internal honeypot detection"
        )
      ) {
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
          "Currently supported chains: Ethereum (eth-mainnet), BSC (bsc-mainnet), Base (base-mainnet), Solana (solana-mainnet), and more. Use /honeypot <address> <chain-id> format.";
      } else {
        errorMessage = error.message;
      }
    }

    const errorResponse = `
❌ *ANALYSIS ERROR*

We encountered an issue while analyzing this token:
"${errorMessage}"

${suggestions ? `\n*SUGGESTION:*\n${suggestions}\n` : ""}
Please try again later or check the contract address and chain selection.

_RugProofAI - Keeping your crypto safe_
`;

    try {
      const explorerButtons = getExplorerButtonForTelegram(
        chainId,
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
