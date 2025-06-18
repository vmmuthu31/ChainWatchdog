import TelegramBot from "node-telegram-bot-api";
import { BotContext } from "../types";
import { checkContract } from "../services/botService";

export async function handleCheckContractCommand(
  bot: TelegramBot,
  ctx: BotContext
): Promise<void> {
  const { message, args } = ctx;
  const chatId = message.chat.id;

  if (args.length === 0) {
    await bot.sendMessage(
      chatId,
      "Please provide a contract address. Usage: /contract <contract_address> [chain_id]"
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
    const result = await checkContract(contractAddress, chainId);

    const response = `
🔍 *Contract Verification Results*

Address: \`${result.address}\`
Chain: ${result.chainId}

📊 *Verification Details:*
• Is Contract: ${result.isContract ? "✅ Yes" : "❌ No"}
• Open Source: ${result.isOpenSource ? "✅ Yes" : "❌ No"}
${
  result.hasProxyCalls
    ? "• Has Proxy Calls: ⚠️ Yes"
    : "• Has Proxy Calls: ✅ No"
}

${formatSecurityRisks(result.securityRisks)}

${formatRecommendation(result)}
`;

    await bot.editMessageText(response, {
      chat_id: chatId,
      message_id: processingMsgId.message_id,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error in contract check command:", error);
    await bot.editMessageText(
      `❌ Error: ${(error as Error).message || "Failed to check contract"}`,
      {
        chat_id: chatId,
        message_id: processingMsgId.message_id,
      }
    );
  }
}

function formatSecurityRisks(risks?: {
  hasMintAuthority?: boolean;
  hasFreezeAuthority?: boolean;
  isMutable?: boolean;
  hasTransferFee?: boolean;
}): string {
  if (!risks) {
    return "";
  }

  return `
🔒 *Security Risk Assessment:*
${
  risks.hasMintAuthority
    ? "• ⚠️ Has Mint Authority: Yes (Risk of unlimited token creation)"
    : "• ✅ Has Mint Authority: No"
}
${
  risks.hasFreezeAuthority
    ? "• ⚠️ Has Freeze Authority: Yes (Can freeze token transfers)"
    : "• ✅ Has Freeze Authority: No"
}
${
  risks.isMutable
    ? "• ⚠️ Token Metadata Mutable: Yes (Can change token properties)"
    : "• ✅ Token Metadata Mutable: No"
}
${
  risks.hasTransferFee
    ? "• ⚠️ Has Transfer Fee: Yes (Charges fee on transfers)"
    : "• ✅ Has Transfer Fee: No"
}`;
}

function formatRecommendation(result: {
  isContract: boolean;
  isOpenSource: boolean;
  hasProxyCalls?: boolean;
  securityRisks?: {
    hasMintAuthority?: boolean;
    hasFreezeAuthority?: boolean;
    isMutable?: boolean;
    hasTransferFee?: boolean;
  };
}): string {
  if (!result.isContract) {
    return "⚠️ *Not a valid contract address* - This address does not contain contract code.";
  }

  if (!result.isOpenSource) {
    return "⚠️ *Unverified Contract* - This contract's source code is not verified. Exercise extreme caution.";
  }

  const hasHighRisks =
    result.securityRisks &&
    (result.securityRisks.hasMintAuthority ||
      result.securityRisks.hasFreezeAuthority);

  const hasModerateRisks =
    result.securityRisks &&
    (result.securityRisks.isMutable ||
      result.securityRisks.hasTransferFee ||
      result.hasProxyCalls);

  if (hasHighRisks) {
    return "🚨 *High Risk Contract* - This contract has significant security risks. Proceed with extreme caution.";
  }

  if (hasModerateRisks) {
    return "⚠️ *Moderate Risk Contract* - This contract has some potential security concerns. Exercise caution.";
  }

  return "✅ *Low Risk Contract* - No major security concerns detected, but always do your own research.";
}
