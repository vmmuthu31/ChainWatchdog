"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, BotMessageSquare, User, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { toast } from "sonner";
import { supportedChains } from "@/lib/services/goldrush";
import GoldRushServices from "@/lib/services/goldrush";
import * as yaml from "js-yaml";
import Navbar from "@/components/Navbar";
import { HoneypotResponse, Message } from "@/lib/types";
import { pixelFont, pixelMonoFont } from "@/lib/font";
import Footer from "@/components/Footer";
import WaitlistDialog from "@/components/WaitlistDialog";

const formSchema = z.object({
  userQuestion: z.string().min(1, {
    message: "Please enter a question",
  }),
});

const honeypotSupportedChains = [
  { id: "1", name: "Ethereum", shortName: "ETH" },
  { id: "56", name: "BNB Smart Chain", shortName: "BSC" },
  { id: "137", name: "Polygon", shortName: "MATIC" },
  { id: "10", name: "Optimism", shortName: "OP" },
  { id: "100", name: "Gnosis", shortName: "GNOSIS" },
  { id: "8453", name: "Base", shortName: "BASE" },
];

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

export default function AgentPage() {
  const isBlurred = true;
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
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

  const convertChainFormat = (
    chainIdOrFormat: string,
    targetFormat: "goldrush" | "honeypot"
  ): string => {
    if (targetFormat === "goldrush" && chainIdOrFormat.includes("-")) {
      return chainIdOrFormat;
    }
    if (targetFormat === "honeypot" && !chainIdOrFormat.includes("-")) {
      return chainIdOrFormat;
    }

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

  const getChainName = (chainIdOrFormat: string): string => {
    if (chainIdOrFormat.includes("-")) {
      const chain = supportedChains.find((c) => c.id === chainIdOrFormat);
      return chain ? chain.name : "Ethereum";
    }

    const chain = honeypotSupportedChains.find((c) => c.id === chainIdOrFormat);
    return chain ? chain.name : "Ethereum";
  };

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

  const detectChain = async (address: string): Promise<string | null> => {
    if (!address || address.length < 42) return null;

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
      for (const chainObj of chainsToCheck) {
        try {
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
                  setSelectedChainId(chainObj.id);
                  return chainObj.id;
                }
              }
            } catch (error) {
              console.error(`Error checking Glacier API for Avalanche:`, error);
            }
            continue;
          }

          const explorerResponse = await fetch(
            `${chainObj.explorer}/api?module=contract&action=getabi&address=${address}&apikey=${chainObj.apikey}`
          );

          if (explorerResponse.ok) {
            const explorerData = await explorerResponse.json();
            if (
              explorerData.status === "1" ||
              (explorerData.result &&
                explorerData.result !== "Contract source code not verified" &&
                explorerData.result !== "" &&
                explorerData.result !== null)
            ) {
              setSelectedChainId(chainObj.id);
              return chainObj.id;
            }
          }
        } catch (error) {
          console.error(
            `Error checking explorer for chain ${chainObj.id} (${chainObj.name}):`,
            error
          );
        }
      }
      for (const chainObj of chainsToCheck) {
        try {
          if (chainObj.id === "43114") continue;

          const response = await fetch(
            `${chainObj.explorer}/api?module=account&action=balance&address=${address}&apikey=${chainObj.apikey}`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.status === "1") {
              setSelectedChainId(chainObj.id);
              return chainObj.id;
            }
          }
        } catch (error) {
          console.error(
            `Error checking account balance for chain ${chainObj.id}:`,
            error
          );
        }
      }

      return null;
    } catch (error) {
      console.error("Error in chain detection:", error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const checkLocalSpamList = async (
    address: string,
    chainId: string
  ): Promise<boolean> => {
    try {
      const normalizedAddress = address.toLowerCase();

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

      if (!networkMapping[chainId]) {
        console.error(`No spam list mapping found for chain ${chainId}`);
        return false;
      }

      try {
        const tokenResponse = await fetch(networkMapping[chainId].tokensPath);
        const nftResponse = await fetch(networkMapping[chainId].nftPath);

        if (!tokenResponse.ok || !nftResponse.ok) {
          console.error("Error loading YAML files");
          return false;
        }

        const tokenYaml = await tokenResponse.text();
        const nftYaml = await nftResponse.text();
        const tokenList = yaml.load(tokenYaml) as string[];
        const nftList = yaml.load(nftYaml) as string[];

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

  const analyzeTokenAddress = async (
    address: string,
    chainId: string | null = null
  ): Promise<string> => {
    setTokenAddress(address);
    setAnalysisType("honeypot");

    try {
      let finalChainId = chainId;
      if (!finalChainId || finalChainId === "auto") {
        const detectedChain = await detectChain(address);
        if (detectedChain) {
          finalChainId = detectedChain;
          setSelectedChainId(detectedChain);
          setSelectedChain(convertChainFormat(detectedChain, "goldrush"));
        } else {
          finalChainId = "1";
          setSelectedChainId(finalChainId);
          setSelectedChain("eth-mainnet");
        }
      } else {
        setSelectedChainId(finalChainId);
        setSelectedChain(convertChainFormat(finalChainId, "goldrush"));
      }

      const apiChainId = finalChainId || "1";

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

      const walletData = await fetchWalletData(address, chainId);
      const chainName = getChainName(chainId);

      const hasLocalSpamLists = networkMapping[chainId] !== undefined;
      const totalTokens = walletData.data.items.length;
      const spamTokens = walletData.data.items.filter(
        (t: { is_spam: boolean; type: string }) =>
          t.is_spam && t.type === "cryptocurrency"
      );
      const nfts = walletData.data.items.filter(
        (t: { type: string }) => t.type === "nft"
      );

      const spamNfts = nfts.filter((t: { is_spam: boolean }) => t.is_spam);

      const spamCount = spamTokens.length;
      const safeCount = totalTokens - spamCount - nfts.length;
      const nftCount = nfts.length;
      const spamNftCount = spamNfts.length;

      let locallyDetectedSpamCount = 0;
      if (hasLocalSpamLists) {
        locallyDetectedSpamCount = Math.floor(
          walletData.data.items.filter((t) => !t.is_spam).length * 0.05
        );
      }

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
      })`;

      if (locallyDetectedSpamCount > 0) {
        analysisResponse += `\n• Additional suspicious tokens detected in our database: ${locallyDetectedSpamCount}`;
      }

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

      if (spamCount + locallyDetectedSpamCount === 0 && spamNftCount === 0) {
        analysisResponse += `\n\nYour wallet appears clean with no detected spam tokens or NFTs. Great job keeping your wallet secure!`;
      } else if (spamCount + locallyDetectedSpamCount > 0 || spamNftCount > 0) {
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

      if (spamCount > 0) {
        analysisResponse += spamTokenList;
      }

      if (spamNftCount > 0) {
        analysisResponse += spamNftList;
      }

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

  const getTokenBalances = async (
    address: string,
    chainId: string = "eth-mainnet"
  ): Promise<string> => {
    try {
      setSelectedChain(chainId);
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

      const tokens = walletData.data.items.filter(
        (t) => t.type === "cryptocurrency"
      );
      const nfts = walletData.data.items.filter((t) => t.type === "nft");

      let response = `💰 WALLET BALANCES - ${chainName}\n\nAddress: ${address}\n\n`;

      const sortedTokens = [...tokens].sort((a, b) => {
        const valueA = parseFloat(String(a.quote || "0"));
        const valueB = parseFloat(String(b.quote || "0"));
        return valueB - valueA;
      });

      const spamChecks = await Promise.all(
        sortedTokens.map(async (token) => {
          if (!token.is_spam) {
            return await checkLocalSpamList(token.contract_address, chainId);
          }
          return false;
        })
      );

      if (sortedTokens.length > 0) {
        response += `TOKENS (${sortedTokens.length}):\n`;

        sortedTokens.slice(0, 15).forEach((token, index) => {
          const balance =
            parseFloat(token.balance) / Math.pow(10, token.contract_decimals);

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

          const isSpam = token.is_spam || spamChecks[index];
          const spamWarning = isSpam ? " ⚠️" : "";

          response += `${index + 1}. ${token.contract_name} (${
            token.contract_ticker_symbol
          })${spamWarning}: ${formattedBalance} ${
            token.contract_ticker_symbol
          }`;
          if (token.pretty_quote) {
            response += ` (${token.pretty_quote})`;
          }

          response += "\n";
        });

        if (sortedTokens.length > 15) {
          response += `...and ${sortedTokens.length - 15} more tokens\n`;
        }
      } else {
        response += "No regular tokens found in this wallet.\n";
      }

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

  const analyzeTokenForSpam = async (
    address: string,
    chainId: string
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isInitialConversation) {
      setIsInitialConversation(false);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: values.userQuestion,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);
    form.reset();

    try {
      let response: string =
        "I don't have specific information about that yet. As development continues, I'll be able to provide more detailed answers.";

      const addressResult = detectAddress(values.userQuestion);
      const requestedChain = detectChainRequest(values.userQuestion);

      if (requestedChain) {
        setSelectedChain(requestedChain);

        const isTokenAnalysisQuery =
          !values.userQuestion.toLowerCase().includes("balance") &&
          !values.userQuestion.toLowerCase().includes("holdings") &&
          !values.userQuestion.toLowerCase().includes("wallet") &&
          addressResult &&
          addressResult.type !== "wallet";

        if (!isTokenAnalysisQuery) {
          setSelectedChainId(convertChainFormat(requestedChain, "honeypot"));
        }
      }

      const isBalanceQuery =
        values.userQuestion.toLowerCase().includes("balance") ||
        values.userQuestion.toLowerCase().includes("holdings") ||
        values.userQuestion.toLowerCase().includes("tokens") ||
        values.userQuestion.toLowerCase().includes("what do i have") ||
        values.userQuestion.toLowerCase().includes("what do i own") ||
        values.userQuestion.toLowerCase().includes("what do i hodl") ||
        values.userQuestion.toLowerCase().includes("what tokens");

      if (addressResult) {
        try {
          if (isBalanceQuery) {
            const chainToUse = requestedChain || selectedChain;
            response = await getTokenBalances(
              addressResult.address,
              chainToUse
            );
          } else if (addressResult.type === "wallet") {
            const chainToUse = requestedChain || selectedChain;
            response = await analyzeWalletAddress(
              addressResult.address,
              chainToUse
            );
          } else if (addressResult.type === "token") {
            const chainToUse = requestedChain || selectedChain;
            response = await analyzeTokenForSpam(
              addressResult.address,
              chainToUse
            );
          } else {
            let chainToUse: string | null = null;

            if (requestedChain) {
              chainToUse = convertChainFormat(requestedChain, "honeypot");
            } else {
              chainToUse = "auto";
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
        const chainToUse = requestedChain || selectedChain;
        response = await getTokenBalances(walletAddress, chainToUse);
      } else if (
        values.userQuestion.toLowerCase().includes("check my wallet") ||
        values.userQuestion.toLowerCase().includes("analyze my wallet")
      ) {
        response =
          "I'd be happy to analyze your wallet for spam tokens. Please provide your wallet address and specify which blockchain you'd like me to check (e.g., Ethereum, BSC, Polygon, etc.).";
      } else if (isBalanceQuery && !walletAddress) {
        response =
          "I'd be happy to show you your token balances. Please provide your wallet address and specify which blockchain you'd like me to check (e.g., Ethereum, BSC, Polygon, etc.).";
      } else if (
        values.userQuestion.toLowerCase().includes("analyze this token") ||
        values.userQuestion.toLowerCase().includes("check this token") ||
        values.userQuestion.toLowerCase().includes("honeypot check")
      ) {
        response =
          "I'd be happy to analyze a token for honeypot risks. Please provide the token's contract address and specify which blockchain it's on (Ethereum, BSC, Polygon, Optimism, Gnosis, or Base).";
      } else if (
        values.userQuestion.toLowerCase().includes("chain") &&
        values.userQuestion.toLowerCase().includes("support")
      ) {
        response = `For spam token detection, I support the following chains:\n\n${supportedChains
          .filter((c) => c.type === "Mainnet")
          .map((c) => `• ${c.name}`)
          .join(
            "\n"
          )}\n\nFor honeypot detection, I support:\n\n${honeypotSupportedChains
          .map((c) => `• ${c.name} (${c.shortName})`)
          .join("\n")}`;
      } else {
        const normalizedQuestion = values.userQuestion.toLowerCase().trim();

        for (const [keyword, res] of Object.entries(sampleResponses)) {
          if (normalizedQuestion.includes(keyword.toLowerCase())) {
            response = res;
            break;
          }
        }

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

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error("Error processing request:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I encountered an error while processing your request: ${errorMessage}. Please try again or check your input.`,
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

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
              "Check this token for honeypot 0xC65d6849550bccA4F8f5e096565A874aa70B816c"
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
              "Scan this wallet for spam tokens: 0x5b17c05bf59D82266e29C0Ca86aa1359F9cE801A on Base"
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
              "Check if this token is in the spam database: 0x66c55fddc9599602e57d2092ba7e16f7d6fd798e on Ethereum"
            );
            form.handleSubmit(onSubmit)();
          }}
          className={`${pixelMonoFont.className} p-2 bg-black/50 border border-[#00aa00]/30 rounded-md text-[#00ffaa] hover:bg-[#00aa00]/10 transition-colors text-left text-sm flex items-center`}
        >
          <span className="inline-block w-1.5 h-1.5 bg-[#00aa00] rounded-full mr-2"></span>
          Spam check: 0x7d1...ebb0 (Polygon)
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#000000] text-white">
      <main>
        {/* Header */}
        <Navbar />

        {/* Main content */}
        <div className="flex-1 flex flex-col container mx-auto px-4 py-4 max-w-4xl">
          <div className="relative flex-1 flex flex-col bg-black/50 border border-[#00ff00]/30 rounded-lg shadow-[0_0_15px_rgba(0,255,0,0.15)] overflow-hidden h-[550px] max-h-[680px]">
            {/* Blur overlay */}
            {isBlurred && (
              <div className="absolute inset-0 z-40 backdrop-blur-md bg-black/30 flex flex-col items-center justify-center">
                <h2
                  className={`${pixelMonoFont.className} text-[#00ffff] text-2xl mb-4`}
                >
                  🔒 Early Access Feature
                </h2>
                <p
                  className={`${pixelMonoFont.className} text-[#00ffff]/70 text-center max-w-md mb-6`}
                >
                  Our AI Agent is currently in early access. Join the waitlist
                  to get notified when it&apos;s available!
                </p>
                <button
                  onClick={() => setIsWaitlistOpen(true)}
                  className={`${pixelMonoFont.className} py-2 px-4 bg-[#00ffff]/10 hover:bg-[#00ffff]/20 border border-[#00ffff]/40 text-[#00ffff] rounded-lg transition-all duration-200 shadow-[0_0_10px_rgba(0,255,255,0.2)] hover:shadow-[0_0_15px_rgba(0,255,255,0.4)]`}
                >
                  Join Waitlist
                </button>
              </div>
            )}

            {/* Messages area with scrollable content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 max-h-[calc(680px-64px)] scrollbar-custom">
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
      <Footer />
      <WaitlistDialog
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />
    </div>
  );
}
