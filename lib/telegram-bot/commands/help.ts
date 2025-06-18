import TelegramBot from "node-telegram-bot-api";
import { BotContext } from "../types";
import { getSupportedChains } from "../services/botService";

export async function handleHelpCommand(
  bot: TelegramBot,
  ctx: BotContext
): Promise<void> {
  const { message } = ctx;
  const chatId = message.chat.id;

  const chains = getSupportedChains();

  const evmMainnets = chains
    .filter(
      (chain) => chain && chain.type === "Mainnet" && chain.category === "EVM"
    )
    .map((chain) => chain.name)
    .slice(0, 6);

  const layer2Mainnets = chains
    .filter(
      (chain) =>
        chain && chain.type === "Mainnet" && chain.category === "Layer2"
    )
    .map((chain) => chain.name)
    .slice(0, 4);

  const nonEvmMainnets = chains
    .filter(
      (chain) =>
        chain && chain.type === "Mainnet" && chain.category === "Non-EVM"
    )
    .map((chain) => chain.name);

  const mainnetChains = [
    ...evmMainnets,
    ...layer2Mainnets,
    ...nonEvmMainnets,
  ].slice(0, 10);

  const helpMessage = `
🔐 *RUGPROOFAI SECURITY BOT*

*Available Commands:*

� *WALLET ANALYSIS*
\`/scan <wallet_address> [chain_id]\`
Analyze a wallet for spam tokens, scams, and security risks

� *TOKEN SECURITY*
\`/honeypot <token_address> [chain_id]\`
Check if a token is a honeypot trap or has selling restrictions

🛡️ *CONTRACT AUDIT*
\`/contract <contract_address> [chain_id]\`
Audit smart contract security and identify potential risks

ℹ️ *HELP & INFO*
\`/help\` - Display this help guide
\`/start\` - Initialize the bot
\`/networks\` - List all supported networks

*Supported Networks:*
• *Major Networks:* ${mainnetChains.join(", ")}
• *Additional Networks:* And many more!

*Examples:*
\`/scan 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\` - Scan Vitalik's wallet on Ethereum
\`/honeypot 0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE SHIB eth-mainnet\` - Check if SHIB is safe
\`/contract 0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0 matic-mainnet\` - Audit the MATIC contract

⚠️ *DISCLAIMER:* This bot provides automated analysis only. Always conduct your own research before making investment decisions.

_RugProofAI - Keeping your crypto safe_
`;

  await bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
}
