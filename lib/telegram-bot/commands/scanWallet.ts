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
      "Please provide a wallet address. Usage: /scan <wallet_address> [chain_id]"
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
    const response = `
🔍 *Wallet Scan Complete*

Address: \`${result.address}\`
Chain: ${result.chainId}

📊 *Summary:*
• Total Tokens: ${result.totalTokens}
• ✅ Safe Tokens: ${result.safeTokensCount}
• ❌ Spam Tokens: ${result.spamTokensCount}

${formatSummary(result)}
    `;

    // Edit the processing message with the result
    await bot.editMessageText(response, {
      chat_id: chatId,
      message_id: processingMsgId.message_id,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error in scan wallet command:", error);
    await bot.editMessageText(
      `❌ Error: ${(error as Error).message || "Failed to scan wallet"}`,
      {
        chat_id: chatId,
        message_id: processingMsgId.message_id,
      }
    );
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
    return "✅ This wallet appears to be safe with no spam tokens.";
  } else if (spamPercentage < 10) {
    return "⚠️ This wallet has a few spam tokens, but is generally safe.";
  } else if (spamPercentage < 30) {
    return "⚠️ This wallet has a moderate number of spam tokens. Use caution.";
  } else {
    return "🚨 WARNING: This wallet has a high percentage of spam tokens!";
  }
}
