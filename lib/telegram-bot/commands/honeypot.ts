import TelegramBot from "node-telegram-bot-api";
import { BotContext } from "../types";
import { checkHoneypot } from "../services/botService";

export async function handleHoneypotCommand(
  bot: TelegramBot,
  ctx: BotContext
): Promise<void> {
  const { message, args } = ctx;
  const chatId = message.chat.id;

  // Check if contract address is provided
  if (args.length === 0) {
    await bot.sendMessage(
      chatId,
      "Please provide a token contract address. Usage: /honeypot <contract_address> [chain_id]"
    );
    return;
  }

  const contractAddress = args[0];
  // Optionally get chain ID if provided
  const chainId = args.length > 1 ? args[1] : "eth-mainnet";

  // Send processing message
  const processingMsgId = await bot.sendMessage(
    chatId,
    `⏳ Analyzing contract ${contractAddress} on chain ${chainId}...`
  );

  try {
    // Call the honeypot check service
    const result = await checkHoneypot(contractAddress, chainId);

    // Format the result
    let response: string;

    if (result.isHoneypot) {
      response = `
🚨 *HONEYPOT ALERT* 🚨

*Token Information:*
• Name: *${result.tokenName || "Unknown"}*
• Symbol: ${result.tokenSymbol || "UNKNOWN"}
• Contract: \`${result.address}\`
• Chain: ${result.chainId}

*Analysis Results:*
• Status: ❌ *HONEYPOT DETECTED*
• Buy Tax: ${result.buyTax !== undefined ? `${result.buyTax}%` : "Unknown"}
• Sell Tax: ${result.sellTax !== undefined ? `${result.sellTax}%` : "100%"}
${result.honeypotReason ? `• Reason: ${result.honeypotReason}` : ""}

⚠️ *WARNING: DO NOT BUY* - This token has been identified as a honeypot designed to prevent selling. Investing in this token will likely result in a complete loss of funds.

_Analysis by RugProofAI - Keeping your crypto safe_
`;
    } else {
      response = `
🔍 *TOKEN SECURITY ANALYSIS*

*Token Information:*
• Name: *${result.tokenName || "Unknown"}*
• Symbol: ${result.tokenSymbol || "UNKNOWN"}
• Contract: \`${result.address}\`
• Chain: ${result.chainId}

*Analysis Results:*
• Honeypot Status: ✅ *NOT DETECTED AS HONEYPOT*
• Buy Tax: ${result.buyTax !== undefined ? `${result.buyTax}%` : "Unknown"}
• Sell Tax: ${result.sellTax !== undefined ? `${result.sellTax}%` : "Unknown"}

⚠️ *DISCLAIMER:* This is an automated analysis and should not be your only source of research. Always conduct thorough due diligence before investing.

_Analysis by RugProofAI - Keeping your crypto safe_
`;
    }

    // Edit the processing message with the result
    await bot.editMessageText(response, {
      chat_id: chatId,
      message_id: processingMsgId.message_id,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error in honeypot check command:", error);

    // Provide a more helpful error message based on the error type
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

    await bot.editMessageText(errorResponse, {
      chat_id: chatId,
      message_id: processingMsgId.message_id,
      parse_mode: "Markdown",
    });
  }
}
