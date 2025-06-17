import TelegramBot from "node-telegram-bot-api";
import { BotContext } from "../types";
import { scanWallet } from "../services/botService";

export async function handleScanWalletCommand(
  bot: TelegramBot,
  ctx: BotContext
): Promise<void> {
  const { message, args } = ctx;
  const chatId = message.chat.id;

  // Check if wallet address is provided
  if (args.length === 0) {
    await bot.sendMessage(
      chatId,
      `*Wallet Scan Usage*

Please provide a wallet address to scan:
\`/scan <wallet_address> [chain_id]\`

*Examples:*
\`/scan 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 eth-mainnet\` - Ethereum
\`/scan 0x0000000000000000000000000000000000000000 base-mainnet\` - Base
\`/scan 0x0000000000000000000000000000000000000000 bsc-mainnet\` - BNB Chain
\`/scan 0x0000000000000000000000000000000000000000 matic-mainnet\` - Polygon
\`/scan 0x0000000000000000000000000000000000000000 optimism-mainnet\` - Optimism
\`/scan 0x0000000000000000000000000000000000000000 arbitrum-mainnet\` - Arbitrum
\`/scan <solana_address> solana-mainnet\` - Solana

The default chain is Ethereum mainnet if not specified.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  const walletAddress = args[0];
  // Optionally get chain ID if provided
  const chainId = args.length > 1 ? args[1] : "eth-mainnet";

  // Send processing message
  const processingMsgId = await bot.sendMessage(
    chatId,
    `⏳ Scanning wallet ${walletAddress} on chain ${chainId}...`
  );

  try {
    // Call the scan wallet service
    const result = await scanWallet(walletAddress, chainId);

    // Format the result
    let response = `
🔍 *WALLET ANALYSIS REPORT*

*Wallet Information:*
• Address: \`${result.address}\`
• Network: ${result.chainId}

📊 *Portfolio Summary:*
• Total Holdings: ${result.totalTokens} tokens
• Safe Assets: ${result.safeTokensCount} tokens
• Flagged Assets: ${result.spamTokensCount} tokens
• Total Value: $${result.totalValue ? result.totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "N/A"}

*Security Assessment:*
${formatSummary(result)}
`;

    // Add token details
    if (result.tokens && result.tokens.length > 0) {
      // Sort tokens by value (highest first)
      const sortedTokens = [...result.tokens].sort(
        (a, b) => (b.value || 0) - (a.value || 0)
      );

      // Show top tokens (maximum 10 to avoid message length issues)
      response += `\n� *TOP HOLDINGS:*\n`;

      sortedTokens.slice(0, 10).forEach((token) => {
        const status = token.isSpam ? "⚠️" : "💠";
        const valueStr = token.value 
          ? `$${token.value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
          : "N/A";
        const percentOfTotal =
          result.totalValue && token.value && result.totalValue > 0
            ? ((token.value / result.totalValue) * 100).toFixed(1) + "%"
            : "N/A";

        response += `\n${status} *${token.symbol}* (${token.name.length > 15 ? token.name.substring(0, 15) + '...' : token.name})
   • Balance: ${token.formattedBalance}
   • Value: ${valueStr} (${percentOfTotal} of portfolio)
   • Contract: \`${token.contractAddress.slice(0, 6)}...${token.contractAddress.slice(-4)}\`
   • Status: ${token.isSpam ? "⚠️ Flagged" : "✅ Safe"}`;
      });

      if (sortedTokens.length > 10) {
        response += `\n\n_...and ${
          sortedTokens.length - 10
        } more tokens not shown_`;
      }
      
      response += `\n\n_Analysis by RugProofAI - Keeping your crypto safe_`;
    }

    // Edit the processing message with the result
    await bot.editMessageText(response, {
      chat_id: chatId,
      message_id: processingMsgId.message_id,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error in scan wallet command:", error);
    
    let errorMessage = (error as Error).message || "Failed to scan wallet";
    
    // Handle common errors with user-friendly messages
    if (errorMessage.includes("Unsupported chain")) {
      errorMessage = "The requested blockchain is not currently supported. Please try another chain from the supported list.";
    } else if (errorMessage.includes("wallet") && errorMessage.includes("not found")) {
      errorMessage = "We couldn't find this wallet address on the specified blockchain. Please verify the address and chain.";
    }
    
    const errorResponse = `
❌ *SCAN ERROR*

We encountered an issue while scanning this wallet:
"${errorMessage}"

Please verify the wallet address and selected blockchain, then try again.

_RugProofAI - Keeping your crypto safe_
`;
    
    await bot.editMessageText(errorResponse, {
      chat_id: chatId,
      message_id: processingMsgId.message_id,
      parse_mode: "Markdown"
    });
  }
}

function formatSummary(result: {
  spamTokensCount: number;
  totalTokens: number;
}): string {
  const spamPercentage =
    result.totalTokens > 0
      ? Math.round((result.spamTokensCount / result.totalTokens) * 100)
      : 0;

  if (spamPercentage === 0) {
    return "✅ *SECURE* - No suspicious tokens detected in this wallet.";
  } else if (spamPercentage < 10) {
    return "⚠️ *LOW RISK* - This wallet contains a small number of flagged tokens (${spamPercentage}% of holdings), but is generally secure.";
  } else if (spamPercentage < 30) {
    return "⚠️ *MODERATE RISK* - This wallet contains a significant number of flagged tokens (${spamPercentage}% of holdings). Exercise caution when approving transactions.";
  } else {
    return "🚨 *HIGH RISK* - This wallet contains a large proportion of flagged tokens (${spamPercentage}% of holdings). Exercise extreme caution with this wallet.";
  }
}
