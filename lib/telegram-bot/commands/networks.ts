import TelegramBot from "node-telegram-bot-api";
import { BotContext } from "../types";
import { getSupportedChains } from "../services/botService";

export async function handleNetworksCommand(
  bot: TelegramBot,
  ctx: BotContext
): Promise<void> {
  const { message: msg } = ctx;
  const chatId = msg.chat.id;

  const chains = getSupportedChains();

  const evmChains = chains.filter(
    (chain) => chain.category === "EVM" && chain.type === "Mainnet"
  );
  const layer2Chains = chains.filter(
    (chain) => chain.category === "Layer2" && chain.type === "Mainnet"
  );
  const nonEvmChains = chains.filter(
    (chain) => chain.category === "Non-EVM" && chain.type === "Mainnet"
  );
  const testnetChains = chains.filter((chain) => chain.type === "Testnet");
  const otherChains = chains.filter(
    (chain) => chain.category === "Other" && chain.type === "Mainnet"
  );

  let messageText = `*Supported Networks* 🌐

*EVM Networks:*
${evmChains.map((chain) => `• ${chain.name} - \`${chain.id}\``).join("\n")}

*Layer 2 Networks:*
${layer2Chains.map((chain) => `• ${chain.name} - \`${chain.id}\``).join("\n")}

*Non-EVM Networks:*
${nonEvmChains.map((chain) => `• ${chain.name} - \`${chain.id}\``).join("\n")}`;

  if (otherChains.length > 0) {
    messageText += `\n\n*Other Networks:*
${otherChains.map((chain) => `• ${chain.name} - \`${chain.id}\``).join("\n")}`;
  }

  messageText += `\n\n*Usage:*
\`/scan <wallet_address> <chain_id>\`
\`/honeypot <token_address> <chain_id>\`

Example:
\`/scan 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 eth-mainnet\`

Type \`/help\` for more information.`;

  await bot.sendMessage(chatId, messageText, { parse_mode: "Markdown" });

  if (testnetChains.length > 0) {
    const testnetMessage = `*Testnet Networks:*
${testnetChains
  .map((chain) => `• ${chain.name} - \`${chain.id}\``)
  .join("\n")}`;

    await bot.sendMessage(chatId, testnetMessage, { parse_mode: "Markdown" });
  }
}
