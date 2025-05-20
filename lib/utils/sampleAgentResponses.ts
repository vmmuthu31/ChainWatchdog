export const sampleAgentResponses: Record<string, string> = {
  "what is a honeypot token":
    "A honeypot token is a type of cryptocurrency scam where the smart contract is designed to prevent most or all users from selling their tokens. The contract may look legitimate at first glance, but contains hidden code that restricts selling to only certain addresses (usually the creator's). These scams lure investors with promises of huge returns, but once you buy the token, you cannot sell it.",

  "how to identify spam tokens":
    "To identify spam tokens, look for: 1) Tokens sent to your wallet without your consent, 2) Unknown or suspicious token names, 3) Zero or extremely low liquidity, 4) No real utility or purpose, 5) Airdropped in large quantities, 6) Requires approval to interact with suspicious contracts. Always check token contracts on blockchain explorers and avoid interacting with suspicious tokens.",

  "what is liquidity in crypto":
    "Liquidity in cryptocurrency refers to how easily a token can be bought or sold without causing significant price impact. High liquidity means many buyers and sellers are active, resulting in stable prices and easier trading. Low liquidity means fewer participants, leading to higher price volatility and slippage when trading. Liquidity is typically provided in pools on decentralized exchanges where users deposit token pairs to facilitate trading.",

  "how does the honeypot checker work":
    "Our honeypot checker analyzes smart contracts for potential scams using multiple methods: 1) We simulate buy and sell transactions to detect unusual tax rates or failures, 2) We analyze contract source code for suspicious patterns, 3) We check holder transactions to see if others can successfully sell tokens, 4) We verify LP token liquidity and locks. If any red flags are detected, the token is classified as a potential honeypot with varying risk levels based on the severity of issues found.",

  "explain spam token detection":
    "Our spam token detection uses the Covalent GoldRush API enhanced with custom filtering. We check: 1) Known spam token databases and blacklists, 2) Token distribution patterns - many wallets with tiny amounts is suspicious, 3) Contract code analysis for malicious functions, 4) Transaction volume and history - legitimate tokens have consistent, organic activity, 5) Market data like liquidity, trading volume, and price movements. Tokens are assigned confidence levels (YES, MAYBE, NO) for spam likelihood based on these factors.",

  "what are common crypto scams":
    "Common cryptocurrency scams include: 1) Honeypot tokens that can't be sold, 2) Rug pulls where developers abandon the project and take investor funds, 3) Phishing attacks that steal private keys or seed phrases, 4) Fake airdrops requiring connection to malicious contracts, 5) Pump and dump schemes that artificially inflate prices before selling, 6) Fake exchange or wallet websites that steal credentials, 7) Social engineering scams impersonating project team members. Always research thoroughly before investing and never share your private keys or seed phrases.",

  "how to check if a token is safe":
    "To check if a token is safe: 1) Use our honeypot checker to analyze the smart contract, 2) Verify the contract code is open source and audited, 3) Check liquidity is sufficient and locked, 4) Research the team - anonymous teams are higher risk, 5) Look for KYC verification and security audits, 6) Check community size and engagement, 7) Analyze tokenomics for unsustainable models, 8) Review the project roadmap and progress. No investment is risk-free, but these steps can help you avoid obvious scams.",
};
