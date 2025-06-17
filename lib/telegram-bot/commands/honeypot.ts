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
⚠️ *HONEYPOT DETECTED* ⚠️

Address: \`${result.address}\`
Chain: ${result.chainId}
Token: ${result.tokenName || "Unknown"} (${result.tokenSymbol || "Unknown"})

❌ *This token is a honeypot*
${result.honeypotReason ? `Reason: ${result.honeypotReason}` : ""}
Buy Tax: ${result.buyTax !== undefined ? `${result.buyTax}%` : "Unknown"}
Sell Tax: ${
        result.sellTax !== undefined ? `${result.sellTax}%` : "UNABLE TO SELL"
      }

⚠️ *DO NOT BUY* this token. It has been identified as a honeypot designed to prevent selling.
`;
    } else {
      response = `
🔍 *Contract Analysis Complete*

Address: \`${result.address}\`
Chain: ${result.chainId}
Token: ${result.tokenName || "Unknown"} (${result.tokenSymbol || "Unknown"})

✅ *Not identified as a honeypot*
Buy Tax: ${result.buyTax !== undefined ? `${result.buyTax}%` : "Unknown"}
Sell Tax: ${result.sellTax !== undefined ? `${result.sellTax}%` : "Unknown"}

Note: Always do your own research before investing. This is an automated check and may not catch all potential risks.
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
    await bot.editMessageText(
      `❌ Error: ${(error as Error).message || "Failed to check contract"}`,
      {
        chat_id: chatId,
        message_id: processingMsgId.message_id,
      }
    );
  }
}
