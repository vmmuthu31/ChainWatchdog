import TelegramBot from "node-telegram-bot-api";
import { BotContext } from "../types";

export async function handleStartCommand(
  bot: TelegramBot,
  ctx: BotContext
): Promise<void> {
  const { message } = ctx;
  const chatId = message.chat.id;
  const firstName = message.from?.first_name || "there";

  const welcomeMessage = `
👋 Hello, ${firstName}! 

Welcome to *RugProofAI Bot* - your advanced crypto security assistant.

*🚀 INSTANT ANALYSIS - Just paste any address!*
Example: \`0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE\`
Example: \`8R5wXjKyQzZe9ruPi4paXayDzHWmUqMkqwCWayFTpump\`

*What I can do for you:*
🧪 *Comprehensive Token Analysis*
• Honeypot detection (buy/sell simulation)
• Contract verification status  
• Liquidity & holder analysis
• Tax analysis (fees)
• Auto-detect network (ETH, BSC, Base, Solana, etc.)

🔍 *Advanced Security Checks*
• Smart contract auditing
• Wallet spam token detection
• Multi-chain support

*Commands Available:*
\`/scan <address>\` - Full token analysis
\`/honeypot <address>\` - Quick honeypot check
\`/scanwallet <address>\` - Wallet security scan
\`/help\` - Detailed help guide

*💡 Pro Tip:* No commands needed! Just paste any token address (EVM or Solana) and I'll auto-analyze it with comprehensive security data from honeypot.is API (EVM) and rugcheck.xyz API (Solana).

Ready to keep your crypto safe? 🛡️
  `;

  await bot.sendMessage(chatId, welcomeMessage, { parse_mode: "Markdown" });
}
