export const detectAgentAddress = (
  text: string
): { address: string; type: "wallet" | "token" | "contract" } | null => {
  const ethAddressRegex = /0x[a-fA-F0-9]{40}/g;
  const solanaAddressRegex = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

  let matches = text.match(ethAddressRegex);
  let isSolana = false;

  if (!matches || matches.length === 0) {
    matches = text.match(solanaAddressRegex);
    isSolana = true;
  }

  if (!matches || matches.length === 0) return null;

  const address = matches[0];
  const lowercaseText = text.toLowerCase();

  if (isSolana) {
    return {
      address,
      type: "wallet",
    };
  }

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
