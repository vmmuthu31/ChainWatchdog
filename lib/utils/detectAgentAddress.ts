export const detectAgentAddress = (
  text: string
): { address: string; type: "wallet" | "token" | "contract" } | null => {
  const ethAddressRegex = /0x[a-fA-F0-9]{40}/g;
  const matches = text.match(ethAddressRegex);

  if (!matches || matches.length === 0) return null;

  const address = matches[0];
  const lowercaseText = text.toLowerCase();

  const isWallet =
    lowercaseText.includes("wallet") ||
    lowercaseText.includes("account") ||
    lowercaseText.includes("holdings");

  const isSpamCheck =
    lowercaseText.includes("spam") ||
    lowercaseText.includes("scam") ||
    (lowercaseText.includes("check") &&
      lowercaseText.includes("token") &&
      !lowercaseText.includes("honeypot"));

  const isHoneypotCheck =
    lowercaseText.includes("honeypot") ||
    lowercaseText.includes("honey pot") ||
    lowercaseText.includes("can't sell") ||
    lowercaseText.includes("cannot sell") ||
    lowercaseText.includes("unable to sell");

  if (isWallet) {
    return {
      address,
      type: "wallet",
    };
  } else if (isSpamCheck && !isHoneypotCheck) {
    return {
      address,
      type: "token",
    };
  } else if (isHoneypotCheck) {
    return {
      address,
      type: "contract",
    };
  } else {
    return {
      address,
      type: "contract",
    };
  }
};
