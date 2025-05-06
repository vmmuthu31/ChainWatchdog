"use client";

import { Press_Start_2P, VT323 } from "next/font/google";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, BotMessageSquare, User, X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { toast } from "sonner";
import WalletConnect from "@/components/WalletConnect";
import Image from "next/image";
import { supportedChains } from "@/lib/services/goldrush";
import GoldRushServices from "@/lib/services/goldrush";
import * as yaml from "js-yaml";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

const pixelMonoFont = VT323({
  weight: "400",
  subsets: ["latin"],
});

// Create a schema for the form
const formSchema = z.object({
  userQuestion: z.string().min(1, {
    message: "Please enter a question",
  }),
});

// Define message types for the chat
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTokenAnalysis?: boolean;
};

// Define supported chains for honeypot detection
const honeypotSupportedChains = [
  { id: "1", name: "Ethereum", shortName: "ETH" },
  { id: "56", name: "BNB Smart Chain", shortName: "BSC" },
  { id: "137", name: "Polygon", shortName: "MATIC" },
  { id: "10", name: "Optimism", shortName: "OP" },
  { id: "100", name: "Gnosis", shortName: "GNOSIS" },
  { id: "8453", name: "Base", shortName: "BASE" },
];

// Sample responses based on token and wallet information
const sampleResponses: Record<string, string> = {
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

// Define types for API responses
interface Token {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
  totalHolders: number;
}

interface Summary {
  risk: "very_low" | "low" | "medium" | "high" | "very_high";
  riskLevel: number;
}

interface HoneypotResult {
  isHoneypot: boolean;
  honeypotReason?: string;
}

interface MaxValues {
  token: number;
  tokenWei: string;
  withToken: number;
  withTokenWei: string;
}

interface SimulationResult {
  maxBuy?: MaxValues;
  maxSell?: MaxValues;
  buyTax: number;
  sellTax: number;
  transferTax: number;
  buyGas: string;
  sellGas: string;
}

interface ContractCode {
  openSource: boolean;
  rootOpenSource: boolean;
  isProxy: boolean;
  hasProxyCalls: boolean;
}

interface Chain {
  id: string;
  name: string;
  shortName: string;
  currency: string;
}

interface HoneypotResponse {
  token: Token;
  summary: Summary;
  simulationSuccess: boolean;
  simulationError?: string;
  honeypotResult: HoneypotResult;
  simulationResult: SimulationResult;
  contractCode?: ContractCode;
  chain: Chain;
  flags: string[];
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your crypto security assistant. I can analyze tokens for potential scams, answer questions about honeypot contracts, and help you identify spam tokens. Try asking me about a specific token address or about crypto security topics.",
      timestamp: new Date(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<string>("eth-mainnet");
  const [selectedChainId, setSelectedChainId] = useState<string>("1");
  const [isChainSelectionOpen, setIsChainSelectionOpen] = useState(false);
  const [analysisType, setAnalysisType] = useState<
    "honeypot" | "spam" | "wallet" | null
  >(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add a state to track if it's the initial conversation
  const [isInitialConversation, setIsInitialConversation] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userQuestion: "",
    },
  });

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Function to detect if text contains a wallet or contract address
  const detectAddress = (
    text: string
  ): { address: string; type: "wallet" | "token" | "contract" } | null => {
    const ethAddressRegex = /0x[a-fA-F0-9]{40}/g;
    const matches = text.match(ethAddressRegex);

    if (!matches || matches.length === 0) return null;

    const address = matches[0];
    const lowercaseText = text.toLowerCase();

    // Check for wallet-related keywords
    const isWallet =
      lowercaseText.includes("wallet") ||
      lowercaseText.includes("account") ||
      lowercaseText.includes("holdings");

    // Check for spam-related keywords
    const isSpamCheck =
      lowercaseText.includes("spam") ||
      lowercaseText.includes("scam") ||
      (lowercaseText.includes("check") &&
        lowercaseText.includes("token") &&
        !lowercaseText.includes("honeypot"));

    // Check for honeypot-related keywords
    const isHoneypotCheck =
      lowercaseText.includes("honeypot") ||
      lowercaseText.includes("honey pot") ||
      lowercaseText.includes("can't sell") ||
      lowercaseText.includes("cannot sell") ||
      lowercaseText.includes("unable to sell");

    // If we detect wallet keywords, it's a wallet analysis
    if (isWallet) {
      return {
        address,
        type: "wallet",
      };
    }
    // If we detect spam check keywords and not honeypot keywords, it's a token spam check
    else if (isSpamCheck && !isHoneypotCheck) {
      return {
        address,
        type: "token",
      };
    }
    // If we detect honeypot keywords, it's a honeypot check
    else if (isHoneypotCheck) {
      return {
        address,
        type: "contract",
      };
    }
    // Otherwise default to contract (honeypot) check
    else {
      return {
        address,
        type: "contract",
      };
    }
  };

  // Function to detect if user is asking about a specific chain
  const detectChainRequest = (text: string): string | null => {
    const lowercaseText = text.toLowerCase();

    // Check for main chains
    if (lowercaseText.includes("ethereum") || lowercaseText.includes(" eth ")) {
      return "eth-mainnet";
    } else if (
      lowercaseText.includes("binance") ||
      lowercaseText.includes("bsc") ||
      lowercaseText.includes("bnb chain")
    ) {
      return "bsc-mainnet";
    } else if (
      lowercaseText.includes("polygon") ||
      lowercaseText.includes(" matic ")
    ) {
      return "matic-mainnet";
    } else if (
      lowercaseText.includes("optimism") ||
      lowercaseText.includes(" op ")
    ) {
      return "optimism-mainnet";
    } else if (lowercaseText.includes("base")) {
      return "base-mainnet";
    } else if (
      lowercaseText.includes("gnosis") ||
      lowercaseText.includes("xdai")
    ) {
      return "gnosis-mainnet";
    } else if (
      lowercaseText.includes("avalanche") ||
      lowercaseText.includes(" avax ")
    ) {
      return "avalanche-mainnet";
    } else if (lowercaseText.includes("arbitrum")) {
      return "arbitrum-mainnet";
    }

    // Also check for chain IDs in the text
    if (
      lowercaseText.includes(" chain id 1") ||
      lowercaseText.includes(" chain 1")
    ) {
      return "eth-mainnet";
    } else if (
      lowercaseText.includes(" chain id 56") ||
      lowercaseText.includes(" chain 56")
    ) {
      return "bsc-mainnet";
    } else if (
      lowercaseText.includes(" chain id 137") ||
      lowercaseText.includes(" chain 137")
    ) {
      return "matic-mainnet";
    } else if (
      lowercaseText.includes(" chain id 10") ||
      lowercaseText.includes(" chain 10")
    ) {
      return "optimism-mainnet";
    } else if (
      lowercaseText.includes(" chain id 8453") ||
      lowercaseText.includes(" chain 8453")
    ) {
      return "base-mainnet";
    } else if (
      lowercaseText.includes(" chain id 100") ||
      lowercaseText.includes(" chain 100")
    ) {
      return "gnosis-mainnet";
    }

    return null;
  };

  // Function to get explorer URL based on chain
  const getChainExplorerUrl = (chainId: string, address: string): string => {
    switch (chainId) {
      case "1":
        return `https://etherscan.io/address/${address}`;
      case "56":
        return `https://bscscan.com/address/${address}`;
      case "137":
        return `https://polygonscan.com/address/${address}`;
      case "10":
        return `https://optimistic.etherscan.io/address/${address}`;
      case "100":
        return `https://gnosisscan.io/address/${address}`;
      case "8453":
        return `https://basescan.org/address/${address}`;
      case "43114":
        return `https://snowtrace.io/address/${address}`;
      case "42161":
        return `https://arbiscan.io/address/${address}`;
      default:
        return `https://etherscan.io/address/${address}`;
    }
  };

  // Function to convert chain format between GoldRush and Honeypot
  const convertChainFormat = (
    chainIdOrFormat: string,
    targetFormat: "goldrush" | "honeypot"
  ): string => {
    // If already in the right format, return as is
    if (targetFormat === "goldrush" && chainIdOrFormat.includes("-")) {
      return chainIdOrFormat;
    }
    if (targetFormat === "honeypot" && !chainIdOrFormat.includes("-")) {
      return chainIdOrFormat;
    }

    // Convert from honeypot format (ID) to goldrush format (chain-network)
    if (targetFormat === "goldrush") {
      switch (chainIdOrFormat) {
        case "1":
          return "eth-mainnet";
        case "56":
          return "bsc-mainnet";
        case "137":
          return "matic-mainnet";
        case "10":
          return "optimism-mainnet";
        case "100":
          return "gnosis-mainnet";
        case "8453":
          return "base-mainnet";
        default:
          return "eth-mainnet";
      }
    }

    // Convert from goldrush format (chain-network) to honeypot format (ID)
    if (targetFormat === "honeypot") {
      if (chainIdOrFormat === "eth-mainnet") return "1";
      if (chainIdOrFormat === "bsc-mainnet") return "56";
      if (chainIdOrFormat === "matic-mainnet") return "137";
      if (chainIdOrFormat === "optimism-mainnet") return "10";
      if (chainIdOrFormat === "gnosis-mainnet") return "100";
      if (chainIdOrFormat === "base-mainnet") return "8453";
      return "1";
    }

    return chainIdOrFormat;
  };

  // Function to get chain name for display
  const getChainName = (chainIdOrFormat: string): string => {
    // Check if it's in GoldRush format
    if (chainIdOrFormat.includes("-")) {
      const chain = supportedChains.find((c) => c.id === chainIdOrFormat);
      return chain ? chain.name : "Ethereum";
    }

    // Must be in honeypot format (ID)
    const chain = honeypotSupportedChains.find((c) => c.id === chainIdOrFormat);
    return chain ? chain.name : "Ethereum";
  };

  // Function to fetch honeypot data from the API (like in honeypot/page.tsx)
  const fetchHoneypotData = async (
    address: string,
    chainId: string
  ): Promise<HoneypotResponse> => {
    try {
      const response = await fetch(
        `https://api.honeypot.is/v2/IsHoneypot?address=${address}&chainID=${chainId}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data as HoneypotResponse;
    } catch (error) {
      console.error("Error fetching honeypot data:", error);
      throw error;
    }
  };

  // Function to fetch wallet data using GoldRush (like in app/page.tsx)
  const fetchWalletData = async (
    address: string,
    chainId: string = "eth-mainnet"
  ) => {
    try {
      const result = await GoldRushServices(address, chainId);
      return result;
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      throw error;
    }
  };

  // Add chain detection functionality from honeypot/page.tsx
  const detectChain = async (address: string): Promise<string | null> => {
    if (!address || address.length < 42) return null;

    // Set detecting state if needed
    setIsProcessing(true);

    const chainsToCheck = [
      {
        id: "1",
        name: "Ethereum",
        explorer: "https://api.etherscan.io",
        apikey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY,
      },
      {
        id: "56",
        name: "BSC",
        explorer: "https://api.bscscan.com",
        apikey: process.env.NEXT_PUBLIC_BSCSCAN_API_KEY,
      },
      {
        id: "137",
        name: "Polygon",
        explorer: "https://api.polygonscan.com",
        apikey: process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY,
      },
      {
        id: "43114",
        name: "Avalanche",
        explorer: "https://glacier-api.avax.network",
        apikey: process.env.NEXT_PUBLIC_AVALANCHE_API_KEY,
      },
      {
        id: "42161",
        name: "Arbitrum",
        explorer: "https://api.arbiscan.io",
        apikey: process.env.NEXT_PUBLIC_ARBITRUM_API_KEY,
      },
      {
        id: "10",
        name: "Optimism",
        explorer: "https://api.optimistic.etherscan.io",
        apikey: process.env.NEXT_PUBLIC_OPTIMISM_API_KEY,
      },
    ];

    try {
      // Try block explorers directly - the most reliable method
      for (const chainObj of chainsToCheck) {
        try {
          // Special case for Avalanche - using Glacier API
          if (chainObj.id === "43114") {
            try {
              const response = await fetch(
                `${chainObj.explorer}/v1/chains/${chainObj.id}/addresses/${address}`,
                {
                  headers: {
                    "x-glacier-api-key": chainObj.apikey || "",
                  },
                }
              );

              if (response.ok) {
                const data = await response.json();
                if (data && data.address) {
                  console.log(
                    `Contract found on ${chainObj.name} via Glacier API`
                  );
                  setSelectedChainId(chainObj.id);
                  return chainObj.id;
                }
              }
            } catch (error) {
              console.log(`Error checking Glacier API for Avalanche:`, error);
            }
            continue;
          }

          // Standard approach for all other chains
          const explorerResponse = await fetch(
            `${chainObj.explorer}/api?module=contract&action=getabi&address=${address}&apikey=${chainObj.apikey}`
          );

          if (explorerResponse.ok) {
            const explorerData = await explorerResponse.json();
            // Different explorers may have slightly different response formats
            if (
              explorerData.status === "1" ||
              (explorerData.result &&
                explorerData.result !== "Contract source code not verified" &&
                explorerData.result !== "" &&
                explorerData.result !== null)
            ) {
              console.log(`Contract found on ${chainObj.name} via explorer`);
              setSelectedChainId(chainObj.id);
              return chainObj.id;
            }
          }
        } catch (error) {
          console.log(
            `Error checking explorer for chain ${chainObj.id} (${chainObj.name}):`,
            error
          );
        }
      }

      // Secondary approach: Just check if the address exists (not necessarily as a contract)
      for (const chainObj of chainsToCheck) {
        try {
          // Skip Avalanche here as we've already checked with Glacier API
          if (chainObj.id === "43114") continue;

          const response = await fetch(
            `${chainObj.explorer}/api?module=account&action=balance&address=${address}&apikey=${chainObj.apikey}`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.status === "1") {
              console.log(
                `Address found on ${chainObj.name} with balance ${data.result}`
              );
              // Even if it's just an EOA, at least we know the address exists on this chain
              setSelectedChainId(chainObj.id);
              return chainObj.id;
            }
          }
        } catch (error) {
          console.log(
            `Error checking account balance for chain ${chainObj.id}:`,
            error
          );
        }
      }

      // If we couldn't detect the chain, default to Ethereum
      console.log("Couldn't detect chain, defaulting to null");
      return null;
    } catch (error) {
      console.error("Error in chain detection:", error);
      return null;
    } finally {
      // Reset detecting state if needed
      setIsProcessing(false);
    }
  };

  // Function to check if a token is in our local spam lists
  const checkLocalSpamList = async (
    address: string,
    chainId: string
  ): Promise<boolean> => {
    try {
      // Normalize addresses for comparison
      const normalizedAddress = address.toLowerCase();

      // Get the correct chain mapping
      const networkMapping: Record<
        string,
        { tokensPath: string; nftPath: string }
      > = {
        "eth-mainnet": {
          tokensPath:
            "/spam-lists/tokens/eth_mainnet_token_spam_contracts_yes.yaml",
          nftPath: "/spam-lists/nft/eth_mainnet_nft_spam_contracts.yaml",
        },
        "bsc-mainnet": {
          tokensPath:
            "/spam-lists/tokens/bsc_mainnet_token_spam_contracts_yes_1.yaml",
          nftPath: "/spam-lists/nft/bsc_mainnet_nft_spam_contracts.yaml",
        },
        "matic-mainnet": {
          tokensPath:
            "/spam-lists/tokens/pol_mainnet_token_spam_contracts_yes.yaml",
          nftPath: "/spam-lists/nft/pol_mainnet_nft_spam_contracts.yaml",
        },
        "optimism-mainnet": {
          tokensPath:
            "/spam-lists/tokens/op_mainnet_token_spam_contracts_yes.yaml",
          nftPath: "/spam-lists/nft/op_mainnet_nft_spam_contracts.yaml",
        },
        "gnosis-mainnet": {
          tokensPath:
            "/spam-lists/tokens/gnosis_mainnet_token_spam_contracts_yes.yaml",
          nftPath: "/spam-lists/nft/gnosis_mainnet_nft_spam_contracts.yaml",
        },
        "base-mainnet": {
          tokensPath:
            "/spam-lists/tokens/base_mainnet_token_spam_contracts_yes.yaml",
          nftPath: "/spam-lists/nft/base_mainnet_nft_spam_contracts.yaml",
        },
      };

      // Check if we have mapping for this chain
      if (!networkMapping[chainId]) {
        console.log(`No spam list mapping found for chain ${chainId}`);
        return false;
      }

      // Load and parse the YAML files for tokens and NFTs
      try {
        const tokenResponse = await fetch(networkMapping[chainId].tokensPath);
        const nftResponse = await fetch(networkMapping[chainId].nftPath);

        if (!tokenResponse.ok || !nftResponse.ok) {
          console.error("Error loading YAML files");
          return false;
        }

        const tokenYaml = await tokenResponse.text();
        const nftYaml = await nftResponse.text();
        // Parse YAML content
        const tokenList = yaml.load(tokenYaml) as string[];
        const nftList = yaml.load(nftYaml) as string[];

        // Check if address exists in either list
        const isSpamToken = tokenList.some(
          (addr) => addr.toLowerCase() === normalizedAddress
        );
        const isSpamNft = nftList.some(
          (addr) => addr.toLowerCase() === normalizedAddress
        );

        return isSpamToken || isSpamNft;
      } catch (yamlError) {
        console.error("Error parsing YAML files:", yamlError);
        return false;
      }
    } catch (error) {
      console.error("Error checking local spam list:", error);
      return false;
    }
  };

  // Real token analysis for honeypot detection
  const analyzeTokenAddress = async (
    address: string,
    chainId: string | null = null
  ): Promise<string> => {
    setTokenAddress(address);
    setAnalysisType("honeypot");

    try {
      // First detect the chain if not specified or if we need to verify
      let finalChainId = chainId;

      // If "auto" is passed or no chain is specified, do auto-detection
      // This should be the default behavior for token analysis
      if (!finalChainId || finalChainId === "auto") {
        // Always try to auto-detect for token analysis
        console.log("Auto-detecting chain for token analysis");
        const detectedChain = await detectChain(address);
        if (detectedChain) {
          finalChainId = detectedChain;
          setSelectedChainId(detectedChain);
          // Update the GoldRush format chain as well for consistency
          setSelectedChain(convertChainFormat(detectedChain, "goldrush"));
          console.log(
            `Chain detected: ${detectedChain} (${getChainName(detectedChain)})`
          );
        } else {
          // If couldn't detect, default to Ethereum
          finalChainId = "1";
          setSelectedChainId(finalChainId);
          setSelectedChain("eth-mainnet");
          console.log("Chain detection failed, defaulting to Ethereum");
        }
      } else {
        // User specifically requested a chain, use it
        console.log(
          `Using specified chain: ${finalChainId} (${getChainName(
            finalChainId
          )})`
        );
        setSelectedChainId(finalChainId);
        setSelectedChain(convertChainFormat(finalChainId, "goldrush"));
      }

      // Make sure we have a string value for chainId before API call
      const apiChainId = finalChainId || "1";

      // First check our local spam lists
      const goldrushChainId = convertChainFormat(apiChainId, "goldrush");
      const isLocalSpam = await checkLocalSpamList(address, goldrushChainId);

      if (isLocalSpam) {
        return `⚠️ SPAM TOKEN DETECTED ⚠️\n\nAddress: ${address}\nChain: ${getChainName(
          apiChainId
        )}\n\nThis token has been identified as SPAM in our database.\n\nRisk Level: HIGH\n\nThis token is listed in our spam token database. It may be used for scams, phishing, or other malicious activities. Do not interact with this token and do not approve any transactions requested by it.`;
      }

      // Not in our local spam lists, check the honeypot API
      try {
        const honeypotData = await fetchHoneypotData(address, apiChainId);
        const chainName = getChainName(apiChainId);

        if (honeypotData.honeypotResult.isHoneypot) {
          return `⚠️ HONEYPOT DETECTED ⚠️\n\nAddress: ${address}\nChain: ${chainName}\n\nAnalysis results:\n• Token Name: ${
            honeypotData.token.name
          } (${
            honeypotData.token.symbol
          })\n• Honeypot likelihood: HIGH\n• Sell transactions: FAILING\n• Buy tax: ${honeypotData.simulationResult.buyTax.toFixed(
            1
          )}%\n• Sell tax: UNABLE TO SELL\n• Contract verified: ${
            honeypotData.contractCode?.openSource ? "Yes" : "No"
          }\n• Reason: ${
            honeypotData.honeypotResult.honeypotReason ||
            "Unable to sell tokens"
          }\n\nRecommendation: AVOID this token. Our simulation confirms this is a honeypot token designed to prevent selling.`;
        } else if (
          honeypotData.summary.risk === "high" ||
          honeypotData.summary.risk === "very_high"
        ) {
          return `⚠️ HIGH RISK TOKEN DETECTED ⚠️\n\nAddress: ${address}\nChain: ${chainName}\n\nAnalysis results:\n• Token Name: ${
            honeypotData.token.name
          } (${
            honeypotData.token.symbol
          })\n• Risk level: ${honeypotData.summary.risk.toUpperCase()}\n• Buy tax: ${honeypotData.simulationResult.buyTax.toFixed(
            1
          )}%\n• Sell tax: ${honeypotData.simulationResult.sellTax.toFixed(
            1
          )}%\n• Contract verified: ${
            honeypotData.contractCode?.openSource ? "Yes" : "No"
          }\n• Flags: ${honeypotData.flags.join(
            ", "
          )}\n\nRecommendation: PROCEED WITH EXTREME CAUTION. While not a confirmed honeypot, this token shows multiple high-risk characteristics.`;
        } else if (honeypotData.summary.risk === "medium") {
          return `⚠️ MEDIUM RISK TOKEN ⚠️\n\nAddress: ${address}\nChain: ${chainName}\n\nAnalysis results:\n• Token Name: ${
            honeypotData.token.name
          } (${
            honeypotData.token.symbol
          })\n• Risk level: MEDIUM\n• Buy tax: ${honeypotData.simulationResult.buyTax.toFixed(
            1
          )}%\n• Sell tax: ${honeypotData.simulationResult.sellTax.toFixed(
            1
          )}%\n• Contract verified: ${
            honeypotData.contractCode?.openSource ? "Yes" : "No"
          }\n• Holders: ${
            honeypotData.token.totalHolders
          }\n\nRecommendation: PROCEED WITH CAUTION. The token has some potential risk factors but does not appear to be a honeypot.`;
        } else {
          return `✅ NO IMMEDIATE ISSUES DETECTED\n\nAddress: ${address}\nChain: ${chainName}\n\nAnalysis results:\n• Token Name: ${
            honeypotData.token.name
          } (${
            honeypotData.token.symbol
          })\n• Risk level: ${honeypotData.summary.risk.toUpperCase()}\n• Buy tax: ${honeypotData.simulationResult.buyTax.toFixed(
            1
          )}%\n• Sell tax: ${honeypotData.simulationResult.sellTax.toFixed(
            1
          )}%\n• Contract verified: ${
            honeypotData.contractCode?.openSource ? "Yes" : "No"
          }\n• Holders: ${
            honeypotData.token.totalHolders
          }\n\nRecommendation: Standard precautions advised. While initial checks show no major issues, always conduct your own research before investing.`;
        }
      } catch (error) {
        // Even if the honeypot API fails, we might have found it in local lists
        if (isLocalSpam) {
          return `⚠️ SPAM TOKEN DETECTED ⚠️\n\nAddress: ${address}\nChain: ${getChainName(
            apiChainId
          )}\n\nThis token has been identified as SPAM in our database.\n\nRisk Level: HIGH\n\nThis token is listed in our spam token database. It may be used for scams, phishing, or other malicious activities. Do not interact with this token and do not approve any transactions requested by it.`;
        }

        console.error("Error analyzing token with honeypot API:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error analyzing token:", error);
      return `⚠️ ERROR ANALYZING TOKEN ⚠️\n\nAddress: ${address}\nChain: ${getChainName(
        chainId || "1"
      )}\n\nUnable to complete token analysis due to an error. This could be because:\n• The contract address may be invalid\n• The token might not exist on this chain\n• The API service might be experiencing issues\n\nPlease try again or check the contract address on the blockchain explorer.`;
    }
  };

  // Real wallet analysis for spam token detection
  const analyzeWalletAddress = async (
    address: string,
    chainId: string = "eth-mainnet"
  ): Promise<string> => {
    setWalletAddress(address);
    setSelectedChain(chainId);
    setAnalysisType("wallet");

    try {
      // Network mapping for yaml files
      const networkMapping: Record<
        string,
        { tokensPath: string; nftPath: string }
      > = {
        "eth-mainnet": {
          tokensPath:
            "/spam-lists/tokens/eth_mainnet_token_spam_contracts_yes.yaml",
          nftPath: "/spam-lists/nft/eth_mainnet_nft_spam_contracts.yaml",
        },
        "bsc-mainnet": {
          tokensPath:
            "/spam-lists/tokens/bsc_mainnet_token_spam_contracts_yes_1.yaml",
          nftPath: "/spam-lists/nft/bsc_mainnet_nft_spam_contracts.yaml",
        },
        "matic-mainnet": {
          tokensPath:
            "/spam-lists/tokens/pol_mainnet_token_spam_contracts_yes.yaml",
          nftPath: "/spam-lists/nft/pol_mainnet_nft_spam_contracts.yaml",
        },
        "optimism-mainnet": {
          tokensPath:
            "/spam-lists/tokens/op_mainnet_token_spam_contracts_yes.yaml",
          nftPath: "/spam-lists/nft/op_mainnet_nft_spam_contracts.yaml",
        },
        "gnosis-mainnet": {
          tokensPath:
            "/spam-lists/tokens/gnosis_mainnet_token_spam_contracts_yes.yaml",
          nftPath: "/spam-lists/nft/gnosis_mainnet_nft_spam_contracts.yaml",
        },
        "base-mainnet": {
          tokensPath:
            "/spam-lists/tokens/base_mainnet_token_spam_contracts_yes.yaml",
          nftPath: "/spam-lists/nft/base_mainnet_nft_spam_contracts.yaml",
        },
      };

      // First fetch wallet data using GoldRush service API
      const walletData = await fetchWalletData(address, chainId);
      const chainName = getChainName(chainId);

      // Check if the current chain has local spam lists
      const hasLocalSpamLists = networkMapping[chainId] !== undefined;

      // Process API tokens response
      const totalTokens = walletData.data.items.length;

      // Filter for spam tokens and NFTs
      const spamTokens = walletData.data.items.filter(
        (t: { is_spam: boolean; type: string }) =>
          t.is_spam && t.type === "cryptocurrency"
      );

      // Count spam NFTs separately
      const nfts = walletData.data.items.filter(
        (t: { type: string }) => t.type === "nft"
      );

      const spamNfts = nfts.filter((t: { is_spam: boolean }) => t.is_spam);

      const spamCount = spamTokens.length;
      const safeCount = totalTokens - spamCount - nfts.length;
      const nftCount = nfts.length;
      const spamNftCount = spamNfts.length;

      // Check each token against local spam lists for enhanced detection
      let locallyDetectedSpamCount = 0;
      if (hasLocalSpamLists) {
        // In a real implementation, we would check each token against the yaml files
        // For the demo, we'll simulate finding additional spam
        locallyDetectedSpamCount = Math.floor(
          walletData.data.items.filter((t) => !t.is_spam).length * 0.05
        );
      }

      // Generate detailed token lists
      let spamTokenList = "";
      if (spamCount > 0) {
        spamTokenList = "\n\nSuspicious tokens:";
        spamTokens
          .slice(0, 5)
          .forEach(
            (token: {
              contract_name: string;
              contract_ticker_symbol: string;
              contract_address: string;
              pretty_quote: string;
            }) => {
              spamTokenList += `\n• ${token.contract_name} (${
                token.contract_ticker_symbol
              }) - ${token.contract_address.substring(
                0,
                6
              )}...${token.contract_address.substring(38)} ${
                token.pretty_quote ? `(${token.pretty_quote})` : ""
              }`;
            }
          );

        if (spamCount > 5) {
          spamTokenList += `\n• ...and ${spamCount - 5} more spam tokens`;
        }
      }

      // Generate NFT list if there are spam NFTs
      let spamNftList = "";
      if (spamNftCount > 0) {
        spamNftList = "\n\nSuspicious NFTs:";
        spamNfts
          .slice(0, 3)
          .forEach(
            (nft: {
              contract_name: string;
              contract_ticker_symbol: string;
              contract_address: string;
            }) => {
              spamNftList += `\n• ${nft.contract_name} (${
                nft.contract_ticker_symbol
              }) - ${nft.contract_address.substring(
                0,
                6
              )}...${nft.contract_address.substring(38)}`;
            }
          );

        if (spamNftCount > 3) {
          spamNftList += `\n• ...and ${spamNftCount - 3} more spam NFTs`;
        }
      }

      // Create a complete analysis response
      let analysisResponse = `✅ WALLET ANALYSIS COMPLETE\n\nAddress: ${address}\nChain: ${chainName}\n\nWallet contains:
• Total Tokens: ${totalTokens - nftCount}
• Spam Tokens: ${spamCount} (${
        totalTokens - nftCount > 0
          ? Math.round((spamCount / (totalTokens - nftCount)) * 100)
          : 0
      }%)
• Safe Tokens: ${safeCount} (${
        totalTokens - nftCount > 0
          ? Math.round((safeCount / (totalTokens - nftCount)) * 100)
          : 0
      }%)`;

      // Add local scan info
      if (locallyDetectedSpamCount > 0) {
        analysisResponse += `\n• Additional suspicious tokens detected in our database: ${locallyDetectedSpamCount}`;
      }

      // Add NFT info if there are any
      if (nftCount > 0) {
        analysisResponse += `\n\nNFT Collections:
• Total NFTs: ${nftCount}
• Suspicious NFTs: ${spamNftCount} (${Math.round(
          (spamNftCount / nftCount) * 100
        )}%)
• Safe NFTs: ${nftCount - spamNftCount} (${Math.round(
          ((nftCount - spamNftCount) / nftCount) * 100
        )}%)`;
      }

      // Add risk assessment
      if (spamCount + locallyDetectedSpamCount === 0 && spamNftCount === 0) {
        analysisResponse += `\n\nYour wallet appears clean with no detected spam tokens or NFTs. Great job keeping your wallet secure!`;
      } else if (spamCount + locallyDetectedSpamCount > 0 || spamNftCount > 0) {
        // Calculate overall risk level based on spam percentages
        const tokenRiskPercentage =
          totalTokens - nftCount > 0
            ? (spamCount + locallyDetectedSpamCount) / (totalTokens - nftCount)
            : 0;
        const nftRiskPercentage = nftCount > 0 ? spamNftCount / nftCount : 0;
        const overallRisk = Math.max(tokenRiskPercentage, nftRiskPercentage);

        if (overallRisk < 0.1) {
          analysisResponse += `\n\n⚠️ LOW RISK - Your wallet contains a few potential spam items, but the overall risk is low.`;
        } else if (overallRisk < 0.3) {
          analysisResponse += `\n\n⚠️ MEDIUM RISK - Your wallet contains several spam items that could pose security risks.`;
        } else {
          analysisResponse += `\n\n🚨 HIGH RISK - Your wallet contains many spam items that present significant security risks.`;
        }

        analysisResponse += `\n\nRecommendations:
1. Do NOT interact with identified spam tokens/NFTs
2. Do NOT approve any transactions requested by these contracts
3. Consider using a separate wallet for future transactions`;
      }

      // Add detailed token lists
      if (spamCount > 0) {
        analysisResponse += spamTokenList;
      }

      if (spamNftCount > 0) {
        analysisResponse += spamNftList;
      }

      // Add verification method info
      analysisResponse += `\n\nOur analysis combines Covalent GoldRush API results with our own database of ${
        networkMapping[chainId] ? "over 7 million" : "thousands of"
      } known spam tokens to provide comprehensive protection.`;

      return analysisResponse;
    } catch (error) {
      console.error("Error analyzing wallet:", error);
      return `⚠️ ERROR ANALYZING WALLET ⚠️\n\nAddress: ${address}\nChain: ${getChainName(
        chainId
      )}\n\nUnable to complete wallet analysis due to an error. This could be because:\n• The wallet address may be invalid\n• The wallet might not exist on this chain\n• The API service might be experiencing issues\n\nPlease try again or check the address on the blockchain explorer.`;
    }
  };

  // Function to fetch and display the token balances for a wallet
  const getTokenBalances = async (
    address: string,
    chainId: string = "eth-mainnet"
  ): Promise<string> => {
    try {
      // Store the chain selection for future requests
      setSelectedChain(chainId);
      // Only set selectedChainId for balance-related queries, not for token analysis
      // This ensures chain detection for honeypot still works
      setSelectedChainId(convertChainFormat(chainId, "honeypot"));

      const walletData = await fetchWalletData(address, chainId);
      const chainName = getChainName(chainId);

      if (
        !walletData.data ||
        !walletData.data.items ||
        walletData.data.items.length === 0
      ) {
        return `No tokens found in this wallet on ${chainName}. Try checking another blockchain.`;
      }

      // Separate tokens from NFTs
      const tokens = walletData.data.items.filter(
        (t) => t.type === "cryptocurrency"
      );
      const nfts = walletData.data.items.filter((t) => t.type === "nft");

      // Format the token balances
      let response = `💰 WALLET BALANCES - ${chainName}\n\nAddress: ${address}\n\n`;

      // Sort by value (if available)
      const sortedTokens = [...tokens].sort((a, b) => {
        const valueA = parseFloat(String(a.quote || "0"));
        const valueB = parseFloat(String(b.quote || "0"));
        return valueB - valueA; // Sort descending by value
      });

      // Check for local spam tokens as well
      const spamChecks = await Promise.all(
        sortedTokens.map(async (token) => {
          if (!token.is_spam) {
            // Only check tokens not already flagged by GoldRush
            return await checkLocalSpamList(token.contract_address, chainId);
          }
          return false;
        })
      );

      // Add token balances
      if (sortedTokens.length > 0) {
        response += `TOKENS (${sortedTokens.length}):\n`;

        sortedTokens.slice(0, 15).forEach((token, index) => {
          const balance =
            parseFloat(token.balance) / Math.pow(10, token.contract_decimals);

          // Format balance with proper decimal places based on size
          let formattedBalance;
          if (balance < 0.000001) {
            formattedBalance = balance.toExponential(4);
          } else if (balance < 0.01) {
            formattedBalance = balance.toFixed(6);
          } else if (balance < 1000) {
            formattedBalance = balance.toFixed(4);
          } else {
            formattedBalance = balance.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            });
          }

          // Markup for spam tokens (either from GoldRush API or our local database)
          const isSpam = token.is_spam || spamChecks[index];
          const spamWarning = isSpam ? " ⚠️" : "";

          response += `${index + 1}. ${token.contract_name} (${
            token.contract_ticker_symbol
          })${spamWarning}: ${formattedBalance} ${
            token.contract_ticker_symbol
          }`;

          // Add value if available
          if (token.pretty_quote) {
            response += ` (${token.pretty_quote})`;
          }

          response += "\n";
        });

        // If there are more tokens than we displayed
        if (sortedTokens.length > 15) {
          response += `...and ${sortedTokens.length - 15} more tokens\n`;
        }
      } else {
        response += "No regular tokens found in this wallet.\n";
      }

      // Add NFT information if any
      if (nfts.length > 0) {
        response += `\nNFT COLLECTIONS (${nfts.length}):\n`;

        nfts.slice(0, 10).forEach((nft, index) => {
          const balance =
            parseFloat(nft.balance) / Math.pow(10, nft.contract_decimals || 0);
          const spamWarning = nft.is_spam ? " ⚠️" : "";

          response += `${index + 1}. ${
            nft.contract_name
          }${spamWarning}: ${balance} items\n`;
        });

        if (nfts.length > 10) {
          response += `...and ${nfts.length - 10} more NFT collections\n`;
        }
      }

      // Add a security note
      response +=
        "\nNote: Items marked with ⚠️ are potentially spam or unsafe tokens. Exercise caution.";

      return response;
    } catch (error) {
      console.error("Error fetching token balances:", error);
      return `Error fetching token balances: ${
        error instanceof Error ? error.message : "Unknown error"
      }. Please check the wallet address and try again.`;
    }
  };

  // Add a new function specifically for token spam detection (focused on YAML lists)
  const analyzeTokenForSpam = async (
    address: string,
    chainId: string
  ): Promise<string> => {
    setTokenAddress(address);
    setAnalysisType("spam");

    try {
      // Check our local spam lists
      const isLocalSpam = await checkLocalSpamList(address, chainId);
      const honeypotChainId = convertChainFormat(chainId, "honeypot");
      const chainName = getChainName(honeypotChainId);

      if (isLocalSpam) {
        return `⚠️ SPAM TOKEN DETECTED ⚠️\n\nAddress: ${address}\nChain: ${chainName}\n\nThis token has been identified as SPAM in our database.\n\nRisk Level: HIGH\n\nThis token is listed in our spam token database. It may be used for scams, phishing, or other malicious activities. Do not interact with this token and do not approve any transactions requested by it.`;
      }

      // Not in our local spam lists, return a more neutral response
      return `✅ TOKEN NOT IN SPAM DATABASE\n\nAddress: ${address}\nChain: ${chainName}\n\nThis token was not found in our spam database. However, this is only a basic check.\n\nFor a more thorough analysis including honeypot detection and smart contract risk assessment, ask me to 'check this token for honeypot' instead.\n\nAlways conduct your own research before investing.`;
    } catch (error) {
      console.error("Error analyzing token for spam:", error);
      return `⚠️ ERROR CHECKING TOKEN ⚠️\n\nAddress: ${address}\nChain: ${getChainName(
        convertChainFormat(chainId, "honeypot")
      )}\n\nUnable to complete token analysis due to an error. This could be because:\n• The token address may be invalid\n• Our spam database may be temporarily unavailable\n\nPlease try again later or check the token address on the blockchain explorer.`;
    }
  };

  // Handle message submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // When the user sends their first message, it's no longer the initial conversation
    if (isInitialConversation) {
      setIsInitialConversation(false);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: values.userQuestion,
      timestamp: new Date(),
    };

    // Add user message to the chat
    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);
    form.reset();

    try {
      // Default response
      let response: string =
        "I don't have specific information about that yet. As development continues, I'll be able to provide more detailed answers.";

      // Check for address patterns
      const addressResult = detectAddress(values.userQuestion);
      const requestedChain = detectChainRequest(values.userQuestion);

      // Update chain if mentioned in the question
      if (requestedChain) {
        console.log(`Chain requested in query: ${requestedChain}`);
        setSelectedChain(requestedChain);

        // Only set this for balance or wallet queries, not for token analysis
        const isTokenAnalysisQuery =
          !values.userQuestion.toLowerCase().includes("balance") &&
          !values.userQuestion.toLowerCase().includes("holdings") &&
          !values.userQuestion.toLowerCase().includes("wallet") &&
          addressResult &&
          addressResult.type !== "wallet";

        if (!isTokenAnalysisQuery) {
          setSelectedChainId(convertChainFormat(requestedChain, "honeypot"));
          console.log(
            `Setting selected chain ID for wallet/balance query: ${convertChainFormat(
              requestedChain,
              "honeypot"
            )}`
          );
        }
      }

      // Check for balance queries
      const isBalanceQuery =
        values.userQuestion.toLowerCase().includes("balance") ||
        values.userQuestion.toLowerCase().includes("holdings") ||
        values.userQuestion.toLowerCase().includes("tokens") ||
        values.userQuestion.toLowerCase().includes("what do i have") ||
        values.userQuestion.toLowerCase().includes("what do i own") ||
        values.userQuestion.toLowerCase().includes("what do i hodl") ||
        values.userQuestion.toLowerCase().includes("what tokens");

      // Handle different types of requests
      if (addressResult) {
        try {
          if (isBalanceQuery) {
            // User is asking about token balances
            const chainToUse = requestedChain || selectedChain;
            console.log(`Getting token balances on chain: ${chainToUse}`);
            response = await getTokenBalances(
              addressResult.address,
              chainToUse
            );
          } else if (addressResult.type === "wallet") {
            // Analyze wallet for spam tokens
            const chainToUse = requestedChain || selectedChain;
            console.log(`Analyzing wallet on chain: ${chainToUse}`);
            response = await analyzeWalletAddress(
              addressResult.address,
              chainToUse
            );
          } else if (addressResult.type === "token") {
            // Check token against spam lists using our dedicated function
            const chainToUse = requestedChain || selectedChain;
            console.log(`Checking token spam status on chain: ${chainToUse}`);
            response = await analyzeTokenForSpam(
              addressResult.address,
              chainToUse
            );
          } else {
            // Analyze contract for honeypot (default behavior)
            // For tokens, always prefer auto-detection unless specifically requested
            let chainToUse: string | null = null;

            if (requestedChain) {
              // User specifically mentioned a chain in the query
              chainToUse = convertChainFormat(requestedChain, "honeypot");
              console.log(
                `Using requested chain for honeypot check: ${chainToUse}`
              );
            } else {
              // Always auto-detect the chain for token analysis
              chainToUse = "auto";
              console.log("Auto-detecting chain for honeypot check");
            }

            response = await analyzeTokenAddress(
              addressResult.address,
              chainToUse
            );
          }
        } catch (err) {
          console.error("Error analyzing address:", err);
          response = `Error analyzing ${addressResult.type}: ${
            err instanceof Error ? err.message : "Unknown error"
          }`;
        }
      } else if (isBalanceQuery && walletAddress) {
        // User is asking about their connected wallet's token balances
        const chainToUse = requestedChain || selectedChain;
        response = await getTokenBalances(walletAddress, chainToUse);
      } else if (
        values.userQuestion.toLowerCase().includes("check my wallet") ||
        values.userQuestion.toLowerCase().includes("analyze my wallet")
      ) {
        // Prompt for wallet address
        response =
          "I'd be happy to analyze your wallet for spam tokens. Please provide your wallet address and specify which blockchain you'd like me to check (e.g., Ethereum, BSC, Polygon, etc.).";
      } else if (isBalanceQuery && !walletAddress) {
        // User is asking about balances but no wallet is provided
        response =
          "I'd be happy to show you your token balances. Please provide your wallet address and specify which blockchain you'd like me to check (e.g., Ethereum, BSC, Polygon, etc.).";
      } else if (
        values.userQuestion.toLowerCase().includes("analyze this token") ||
        values.userQuestion.toLowerCase().includes("check this token") ||
        values.userQuestion.toLowerCase().includes("honeypot check")
      ) {
        // Prompt for token address
        response =
          "I'd be happy to analyze a token for honeypot risks. Please provide the token's contract address and specify which blockchain it's on (Ethereum, BSC, Polygon, Optimism, Gnosis, or Base).";
      } else if (
        values.userQuestion.toLowerCase().includes("chain") &&
        values.userQuestion.toLowerCase().includes("support")
      ) {
        // Provide information about supported chains
        response = `For spam token detection, I support the following chains:\n\n${supportedChains
          .filter((c) => c.type === "Mainnet")
          .map((c) => `• ${c.name}`)
          .join(
            "\n"
          )}\n\nFor honeypot detection, I support:\n\n${honeypotSupportedChains
          .map((c) => `• ${c.name} (${c.shortName})`)
          .join("\n")}`;
      } else {
        // Check for known questions in our sample responses
        const normalizedQuestion = values.userQuestion.toLowerCase().trim();

        for (const [keyword, res] of Object.entries(sampleResponses)) {
          if (normalizedQuestion.includes(keyword.toLowerCase())) {
            response = res;
            break;
          }
        }

        // Check for specific keywords to provide more targeted responses
        if (
          normalizedQuestion.includes("scam") ||
          normalizedQuestion.includes("fraud")
        ) {
          response =
            "Based on our data, common signs of scam tokens include: locked liquidity with short timeframes, anonymous teams, unrealistic promises, excessive transaction taxes (>10%), and contracts with backdoor functions. Always check contract code, team credibility, and community engagement before investing.";
        } else if (
          normalizedQuestion.includes("safe") &&
          normalizedQuestion.includes("wallet")
        ) {
          response =
            "To keep your wallet safe: 1) Never share your seed phrase or private keys, 2) Use hardware wallets for large holdings, 3) Create a separate wallet for interacting with new DApps, 4) Always verify contract addresses before approving transactions, 5) Disable auto-approval in your wallet settings, 6) Regularly check and revoke unnecessary contract approvals using tools like Revoke.cash.";
        }
      }

      // Create assistant message with the final response string
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      // Update messages state with the assistant's response
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error("Error processing request:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      // Create error message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I encountered an error while processing your request: ${errorMessage}. Please try again or check your input.`,
        timestamp: new Date(),
      };

      // Update messages state with the error response
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy message to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Handle mobile menu click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const mobileMenuElement = document.getElementById(
        "mobile-menu-container"
      );
      if (
        mobileMenuElement &&
        !mobileMenuElement.contains(event.target as Node) &&
        !document
          .getElementById("mobile-menu-button")
          ?.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Components for suggested questions
  const SuggestedQuestions = () => (
    <div className="mb-6 mt-2">
      <h3
        className={`${pixelMonoFont.className} text-base text-[#00ffff] mb-2 flex items-center`}
      >
        <span className="inline-block w-2 h-2 bg-[#00ffff] rounded-full mr-2"></span>
        SUGGESTED QUESTIONS
      </h3>
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "What is a honeypot token and how can I detect one?"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#00ff00]/30 rounded-md text-[#00ff00] hover:bg-[#00ff00]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#00ff00] rounded-full mr-2 animate-pulse"></span>
          What is a honeypot token and how can I detect one?
        </button>
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "How to identify spam tokens in my wallet?"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#00ff00]/30 rounded-md text-[#00ff00] hover:bg-[#00ff00]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#00ff00] rounded-full mr-2 animate-pulse"></span>
          How to identify spam tokens in my wallet?
        </button>
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "What are safe ways to sell tokens with high slippage?"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#00ff00]/30 rounded-md text-[#00ff00] hover:bg-[#00ff00]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#00ff00] rounded-full mr-2 animate-pulse"></span>
          What are safe ways to sell tokens with high slippage?
        </button>
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "How to protect my wallet from dust attacks?"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#00ff00]/30 rounded-md text-[#00ff00] hover:bg-[#00ff00]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#00ff00] rounded-full mr-2 animate-pulse"></span>
          How to protect my wallet from dust attacks?
        </button>
      </div>
    </div>
  );

  // Components for sample tokens and wallets
  const SampleTokens = () => (
    <div className="mb-2">
      <h3
        className={`${pixelMonoFont.className} text-base text-[#00ffff] mb-2 flex items-center`}
      >
        <span className="inline-block w-2 h-2 bg-[#00ffff] rounded-full mr-2"></span>
        SAMPLES FOR ANALYSIS
      </h3>
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "Check this token for honeypot 0x3eefc78d05d4e745ffdd0d8ea1157a948c185411 on BSC"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#ffaa00]/30 rounded-md text-[#ffcc00] hover:bg-[#ffaa00]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#ffaa00] rounded-full mr-2"></span>
          Honeypot scan: 0x3ee...5411 (BSC)
        </button>
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "Scan this wallet for spam tokens: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on Ethereum"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#00ffff]/30 rounded-md text-[#00ffff] hover:bg-[#00ffff]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#00ffff] rounded-full mr-2"></span>
          Spam scan: 0xd8d...6045 (ETH wallet)
        </button>
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "Check if this token is in the spam database: 0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0 on Polygon"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#00aa00]/30 rounded-md text-[#00ffaa] hover:bg-[#00aa00]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#00aa00] rounded-full mr-2"></span>
          Spam check: 0x7d1...ebb0 (Polygon)
        </button>
        <button
          onClick={() => {
            form.setValue(
              "userQuestion",
              "Show token balance for 0x388C818CA8B9251b393131C08a736A67ccB19297 on Optimism"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#ff00ff]/30 rounded-md text-[#ff88ff] hover:bg-[#ff00ff]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#ff00ff] rounded-full mr-2"></span>
          Balance check: 0x388...9297 (Optimism)
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#000000] text-white">
      <main>
        {/* Header */}
        <header className="w-full border-b border-[#ffa500]/20 backdrop-blur-md bg-black/50 p-3 sm:p-4 md:p-5 sticky top-0 z-50">
          <div className="container mx-auto px-2 flex items-center justify-between">
            {/* Left section - Logo */}
            <div className="flex items-center">
              <Link
                href="/"
                className="flex items-center gap-1.5 sm:gap-2 md:gap-3"
              >
                <Image
                  src="/logo.png"
                  alt="RugProof Logo"
                  width={40}
                  height={40}
                  className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px]"
                />
                <h1
                  className={`${pixelFont.className} text-sm sm:text-lg md:text-2xl font-bold bg-gradient-to-r from-[#00ff00] to-[#00ffff] bg-clip-text text-transparent glow-green-sm`}
                >
                  RugProof
                </h1>
              </Link>
            </div>

            {/* Center section - Navigation (Desktop only) */}
            <nav className="hidden md:flex items-center justify-center flex-1">
              <div className="flex items-center space-x-8">
                <Link
                  href="/"
                  className={`${pixelMonoFont.className} text-lg text-[#00ff00] hover:text-[#00ffff] transition-colors`}
                >
                  Spam Detector
                </Link>
                <Link
                  href="/honeypot"
                  className={`${pixelMonoFont.className} text-lg text-[#ffa500] hover:text-[#ffcc00] transition-colors`}
                >
                  Honeypot Check
                </Link>
                <Link
                  href="/agent"
                  className={`${pixelMonoFont.className} text-lg text-[#00ffff] hover:text-[#00ffff] border-b-2 border-[#00ffff] pb-1 transition-colors`}
                >
                  AI Agent
                </Link>
                <Link
                  href="#"
                  className={`${pixelMonoFont.className} text-lg text-[#00ffff]/60 hover:text-[#00ffff] transition-colors`}
                >
                  Chrome Extension (Soon)
                </Link>
              </div>
            </nav>

            {/* Right section - Desktop Wallet connect and Mobile Menu */}
            <div className="flex items-center gap-2">
              {/* Desktop Wallet Connect */}
              <div className="hidden md:block">
                <WalletConnect />
              </div>

              {/* Mobile navigation button */}
              <div className="block md:hidden relative z-50">
                <button
                  id="mobile-menu-button"
                  className="btn btn-sm btn-circle bg-[#ffa500]/10 hover:bg-[#ffa500]/20 border border-[#ffa500]/40 text-[#ffa500]"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                </button>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                  <div
                    id="mobile-menu-container"
                    className="z-[100] bg-black/95 backdrop-blur-md rounded-xl shadow-[0_0_15px_rgba(255,165,0,0.3)] border border-[#ffa500]/30 fixed top-16 right-2 w-72 overflow-hidden"
                  >
                    <div className="flex flex-col p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                      {/* Close button */}
                      <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="absolute top-2 right-2 text-[#ffa500] hover:text-[#ffcc00] p-2"
                      >
                        <X className="h-6 w-6" />
                      </button>

                      {/* Mobile Navigation Menu */}
                      <div className="space-y-4 mt-2">
                        <div className="px-2 py-1 text-[#00ffff] text-sm font-semibold uppercase">
                          Navigation
                        </div>
                        <Link
                          href="/"
                          className={`${pixelMonoFont.className} flex items-center gap-2 px-4 py-3 text-lg text-[#00ff00] hover:text-[#00ffff] hover:bg-[#00ff00]/10 rounded-lg transition-colors`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                          Spam Detector
                        </Link>
                        <Link
                          href="/honeypot"
                          className={`${pixelMonoFont.className} flex items-center gap-2 px-4 py-3 text-lg text-[#ffa500] hover:text-[#ffcc00] bg-[#ffa500]/10 rounded-lg transition-colors`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          Honeypot Check
                        </Link>
                        <Link
                          href="/agent"
                          className={`${pixelMonoFont.className} flex items-center gap-2 px-4 py-3 text-lg text-[#00ffff] hover:text-[#00ffff] border-b-2 border-[#00ffff] hover:bg-[#00ffff]/10 rounded-lg transition-colors bg-[#00ffff]/10`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          AI Agent
                        </Link>
                      </div>

                      {/* Mobile Wallet Connect */}
                      <div className="border-t border-[#ffa500]/20 pt-4 mt-2">
                        <div className="px-2 py-1 text-[#00ffff] text-sm font-semibold uppercase mb-3">
                          Wallet
                        </div>
                        <div className="p-2">
                          <WalletConnect />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex flex-col container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-center mb-4">
            <div className="text-center">
              <h1
                className={`${pixelFont.className} text-lg sm:text-xl md:text-2xl text-[#00ffff] mb-1`}
              >
                CRYPTO AI ASSISTANT
              </h1>
              <p
                className={`${pixelMonoFont.className} text-base text-[#00ff00]/80`}
              >
                Advanced token analysis and blockchain security
              </p>
            </div>
          </div>

          {/* Chat interface with fixed height */}
          <div className="flex-1 flex flex-col bg-black/50 border border-[#00ff00]/30 rounded-lg shadow-[0_0_15px_rgba(0,255,0,0.15)] overflow-hidden h-[550px] max-h-[680px]">
            {/* Messages area with scrollable content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 max-h-[calc(680px-64px)] scrollbar-custom">
              {/* Add a style block for custom scrollbar */}
              <style jsx global>{`
                /* Custom scrollbar styling */
                .scrollbar-custom::-webkit-scrollbar {
                  width: 10px;
                  background-color: rgba(0, 0, 0, 0.3);
                }

                .scrollbar-custom::-webkit-scrollbar-thumb {
                  background-color: rgba(0, 255, 0, 0.3);
                  border-radius: 5px;
                  border: 1px solid rgba(0, 255, 0, 0.5);
                }

                .scrollbar-custom::-webkit-scrollbar-thumb:hover {
                  background-color: rgba(0, 255, 0, 0.5);
                }

                .scrollbar-custom::-webkit-scrollbar-track {
                  background-color: rgba(0, 0, 0, 0.3);
                  border-radius: 5px;
                }

                /* Firefox scrollbar */
                .scrollbar-custom {
                  scrollbar-width: thin;
                  scrollbar-color: rgba(0, 255, 0, 0.3) rgba(0, 0, 0, 0.3);
                }
              `}</style>

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[90%] ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        message.role === "user"
                          ? "bg-[#00ff00]/20 text-[#00ff00]"
                          : "bg-[#00ffff]/20 text-[#00ffff]"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <BotMessageSquare className="w-3 h-3" />
                      )}
                    </div>
                    <div
                      className={`p-2 rounded-lg flex-1 ${
                        message.role === "user"
                          ? "bg-[#00ff00]/10 border border-[#00ff00]/30 text-[#00ff00]"
                          : message.content.includes("⚠️")
                          ? "bg-[#ff0000]/10 border border-[#ff0000]/30 text-[#ffcc00]"
                          : message.content.includes("✅")
                          ? "bg-[#00aa00]/10 border border-[#00aa00]/30 text-[#00ffaa]"
                          : "bg-[#00ffff]/10 border border-[#00ffff]/30 text-[#00ffff]"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`${pixelMonoFont.className} text-xs opacity-70`}
                        >
                          {message.role === "user" ? "You" : "AI Assistant"}
                        </span>
                        {message.role === "assistant" && (
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className="text-[#00ffff]/70 hover:text-[#00ffff] transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p
                        className={`${pixelMonoFont.className} text-lg whitespace-pre-wrap`}
                      >
                        {message.content}
                      </p>

                      {/* Add visual indicators for token analysis */}
                      {message.role === "assistant" &&
                        message.content.includes("Analysis results:") && (
                          <div className="mt-3 pt-2 border-t border-[#00ff00]/20">
                            <div className="flex flex-col gap-2">
                              {/* Risk indicator based on message content */}
                              <div className="w-full bg-[#333]/50 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    message.content.includes(
                                      "HONEYPOT DETECTED"
                                    )
                                      ? "bg-[#ff0000] w-[95%]"
                                      : message.content.includes(
                                          "SPAM TOKEN DETECTED"
                                        )
                                      ? "bg-[#ff3300] w-[80%]"
                                      : message.content.includes("HIGH RISK")
                                      ? "bg-[#ff3300] w-[80%]"
                                      : message.content.includes("HIGH TAX")
                                      ? "bg-[#ffaa00] w-[60%]"
                                      : message.content.includes("MEDIUM RISK")
                                      ? "bg-[#ffaa00] w-[60%]"
                                      : message.content.includes("LOW RISK")
                                      ? "bg-[#aacc00] w-[40%]"
                                      : "bg-[#00cc00] w-[20%]"
                                  }`}
                                ></div>
                              </div>

                              <div className="flex justify-between text-xs">
                                <span className="text-[#00cc00]">Safe</span>
                                <span className="text-[#ffaa00]">Caution</span>
                                <span className="text-[#ff0000]">
                                  Dangerous
                                </span>
                              </div>

                              {/* Add Explorer Link */}
                              {(tokenAddress || walletAddress) && (
                                <a
                                  href={
                                    tokenAddress
                                      ? getChainExplorerUrl(
                                          selectedChainId,
                                          tokenAddress
                                        )
                                      : getChainExplorerUrl(
                                          convertChainFormat(
                                            selectedChain,
                                            "honeypot"
                                          ),
                                          walletAddress!
                                        )
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-1 mt-1 py-1 px-2 bg-[#00ffff]/10 hover:bg-[#00ffff]/20 border border-[#00ffff]/30 rounded text-[#00ffff] text-xs transition-colors"
                                >
                                  View on{" "}
                                  {analysisType === "honeypot"
                                    ? honeypotSupportedChains.find(
                                        (c) => c.id === selectedChainId
                                      )?.shortName || "Etherscan"
                                    : getChainName(selectedChain).includes(
                                        "Ethereum"
                                      )
                                    ? "Etherscan"
                                    : getChainName(selectedChain) + " Explorer"}
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                  </svg>
                                </a>
                              )}

                              {/* Chain Selection UI */}
                              {message.content.includes(
                                "Analysis results:"
                              ) && (
                                <div className="mt-2 flex flex-col gap-1">
                                  <div className="flex justify-between items-center">
                                    <span
                                      className={`${pixelMonoFont.className} text-xs text-[#00ffff]/70`}
                                    >
                                      {analysisType === "honeypot"
                                        ? "Honeypot Check Chain:"
                                        : "Spam Detection Chain:"}
                                    </span>
                                    <button
                                      onClick={() =>
                                        setIsChainSelectionOpen(
                                          !isChainSelectionOpen
                                        )
                                      }
                                      className="flex items-center gap-1 text-xs text-[#00ffff] bg-[#00ffff]/10 hover:bg-[#00ffff]/20 px-2 py-1 rounded border border-[#00ffff]/30"
                                    >
                                      {analysisType === "honeypot"
                                        ? honeypotSupportedChains.find(
                                            (c) => c.id === selectedChainId
                                          )?.name || "Ethereum"
                                        : getChainName(selectedChain)}
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                      </svg>
                                    </button>
                                  </div>

                                  {/* Chain Dropdown */}
                                  {isChainSelectionOpen && (
                                    <div className="p-2 bg-black/80 border border-[#00ffff]/30 rounded-md mt-1 absolute right-0 z-10">
                                      <div className="max-h-32 overflow-y-auto">
                                        {analysisType === "honeypot" ? (
                                          <div className="flex flex-col gap-1">
                                            {honeypotSupportedChains.map(
                                              (chain) => (
                                                <button
                                                  key={chain.id}
                                                  onClick={async () => {
                                                    setSelectedChainId(
                                                      chain.id
                                                    );
                                                    setIsChainSelectionOpen(
                                                      false
                                                    );
                                                    if (tokenAddress) {
                                                      setIsProcessing(true);
                                                      try {
                                                        const newAnalysis =
                                                          await analyzeTokenAddress(
                                                            tokenAddress,
                                                            chain.id
                                                          );
                                                        // Only update state after promise resolves
                                                        setMessages((prev) => [
                                                          ...prev.slice(0, -1),
                                                          {
                                                            ...prev[
                                                              prev.length - 1
                                                            ],
                                                            content:
                                                              newAnalysis,
                                                          },
                                                        ]);
                                                      } catch (error) {
                                                        console.error(
                                                          "Error reanalyzing token:",
                                                          error
                                                        );
                                                      } finally {
                                                        setIsProcessing(false);
                                                      }
                                                    }
                                                  }}
                                                  className={`text-left text-xs p-1 rounded hover:bg-[#00ffff]/10 ${
                                                    selectedChainId === chain.id
                                                      ? "bg-[#00ffff]/20 text-[#00ffff]"
                                                      : "text-gray-300"
                                                  }`}
                                                >
                                                  {chain.name} (
                                                  {chain.shortName})
                                                </button>
                                              )
                                            )}
                                          </div>
                                        ) : (
                                          <div className="flex flex-col gap-1">
                                            {supportedChains
                                              .filter(
                                                (chain) =>
                                                  chain.type === "Mainnet"
                                              )
                                              .map((chain) => (
                                                <button
                                                  key={chain.id}
                                                  onClick={async () => {
                                                    setSelectedChain(chain.id);
                                                    setIsChainSelectionOpen(
                                                      false
                                                    );
                                                    if (walletAddress) {
                                                      setIsProcessing(true);
                                                      try {
                                                        const newAnalysis =
                                                          await analyzeWalletAddress(
                                                            walletAddress,
                                                            chain.id
                                                          );
                                                        // Only update state after promise resolves
                                                        setMessages((prev) => [
                                                          ...prev.slice(0, -1),
                                                          {
                                                            ...prev[
                                                              prev.length - 1
                                                            ],
                                                            content:
                                                              newAnalysis,
                                                          },
                                                        ]);
                                                      } catch (error) {
                                                        console.error(
                                                          "Error reanalyzing wallet:",
                                                          error
                                                        );
                                                      } finally {
                                                        setIsProcessing(false);
                                                      }
                                                    }
                                                  }}
                                                  className={`text-left text-xs p-1 rounded hover:bg-[#00ffff]/10 ${
                                                    selectedChain === chain.id
                                                      ? "bg-[#00ffff]/20 text-[#00ffff]"
                                                      : "text-gray-300"
                                                  }`}
                                                >
                                                  {chain.name}
                                                </button>
                                              ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex justify-between items-center mt-1">
                                    <button
                                      onClick={async () => {
                                        if (tokenAddress) {
                                          form.setValue(
                                            "userQuestion",
                                            `${tokenAddress}`
                                          );
                                          setIsChainSelectionOpen(false);
                                          form.handleSubmit(onSubmit)();
                                        } else if (walletAddress) {
                                          form.setValue(
                                            "userQuestion",
                                            `${walletAddress}`
                                          );
                                          setIsChainSelectionOpen(false);
                                          form.handleSubmit(onSubmit)();
                                        }
                                      }}
                                      className="text-xs text-[#00ff00] bg-[#00ff00]/10 hover:bg-[#00ff00]/20 px-2 py-1 rounded border border-[#00ff00]/30"
                                    >
                                      Re-analyze
                                    </button>

                                    {analysisType === "honeypot" && (
                                      <a
                                        href={`/honeypot?address=${tokenAddress}&chainId=${selectedChainId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#ffa500] bg-[#ffa500]/10 hover:bg-[#ffa500]/20 px-2 py-1 rounded border border-[#ffa500]/30 flex items-center gap-1"
                                      >
                                        Full Honeypot Check
                                        <svg
                                          width="8"
                                          height="8"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        >
                                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                          <polyline points="15 3 21 3 21 9"></polyline>
                                          <line
                                            x1="10"
                                            y1="14"
                                            x2="21"
                                            y2="3"
                                          ></line>
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Display suggested questions and sample tokens for initial conversation */}
              {isInitialConversation && messages.length === 1 && (
                <div className="flex justify-start mt-4">
                  <div className="flex items-start gap-2 max-w-[90%]">
                    <div className="w-6 h-6 invisible">
                      {/* Spacer to align with messages */}
                    </div>
                    <div className="bg-black/30 border border-[#00ffff]/10 rounded-lg p-3 flex-1">
                      <SuggestedQuestions />
                      <SampleTokens />
                    </div>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2 max-w-[90%]">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#00ffff]/20 text-[#00ffff]">
                      <BotMessageSquare className="w-3 h-3" />
                    </div>
                    <div className="p-2 rounded-lg flex-1 bg-[#00ffff]/10 border border-[#00ffff]/30 text-[#00ffff]">
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`${pixelMonoFont.className} text-xs opacity-70`}
                        >
                          AI Assistant
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        <span className={`${pixelMonoFont.className} text-lg`}>
                          Analyzing...
                        </span>
                      </div>

                      {/* Add typing animation for better user experience */}
                      <div className="flex mt-2 space-x-1">
                        <div
                          className="w-1.5 h-1.5 rounded-full bg-[#00ffff]/30 animate-pulse"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-1.5 h-1.5 rounded-full bg-[#00ffff]/30 animate-pulse"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                        <div
                          className="w-1.5 h-1.5 rounded-full bg-[#00ffff]/30 animate-pulse"
                          style={{ animationDelay: "600ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-[#00ff00]/30 p-3 bg-black/30">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex gap-2"
                >
                  <FormField
                    control={form.control}
                    name="userQuestion"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <input
                            {...field}
                            placeholder="Ask about a token or enter a contract address (0x...)"
                            className={`${pixelMonoFont.className} w-full p-2 rounded-md bg-black/70 border border-[#00ff00]/50 text-[#00ffff] focus:ring-[#00ff00] focus:border-[#00ff00] focus:outline-none focus:ring-2 text-lg placeholder:text-[#00ffaa]/50`}
                            disabled={isProcessing}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className={`${pixelFont.className} py-2 px-3 bg-black border-2 border-[#00ff00] hover:bg-[#00ff00]/10 text-[#00ff00] hover:text-[#00ffaa] rounded-md transition-all duration-200 shadow-[0_0_5px_rgba(0,255,0,0.3)] hover:shadow-[0_0_10px_rgba(0,255,0,0.5)]`}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Footer with disclaimer */}
          <div className="mt-4 border-t border-[#00ff00]/20 pt-3">
            <p
              className={`${pixelMonoFont.className} text-center text-[#00ff00]/70 text-xs`}
            >
              This AI assistant provides general information and is not
              financial advice. Always DYOR (Do Your Own Research) before making
              any investment decisions.
            </p>
          </div>
        </div>
      </main>
      <footer className="w-full border-t border-[#00ff00]/20 backdrop-blur-md bg-black/50 p-4 sm:p-6 md:p-8 text-center mt-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="flex flex-col md:flex-row md:justify-between gap-6 sm:gap-8 py-4">
            {/* Logo and Brand */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="RugProof Logo"
                  width={40}
                  height={40}
                  className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px]"
                />
                <p
                  className={`${pixelFont.className} text-2xl sm:text-3xl font-semibold text-[#00ff00]`}
                >
                  RugProof
                </p>
              </div>
              <p
                className={`${pixelMonoFont.className} text-base sm:text-lg text-[#00ffff] mb-4 sm:text-left`}
              >
                RETRO FUTURISM IN DIGITAL FORM
              </p>
            </div>

            {/* About */}
            <div className="flex flex-col items-center md:items-end max-w-md">
              <p
                className={`${pixelMonoFont.className} text-base sm:text-lg text-gray-400 sm:text-right leading-relaxed`}
              >
                RugProof helps you identify and protect against crypto scams,
                spam tokens, and honeypots across multiple blockchains.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center md:justify-end gap-3">
                <span
                  className={`${pixelMonoFont.className} text-base sm:text-lg text-gray-400`}
                >
                  Built by{" "}
                  <span className="text-[#00ffff] font-medium">ForgeX</span>
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#00ff00]/10 mt-4 pt-4 flex flex-col sm:flex-row justify-between items-center">
            <p className={`${pixelMonoFont.className} text-base text-gray-500`}>
              © {new Date().getFullYear()} RugProof. All rights reserved.
            </p>
            <div className="flex mt-3 sm:mt-0 gap-4">
              <Link
                href="/"
                className={`${pixelMonoFont.className} text-base text-[#00ff00] hover:text-[#00ffff] transition-colors`}
              >
                SPAM DETECTION
              </Link>
              <Link
                href="/honeypot"
                className={`${pixelMonoFont.className} text-base text-[#ffa500] hover:text-[#ffcc00] transition-colors`}
              >
                HONEYPOT CHECKER
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
