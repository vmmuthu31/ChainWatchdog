import TelegramBot from "node-telegram-bot-api";
import { BotContext } from "../types";
import { getSupportedChains } from "../services/botService";

export async function handleHelpCommand(
  bot: TelegramBot,
  ctx: BotContext
): Promise<void> {
  const { message } = ctx;
  const chatId = message.chat.id;

  // Get supported chains
  const chains = getSupportedChains();
  const mainnetChains = chains
    .filter((chain) => chain.type === "Mainnet")
    .map((chain) => chain.id)
    .slice(0, 5)
    .join(", ");

  const helpMessage = `
*RugProofAI Bot Commands:*

• 🔍 */scan* <wallet_address> [chain_id] - Scan a wallet for spam tokens
• 🔎 */honeypot* <token_address> [chain_id] - Check if a token is a honeypot
• ⚠️ */contract* <contract_address> [chain_id] - Check contract security
• ℹ️ */help* - Show this help message
• 🏁 */start* - Start the bot

*Examples:*
/scan 0x1234...abcd
/honeypot 0xabcd...1234 eth-mainnet
/contract 0x5678...efgh bsc-mainnet

*Supported Chains:*
The default chain is eth-mainnet. Some popular chains include: ${mainnetChains}, and many more.

*Note:*
Always verify your research and never make investment decisions based solely on this bot.
`;

  await bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
}
