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

*🚀 INSTANT ANALYSIS*
Simply paste any token address directly into the chat!
*Example:* \`0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE\`

*Available Commands:*

🧪 *COMPREHENSIVE TOKEN ANALYSIS*
\`/scan <token_address>\` or \`/honeypot <token_address>\`
\`/analyze <token_address>\` or \`/token <token_address>\`
• Auto-detects network (Ethereum, BSC, Base, Solana, etc.)
• Honeypot detection with buy/sell simulation
• Contract verification status
• Top holder analysis
• Liquidity pool information
• Tax analysis (buy/sell fees)
• Security risk assessment

👤 *WALLET ANALYSIS*
\`/scan <wallet_address> [chain_id]\`
Analyze a wallet for spam tokens, scams, and security risks

🛡️ *CONTRACT AUDIT*
\`/contract <contract_address> [chain_id]\`
Audit smart contract security and identify potential risks

ℹ️ *HELP & INFO*
\`/help\` - Display this help guide
\`/start\` - Initialize the bot
\`/networks\` - List all supported networks

*🌐 Supported Networks:*
• *Auto-Detection:* Ethereum, BSC, Base, Polygon, Solana
• *Manual Selection:* ${mainnetChains.join(", ")}

*📋 Examples:*
• \`0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE\` - Quick SHIB analysis
• \`/scan 0x1234...\` - Comprehensive token analysis
• \`/scan 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\` - Scan Vitalik's wallet

*🔍 What You Get:*
✅ Honeypot Detection ✅ Liquidity Analysis
✅ Tax Information ✅ Holder Distribution  
✅ Contract Verification ✅ Security Risks
✅ Multi-Chain Support ✅ Real-time Data

⚠️ *DISCLAIMER:* This bot provides automated analysis only. Always conduct your own research before making investment decisions.

_RugProofAI - Advanced DeFi Security Analysis_
`;

  await bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
}
