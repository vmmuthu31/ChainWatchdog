import { checkLocalSpamList } from "./checkLocalSpamList";
import { convertChainFormat } from "./convertChainFormat";
import { getChainName } from "./getChainName";

export const analyzeTokenForSpam = async (
  address: string,
  chainId: string,
  setTokenAddress: (type: string) => void,
  setAnalysisType: (type: string) => void
): Promise<string> => {
  setTokenAddress(address);
  setAnalysisType("spam");

  try {
    const isLocalSpam = await checkLocalSpamList(address, chainId);
    const honeypotChainId = convertChainFormat(chainId, "honeypot");
    const chainName = getChainName(honeypotChainId);

    if (isLocalSpam) {
      return `⚠️ SPAM TOKEN DETECTED ⚠️\n\nAddress: ${address}\nChain: ${chainName}\n\nThis token has been identified as SPAM in our database.\n\nRisk Level: HIGH\n\nThis token is listed in our spam token database. It may be used for scams, phishing, or other malicious activities. Do not interact with this token and do not approve any transactions requested by it.`;
    }

    return `✅ TOKEN NOT IN SPAM DATABASE\n\nAddress: ${address}\nChain: ${chainName}\n\nThis token was not found in our spam database. However, this is only a basic check.\n\nFor a more thorough analysis including honeypot detection and smart contract risk assessment, ask me to 'check this token for honeypot' instead.\n\nAlways conduct your own research before investing.`;
  } catch (error) {
    console.error("Error analyzing token for spam:", error);
    return `⚠️ ERROR CHECKING TOKEN ⚠️\n\nAddress: ${address}\nChain: ${getChainName(
      convertChainFormat(chainId, "honeypot")
    )}\n\nUnable to complete token analysis due to an error. This could be because:\n• The token address may be invalid\n• Our spam database may be temporarily unavailable\n\nPlease try again later or check the token address on the blockchain explorer.`;
  }
};
