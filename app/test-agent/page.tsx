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
import Navbar from "@/components/Navbar";
import { Message } from "@/lib/types";
import { pixelFont, pixelMonoFont } from "@/lib/font";
import Footer from "@/components/Footer";
import WaitlistDialog from "@/components/WaitlistDialog";
import { honeypotSupportedChains } from "@/lib/utils/honeypotSupportedChains";
import { sampleAgentResponses } from "@/lib/utils/sampleAgentResponses";
import { detectAgentChainRequest } from "@/lib/utils/detectAgentChainRequest";
import { detectAgentAddress } from "@/lib/utils/detectAgentAddress";
import { getChainExplorerUrl } from "@/lib/utils/getChainExplorerUrl";
import { convertChainFormat } from "@/lib/utils/convertChainFormat";
import { analyzeTokenAddress } from "@/lib/utils/analyzeTokenAddress";
import { analyzeWalletAddress } from "@/lib/utils/analyzeWalletAddress";
import { getTokenBalances } from "@/lib/utils/getTokenBalances";
import { analyzeTokenForSpam } from "@/lib/utils/analyzeTokenForSpam";
import SuggestedQuestions from "@/components/SuggestedQuestions";
import SampleTokens from "@/components/SampleTokens";

const formSchema = z.object({
  userQuestion: z.string().min(1, {
    message: "Please enter a question",
  }),
});

export default function AgentPage() {
  const isBlurred = false;
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

  const [isInitialConversation, setIsInitialConversation] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userQuestion: "",
    },
  });

  const getChainName = (chainIdOrFormat: string): string => {
    if (chainIdOrFormat.includes("-")) {
      const chain = supportedChains.find((c) => c.id === chainIdOrFormat);
      return chain ? chain.name : "Ethereum";
    }

    const chain = honeypotSupportedChains.find((c) => c.id === chainIdOrFormat);
    return chain ? chain.name : "Ethereum";
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

      const addressResult = detectAgentAddress(values.userQuestion);
      const requestedChain = detectAgentChainRequest(values.userQuestion);

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
              chainToUse,
              setSelectedChain,
              setSelectedChainId
            );
          } else if (addressResult.type === "wallet") {
            const chainToUse = requestedChain || selectedChain;
            response = await analyzeWalletAddress(
              addressResult.address,
              chainToUse,
              setWalletAddress,
              (type: string) =>
                setAnalysisType(type as "honeypot" | "wallet" | "spam" | null),
              setSelectedChain
            );
          } else if (addressResult.type === "token") {
            const chainToUse = requestedChain || selectedChain;
            response = await analyzeTokenForSpam(
              addressResult.address,
              chainToUse,
              setTokenAddress,
              (type: string) =>
                setAnalysisType(type as "honeypot" | "wallet" | "spam" | null)
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
              chainToUse,
              setTokenAddress,
              (value: string) =>
                setAnalysisType(value as "honeypot" | "wallet" | "spam" | null),
              setIsProcessing,
              setSelectedChainId,
              setSelectedChain
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
        response = await getTokenBalances(
          walletAddress,
          chainToUse,
          setSelectedChain,
          setSelectedChainId
        );
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

        for (const [keyword, res] of Object.entries(sampleAgentResponses)) {
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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex min-h-screen flex-col bg-[#000000] text-white">
      <main>
        {/* Header */}
        <Navbar />

        {/* Main content */}
        <div className="flex-1 flex flex-col container mx-auto px-4 py-4 max-w-4xl">
          <div className="relative flex-1 flex flex-col bg-black/50 border border-[#00ff00]/30 rounded-lg shadow-[0_0_15px_rgba(0,255,0,0.15)] overflow-hidden min-h-[550px] max-h-[680px]">
            {/* Blur overlay */}
            {isBlurred && (
              <div className="absolute inset-0 z-40 backdrop-blur-md bg-black/30 flex flex-col items-center justify-center">
                <h2
                  className={`${pixelMonoFont.className} text-[#00ffff] text-2xl mb-4`}
                >
                  🔒 Exclusive Early Access{" "}
                </h2>
                <p
                  className={`${pixelMonoFont.className} text-[#00ffff]/70 text-center max-w-md mb-6`}
                >
                  Be among the first to put RugProof’s AI Agent on your side
                  before you trade.
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
                                                            chain.id,
                                                            setTokenAddress,
                                                            (value: string) =>
                                                              setAnalysisType(
                                                                value as
                                                                  | "honeypot"
                                                                  | "wallet"
                                                                  | "spam"
                                                                  | null
                                                              ),
                                                            setIsProcessing,
                                                            setSelectedChainId,
                                                            setSelectedChain
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
                                                            chain.id,
                                                            setWalletAddress,
                                                            (type: string) =>
                                                              setAnalysisType(
                                                                type as
                                                                  | "honeypot"
                                                                  | "wallet"
                                                                  | "spam"
                                                                  | null
                                                              ),
                                                            setSelectedChain
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
                                          form.handleSubmit(
                                            (
                                              data: z.infer<typeof formSchema>
                                            ) => onSubmit(data)
                                          )();
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
                      <SuggestedQuestions form={form} onSubmit={onSubmit} />
                      <SampleTokens form={form} onSubmit={onSubmit} />
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
              className={`${pixelMonoFont.className} text-center text-[#00ff00]/70 text-sm`}
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
