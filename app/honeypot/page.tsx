"use client";

import { Press_Start_2P, VT323 } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Loader2,
  Search,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Info,
  X,
} from "lucide-react";
import WalletConnect from "@/components/WalletConnect";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

const pixelMonoFont = VT323({
  weight: "400",
  subsets: ["latin"],
});

// Define proper types for the API responses
interface Token {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
  totalHolders: number;
}

interface WithToken {
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

interface TaxDistribution {
  tax: number;
  count: number;
}

interface HolderAnalysis {
  holders: string;
  successful: string;
  failed: string;
  siphoned: string;
  averageTax: number;
  averageGas: number;
  highestTax: number;
  highTaxWallets: string;
  taxDistribution: TaxDistribution[];
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

interface PairInfo {
  name: string;
  address: string;
  token0: string;
  token1: string;
  type: "UniswapV2" | "UniswapV3";
}

interface Pair {
  pair: PairInfo;
  chainId: string;
  reserves0: string;
  reserves1: string;
  liquidity: number;
  router: string;
  createdAtTimestamp: string;
  creationTxHash: string;
}

interface HoneypotResponse {
  token: Token;
  withToken?: WithToken;
  summary: Summary;
  simulationSuccess: boolean;
  simulationError?: string;
  honeypotResult: HoneypotResult;
  simulationResult: SimulationResult;
  holderAnalysis?: HolderAnalysis;
  flags: string[];
  contractCode?: ContractCode;
  chain: Chain;
  router?: string;
  pair?: Pair;
  pairAddress?: string;
}

// Contract verification response type
interface ContractVerificationResponse {
  isContract: boolean;
  isRootOpenSource: boolean;
  fullCheckPerformed: boolean;
  summary?: {
    isOpenSource: boolean;
    hasProxyCalls: boolean;
  };
  contractsOpenSource?: Record<string, boolean>;
  contractCalls?: Array<{
    caller: string;
    callee: string;
    type: string;
  }>;
}

// Pair response type
interface PairResponse {
  ChainID: number;
  Pair: {
    Name: string;
    Tokens: string[];
    Address: string;
  };
  Reserves: number[];
  Liquidity: number;
  Router: string;
}

// Top holders response type
interface Holder {
  address: string;
  balance: string;
  alias: string;
  isContract: boolean;
}

interface TopHoldersResponse {
  totalSupply: string;
  holders: Holder[];
}

// Supported endpoints
type EndpointType = "honeypot" | "contract" | "pairs" | "holders";

export default function HoneypotPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [contractAddress, setContractAddress] = useState("");
  const [selectedChain, setSelectedChain] = useState("1"); // Default to Ethereum
  const [autoDetectChain, setAutoDetectChain] = useState(true); // New state for auto-detection toggle
  const [detectedChain, setDetectedChain] = useState<string | null>(null); // Track detected chain
  const [isDetectingChain, setIsDetectingChain] = useState(false); // For detection loading state
  const [endpoint, setEndpoint] = useState<EndpointType>("honeypot");
  const [honeypotResult, setHoneypotResult] = useState<HoneypotResponse | null>(
    null
  );
  const [contractResult, setContractResult] =
    useState<ContractVerificationResponse | null>(null);
  const [pairsResult, setPairsResult] = useState<PairResponse[] | null>(null);
  const [holdersResult, setHoldersResult] = useState<TopHoldersResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle mobile menu click outside
  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement>) => {
    const mobileMenuElement = document.getElementById("mobile-menu-container");
    const mobileMenuButton = document.getElementById("mobile-menu-button");

    if (
      mobileMenuElement &&
      !mobileMenuElement.contains(event.target as Node) &&
      mobileMenuButton &&
      !mobileMenuButton.contains(event.target as Node)
    ) {
      setMobileMenuOpen(false);
    }
  };

  // Chain detection function
  const detectChain = async (address: string) => {
    if (!address || address.length < 42) return null;

    setIsDetectingChain(true);
    setDetectedChain(null);

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
                  setDetectedChain(chainObj.id);
                  setSelectedChain(chainObj.id);
                  setIsDetectingChain(false);
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
              setDetectedChain(chainObj.id);
              setSelectedChain(chainObj.id);
              setIsDetectingChain(false);
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
              setDetectedChain(chainObj.id);
              setSelectedChain(chainObj.id);
              setIsDetectingChain(false);
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
      setIsDetectingChain(false);
      return null;
    } catch (error) {
      console.error("Error in chain detection:", error);
      setIsDetectingChain(false);
      return null;
    }
  };

  // Handle contract address change
  useEffect(() => {
    // Debounce the chain detection to avoid too many API calls
    const timer = setTimeout(() => {
      if (contractAddress && contractAddress.length >= 42 && autoDetectChain) {
        detectChain(contractAddress);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [contractAddress, autoDetectChain]);

  // The chain detection system uses blockchain explorers directly:
  // - Standard explorers (Etherscan, BSCScan, etc.) for most chains
  // - Glacier API for Avalanche
  // This provides reliable cross-chain contract detection without requiring user input

  // Get chain name from ID
  const getChainName = (chainId: string) => {
    switch (chainId) {
      case "1":
        return "Ethereum";
      case "56":
        return "Binance Smart Chain";
      case "137":
        return "Polygon";
      case "43114":
        return "Avalanche";
      case "42161":
        return "Arbitrum";
      case "10":
        return "Optimism";
      default:
        return "Unknown Chain";
    }
  };

  const fetchHoneypotData = async (address: string, chainId: string) => {
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

  const fetchContractVerification = async (
    address: string,
    chainId: string
  ) => {
    try {
      const response = await fetch(
        `https://api.honeypot.is/v2/GetContractVerification?address=${address}&chainID=${chainId}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data as ContractVerificationResponse;
    } catch (error) {
      console.error("Error fetching contract verification:", error);
      throw error;
    }
  };

  const fetchPairs = async (address: string, chainId: string) => {
    try {
      const response = await fetch(
        `https://api.honeypot.is/v1/GetPairs?address=${address}&chainID=${chainId}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data as PairResponse[];
    } catch (error) {
      console.error("Error fetching pairs:", error);
      throw error;
    }
  };

  const fetchTopHolders = async (address: string, chainId: string) => {
    try {
      const response = await fetch(
        `https://api.honeypot.is/v1/TopHolders?address=${address}&chainID=${chainId}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data as TopHoldersResponse;
    } catch (error) {
      console.error("Error fetching top holders:", error);
      throw error;
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contractAddress) {
      setError("Please enter a contract address");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHoneypotResult(null);
    setContractResult(null);
    setPairsResult(null);
    setHoldersResult(null);

    try {
      // If auto-detect is on and we don't have a detected chain yet, try to detect it
      if (autoDetectChain && !detectedChain && !isDetectingChain) {
        const chainId = await detectChain(contractAddress);
        if (chainId) {
          setSelectedChain(chainId);
        }
      }

      switch (endpoint) {
        case "honeypot":
          const honeypotData = await fetchHoneypotData(
            contractAddress,
            selectedChain
          );
          setHoneypotResult(honeypotData);
          break;

        case "contract":
          const contractData = await fetchContractVerification(
            contractAddress,
            selectedChain
          );
          setContractResult(contractData);
          break;

        case "pairs":
          const pairsData = await fetchPairs(contractAddress, selectedChain);
          setPairsResult(pairsData);
          break;

        case "holders":
          const holdersData = await fetchTopHolders(
            contractAddress,
            selectedChain
          );
          setHoldersResult(holdersData);
          break;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to check contract. Please try again.";
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center bg-black text-white"
      onClick={handleClickOutside}
    >
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
                className={`${pixelMonoFont.className} text-lg text-[#ffa500] hover:text-[#ffcc00] border-b-2 border-[#ffa500] pb-1 transition-colors`}
              >
                Honeypot Check
              </Link>
              <Link
                href="#"
                className={`${pixelMonoFont.className} text-lg text-[#00ffff]/60 hover:text-[#00ffff] transition-colors`}
              >
                AI Agent (Soon)
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
                        href="#"
                        className={`${pixelMonoFont.className} flex items-center gap-2 px-4 py-3 text-lg text-[#00ffff]/60 hover:text-[#00ffff] hover:bg-[#00ffff]/10 rounded-lg transition-colors`}
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
                        AI Agent (Soon)
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

      <main className="container mx-auto flex flex-1 flex-col items-center justify-center gap-6 sm:gap-10 p-3 sm:p-4 md:p-8">
        <div className="text-center space-y-6 max-w-2xl relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ffa500]/20 via-transparent to-transparent blur-3xl"></div>
          <h2
            className={`${pixelFont.className} text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#ffa500] via-[#ffcc00] to-[#ff8800] bg-clip-text text-transparent glow-green-md animate-pulse-slow`}
          >
            IS THIS TOKEN SAFE TO TRADE?
          </h2>
          <p
            className={`${pixelMonoFont.className} text-xl sm:text-2xl md:text-3xl text-[#ffa500] leading-relaxed max-w-xl mx-auto animate-fade-in-up animation-delay-100`}
          >
            Instantly verify any token contract across major chains. Avoid
            scams. Trade with confidence.
          </p>
        </div>

        {/* API Endpoint Tabs */}
        <div className="w-full max-w-xl">
          <div className="flex p-1 bg-black/80 border border-[#ffa500]/50 rounded-lg overflow-hidden mb-4">
            <button
              className={`flex-1 px-2 py-3 text-sm font-medium cursor-pointer rounded-md transition-colors flex items-center gap-1 ${
                endpoint === "honeypot"
                  ? "bg-[#ffa500] text-black"
                  : "text-[#ffa500] hover:bg-black/90"
              }`}
              onClick={() => {
                setEndpoint("honeypot");
                setContractAddress("");
                setError(null);
              }}
            >
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="whitespace-nowrap">Honeypot Check</span>
            </button>
            <button
              className={`flex-1 px-2 py-3 text-sm font-medium cursor-pointer rounded-md transition-colors flex items-center gap-1 ${
                endpoint === "contract"
                  ? "bg-[#ffa500] text-black"
                  : "text-[#ffa500] hover:bg-black/90"
              }`}
              onClick={() => {
                setEndpoint("contract");
                setContractAddress("");
                setError(null);
              }}
            >
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="whitespace-nowrap">Contract Verify</span>
            </button>
            <button
              className={`flex-1 px-2 py-3 text-sm font-medium cursor-pointer rounded-md transition-colors flex items-center justify-center gap-1 ${
                endpoint === "pairs"
                  ? "bg-[#ffa500] text-black"
                  : "text-[#ffa500] hover:bg-black/90"
              }`}
              onClick={() => {
                setEndpoint("pairs");
                setContractAddress("");
                setError(null);
              }}
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="whitespace-nowrap">Get Pairs</span>
            </button>
            <button
              className={`flex-1 px-2 py-3 text-sm font-medium cursor-pointer rounded-md transition-colors flex items-center justify-center gap-1 ${
                endpoint === "holders"
                  ? "bg-[#ffa500] text-black"
                  : "text-[#ffa500] hover:bg-black/90"
              }`}
              onClick={() => {
                setEndpoint("holders");
                setContractAddress("");
                setError(null);
              }}
            >
              <Info className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="whitespace-nowrap">Top Holders</span>
            </button>
          </div>
        </div>

        {/* Contract checker form */}
        <div className="w-full max-w-xl backdrop-blur-lg bg-black/50 p-4 sm:p-6 md:p-8 rounded-2xl border border-[#ffa500]/30 shadow-xl relative z-[10] transform transition-all duration-300 hover:shadow-[0_0_50px_-12px_rgba(255,165,0,0.5)]">
          <form onSubmit={handleCheck} className="space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <label
                className={`${pixelMonoFont.className} block text-lg sm:text-xl font-medium text-[#ffa500] mb-2`}
              >
                CONTRACT ADDRESS
              </label>
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Enter a contract address (0x...)"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  disabled={isLoading}
                  className={`${pixelMonoFont.className} w-full pl-10 pr-3 py-3 sm:py-4 rounded-md bg-[#111] border border-[#ffa500]/50 text-[#00ffff] focus:ring-[#ffa500] focus:border-[#ffa500] focus:outline-none focus:ring-2 text-base sm:text-lg placeholder:text-[#ffa500]/50`}
                  style={{
                    backgroundColor: "#111",
                    color: "#00ffff",
                    caretColor: "#ffa500",
                    textShadow: "0 0 2px rgba(0, 0, 0, 0.5)",
                    WebkitTextFillColor: "#00ffff",
                  }}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ffa500]">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center">
                <label
                  className={`${pixelMonoFont.className} block text-lg sm:text-xl font-medium text-[#ffa500] mb-2`}
                >
                  BLOCKCHAIN NETWORK
                </label>

                {/* Auto-detect toggle */}
                <div className="flex items-center gap-2">
                  <span
                    className={`${pixelMonoFont.className} text-sm text-[#00ffff]`}
                  >
                    Auto-detect
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoDetectChain}
                      onChange={() => setAutoDetectChain(!autoDetectChain)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#222] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#ffa500] after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#005500]"></div>
                  </label>
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedChain}
                  onChange={(e) => setSelectedChain(e.target.value)}
                  disabled={isLoading || (autoDetectChain && isDetectingChain)}
                  className={`${
                    pixelMonoFont.className
                  } w-full px-3 py-2 sm:py-3 rounded-md bg-[#111] border border-[#ffa500]/50 text-[#00ffff] focus:ring-[#ffa500] focus:border-[#ffa500] focus:outline-none focus:ring-2 text-base sm:text-lg ${
                    autoDetectChain && isDetectingChain ? "opacity-60" : ""
                  }`}
                  style={{
                    backgroundColor: "#111",
                    color: "#00ffff",
                    WebkitTextFillColor: "#00ffff",
                  }}
                >
                  <option value="1">Ethereum</option>
                  <option value="56">Binance Smart Chain</option>
                  <option value="137">Polygon</option>
                  <option value="43114">Avalanche</option>
                  <option value="42161">Arbitrum</option>
                  <option value="10">Optimism</option>
                </select>

                {/* Show loading indicator when detecting */}
                {autoDetectChain && isDetectingChain && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#ffa500]" />
                  </div>
                )}

                {/* Show checkmark when chain is detected */}
                {autoDetectChain && detectedChain && !isDetectingChain && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="h-4 w-4 text-[#00ff00]" />
                  </div>
                )}
              </div>

              {/* Chain detection status message */}
              {autoDetectChain && (
                <div
                  className={`text-xs sm:text-sm ${pixelMonoFont.className} mt-1`}
                >
                  {isDetectingChain ? (
                    <span className="text-[#ffa500]">Detecting chain...</span>
                  ) : detectedChain ? (
                    <span className="text-[#00ff00]">
                      Chain detected: {getChainName(detectedChain)}
                    </span>
                  ) : contractAddress && contractAddress.length >= 42 ? (
                    <span className="text-[#ff0000]">
                      Couldn&apos;t detect chain. Please select manually.
                    </span>
                  ) : (
                    <span className="text-[#00ffff]">
                      Chain will be auto-detected when you enter an address
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`${pixelFont.className} w-full py-3 sm:py-4 bg-black border-2 border-[#ffa500] hover:bg-[#ffa500]/10 text-[#ffa500] hover:text-[#ffcc00] rounded-xl transition-all duration-200 shadow-[0_0_10px_rgba(255,165,0,0.3)] hover:shadow-[0_0_15px_rgba(255,165,0,0.5)] text-sm sm:text-base md:text-lg`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span>ANALYZING CONTRACT...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>CHECK {endpoint.toUpperCase()}</span>
                  </div>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 flex-shrink-0" />
              <p className={`${pixelMonoFont.className} text-lg`}>{error}</p>
            </div>
          )}
        </div>

        {/* Honeypot Check Results */}
        {honeypotResult && !isLoading && endpoint === "honeypot" && (
          <div className="w-full max-w-2xl mt-6 animate-fade-in">
            {/* Token Summary Card */}
            <div className="p-4 sm:p-6 backdrop-blur-lg bg-black/50 rounded-2xl border border-[#ffa500]/30 shadow-[0_0_15px_rgba(255,165,0,0.2)] overflow-hidden relative mb-6">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#ffa500]/10 via-transparent to-transparent"></div>

              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-[#ffa500]/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 text-[#ffa500]" />
                </div>
                <h3
                  className={`${pixelFont.className} text-xl sm:text-2xl md:text-3xl font-bold text-[#ffa500]`}
                >
                  HONEYPOT ANALYSIS
                </h3>
              </div>

              <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4 text-[#00ffff] flex-1">
                  <div className="space-y-1">
                    <span
                      className={`${pixelMonoFont.className} text-lg sm:text-xl text-[#ffa500]`}
                    >
                      TOKEN
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`${pixelMonoFont.className} text-base sm:text-lg md:text-xl font-mono bg-black/50 py-2 px-3 rounded-lg truncate border border-[#ffa500]/20`}
                      >
                        {honeypotResult.token.address}
                      </span>
                      <a
                        href={`https://etherscan.io/address/${honeypotResult.token.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-black/50 text-[#ffa500] hover:bg-black/70 hover:text-[#ffcc00] transition-colors border border-[#ffa500]/30"
                      >
                        <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
                      </a>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span
                      className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                    >
                      TOKEN INFO
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-black/50 py-2 px-3 rounded-lg border border-[#ffa500]/20">
                        <span
                          className={`${pixelMonoFont.className} text-base sm:text-lg font-medium`}
                        >
                          {honeypotResult.token.name} (
                          {honeypotResult.token.symbol})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span
                      className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                    >
                      HOLDERS
                    </span>
                    <div
                      className={`${pixelMonoFont.className} text-base sm:text-lg bg-black/50 py-2 px-3 rounded-lg border border-[#ffa500]/20`}
                    >
                      {honeypotResult.token.totalHolders.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col justify-between md:justify-end gap-2 md:gap-3 w-full md:w-auto">
                  <div className="flex flex-col flex-1 md:flex-none">
                    <div
                      className={`flex-1 md:w-28 h-full flex flex-col p-3 rounded-2xl ${
                        honeypotResult.honeypotResult.isHoneypot
                          ? "border border-[#ff0000]/30 bg-black/70"
                          : "border border-[#00ff00]/30 bg-black/70"
                      }`}
                    >
                      <div className="flex-1 flex items-center justify-center">
                        <div
                          className={`${
                            pixelFont.className
                          } text-3xl font-bold ${
                            honeypotResult.honeypotResult.isHoneypot
                              ? "text-[#ff0000] glow-red-sm"
                              : "text-[#00ff00] glow-green-sm"
                          }`}
                        >
                          {honeypotResult.honeypotResult.isHoneypot
                            ? "YES"
                            : "NO"}
                        </div>
                      </div>
                      <div className="text-center mt-2">
                        <div
                          className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                        >
                          HONEYPOT
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 md:flex-none">
                    <div className="flex-1 md:w-28 h-full flex flex-col p-3 rounded-2xl border border-[#ffa500]/30 bg-black/70">
                      <div className="flex-1 flex items-center justify-center">
                        <div
                          className={`${pixelFont.className} text-3xl font-bold text-[#ffa500]`}
                        >
                          {honeypotResult.simulationResult.buyTax}%
                        </div>
                      </div>
                      <div className="text-center mt-2">
                        <div
                          className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                        >
                          BUY TAX
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 md:flex-none">
                    <div className="flex-1 md:w-28 h-full flex flex-col p-3 rounded-2xl border border-[#ffa500]/30 bg-black/70">
                      <div className="flex-1 flex items-center justify-center">
                        <div
                          className={`${pixelFont.className} text-3xl font-bold text-[#ffa500]`}
                        >
                          {honeypotResult.simulationResult.sellTax}%
                        </div>
                      </div>
                      <div className="text-center mt-2">
                        <div
                          className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                        >
                          SELL TAX
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Status */}
              <div
                className={`mt-5 sm:mt-7 p-4 sm:p-5 border rounded-xl flex items-center gap-4 shadow-[0_0_10px_rgba(255,165,0,0.1)] ${
                  honeypotResult.honeypotResult.isHoneypot
                    ? "border-[#ff0000]/30 bg-[#ff0000]/10"
                    : honeypotResult.summary.risk === "low" ||
                      honeypotResult.summary.risk === "medium"
                    ? "border-[#ffaa00]/30 bg-[#ffaa00]/10"
                    : "border-[#00ff00]/30 bg-[#00ff00]/10"
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    honeypotResult.honeypotResult.isHoneypot
                      ? "bg-[#ff0000]/20 border border-[#ff0000]/30"
                      : honeypotResult.summary.risk === "low" ||
                        honeypotResult.summary.risk === "medium"
                      ? "bg-[#ffaa00]/20 border border-[#ffaa00]/30"
                      : "bg-[#00ff00]/20 border border-[#00ff00]/30"
                  }`}
                >
                  {honeypotResult.honeypotResult.isHoneypot ? (
                    <AlertTriangle className="h-5 w-5 text-[#ff0000]" />
                  ) : honeypotResult.summary.risk === "low" ||
                    honeypotResult.summary.risk === "medium" ? (
                    <AlertTriangle className="h-5 w-5 text-[#ffaa00]" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-[#00ff00]" />
                  )}
                </div>
                <div>
                  <h4
                    className={`${
                      pixelMonoFont.className
                    } font-semibold text-base sm:text-lg md:text-xl ${
                      honeypotResult.honeypotResult.isHoneypot
                        ? "text-[#ff5555]"
                        : honeypotResult.summary.risk === "low" ||
                          honeypotResult.summary.risk === "medium"
                        ? "text-[#ffaa00]"
                        : "text-[#00ff00]"
                    }`}
                  >
                    {honeypotResult.honeypotResult.isHoneypot
                      ? "DANGER: HONEYPOT DETECTED"
                      : honeypotResult.summary.risk === "low" ||
                        honeypotResult.summary.risk === "medium"
                      ? `CAUTION: ${honeypotResult.summary.risk.toUpperCase()} RISK DETECTED`
                      : "SAFE: NO HONEYPOT DETECTED"}
                  </h4>
                  <p
                    className={`${
                      pixelMonoFont.className
                    } text-base sm:text-lg ${
                      honeypotResult.honeypotResult.isHoneypot
                        ? "text-[#ff8888]"
                        : honeypotResult.summary.risk === "low" ||
                          honeypotResult.summary.risk === "medium"
                        ? "text-[#ffcc00]"
                        : "text-[#00ffaa]"
                    }`}
                  >
                    {honeypotResult.honeypotResult.isHoneypot
                      ? honeypotResult.honeypotResult.honeypotReason ||
                        "This contract has been identified as a honeypot. DO NOT TRADE."
                      : honeypotResult.summary.risk === "low" ||
                        honeypotResult.summary.risk === "medium"
                      ? "This contract has some risk factors but appears to be tradeable. Exercise caution."
                      : "This contract appears to be safe based on our analysis. Always do your own research."}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="p-5 sm:p-7 backdrop-blur-lg bg-black/50 rounded-2xl border border-[#ffa500]/30 shadow-[0_0_15px_rgba(255,165,0,0.2)] overflow-hidden">
              <h3
                className={`${pixelFont.className} text-xl sm:text-2xl font-bold text-[#ffa500] mb-5`}
              >
                DETAILED ANALYSIS
              </h3>

              <div className="space-y-5">
                {/* Tax Information */}
                <div className="p-4 sm:p-5 bg-black/70 rounded-xl border border-[#ffa500]/20">
                  <h4
                    className={`${pixelMonoFont.className} text-lg sm:text-xl font-medium text-[#ffa500] mb-3`}
                  >
                    TAX INFORMATION
                  </h4>
                  <div className="grid grid-cols-3 gap-3 sm:gap-5">
                    <div className="p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10 text-center">
                      <div
                        className={`${pixelMonoFont.className} text-lg sm:text-xl font-bold text-[#00ffff]`}
                      >
                        {honeypotResult.simulationResult.buyTax}%
                      </div>
                      <div
                        className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                      >
                        Buy Tax
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10 text-center">
                      <div
                        className={`${pixelMonoFont.className} text-lg sm:text-xl font-bold text-[#00ffff]`}
                      >
                        {honeypotResult.simulationResult.sellTax}%
                      </div>
                      <div
                        className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                      >
                        Sell Tax
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10 text-center">
                      <div
                        className={`${pixelMonoFont.className} text-lg sm:text-xl font-bold text-[#00ffff]`}
                      >
                        {honeypotResult.simulationResult.transferTax}%
                      </div>
                      <div
                        className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                      >
                        Transfer Tax
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gas Information */}
                <div className="p-4 sm:p-5 bg-black/70 rounded-xl border border-[#ffa500]/20">
                  <h4
                    className={`${pixelMonoFont.className} text-lg sm:text-xl font-medium text-[#ffa500] mb-3`}
                  >
                    GAS INFORMATION
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:gap-5">
                    <div className="p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10 text-center">
                      <div
                        className={`${pixelMonoFont.className} text-lg sm:text-xl font-bold text-[#00ffff]`}
                      >
                        {honeypotResult.simulationResult.buyGas}
                      </div>
                      <div
                        className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                      >
                        Buy Gas
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10 text-center">
                      <div
                        className={`${pixelMonoFont.className} text-lg sm:text-xl font-bold text-[#00ffff]`}
                      >
                        {honeypotResult.simulationResult.sellGas}
                      </div>
                      <div
                        className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                      >
                        Sell Gas
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contract Verification */}
                {honeypotResult.contractCode && (
                  <div className="p-4 sm:p-5 bg-black/70 rounded-xl border border-[#ffa500]/20">
                    <h4
                      className={`${pixelMonoFont.className} text-lg sm:text-xl font-medium text-[#ffa500] mb-3`}
                    >
                      CONTRACT VERIFICATION
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10">
                        <span
                          className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                        >
                          Open Source:
                        </span>
                        <span
                          className={`${
                            pixelMonoFont.className
                          } text-base sm:text-lg ${
                            honeypotResult.contractCode.openSource
                              ? "text-[#00ff00]"
                              : "text-[#ff0000]"
                          }`}
                        >
                          {honeypotResult.contractCode.openSource
                            ? "YES"
                            : "NO"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10">
                        <span
                          className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                        >
                          Root Open Source:
                        </span>
                        <span
                          className={`${
                            pixelMonoFont.className
                          } text-base sm:text-lg ${
                            honeypotResult.contractCode.rootOpenSource
                              ? "text-[#00ff00]"
                              : "text-[#ff0000]"
                          }`}
                        >
                          {honeypotResult.contractCode.rootOpenSource
                            ? "YES"
                            : "NO"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10">
                        <span
                          className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                        >
                          Is Proxy:
                        </span>
                        <span
                          className={`${
                            pixelMonoFont.className
                          } text-base sm:text-lg ${
                            honeypotResult.contractCode.isProxy
                              ? "text-[#ff5500]"
                              : "text-[#00ff00]"
                          }`}
                        >
                          {honeypotResult.contractCode.isProxy ? "YES" : "NO"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 sm:p-4 bg-black/50 rounded-lg border border-[#ffa500]/10">
                        <span
                          className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffa500]`}
                        >
                          Has Proxy Calls:
                        </span>
                        <span
                          className={`${
                            pixelMonoFont.className
                          } text-base sm:text-lg ${
                            honeypotResult.contractCode.hasProxyCalls
                              ? "text-[#ff5500]"
                              : "text-[#00ff00]"
                          }`}
                        >
                          {honeypotResult.contractCode.hasProxyCalls
                            ? "YES"
                            : "NO"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="p-4 sm:p-5 bg-[#ffaa00]/10 rounded-xl border border-[#ffaa00]/30 mt-5">
                  <div className="flex gap-4 items-start">
                    <Info className="h-6 w-6 text-[#ffaa00] flex-shrink-0 mt-0.5" />
                    <p
                      className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffaa00]`}
                    >
                      This analysis is provided for informational purposes only.
                      Always do your own research (DYOR) before investing.
                      RugProof is not responsible for any trading decisions made
                      based on this information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contract Verification Results */}
        {contractResult && !isLoading && endpoint === "contract" && (
          <div className="w-full max-w-2xl mt-6 animate-fade-in">
            <div className="p-4 sm:p-6 backdrop-blur-lg bg-black/50 rounded-2xl border border-[#ffa500]/30 shadow-[0_0_15px_rgba(255,165,0,0.2)] overflow-hidden relative">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#ffa500]/10 via-transparent to-transparent"></div>

              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#ffa500]/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-[#ffa500]" />
                </div>
                <h3
                  className={`${pixelFont.className} text-lg sm:text-xl md:text-2xl font-bold text-[#ffa500]`}
                >
                  CONTRACT VERIFICATION
                </h3>
              </div>

              <div className="flex flex-col gap-4">
                {/* Summary */}
                <div className="p-3 sm:p-4 bg-black/70 rounded-xl border border-[#ffa500]/20">
                  <h4
                    className={`${pixelMonoFont.className} text-base sm:text-lg font-medium text-[#ffa500] mb-2`}
                  >
                    SUMMARY
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                      <div className="flex justify-between">
                        <span
                          className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                        >
                          Is Contract:
                        </span>
                        <span
                          className={`${pixelMonoFont.className} text-sm ${
                            contractResult.isContract
                              ? "text-[#00ff00]"
                              : "text-[#ff0000]"
                          }`}
                        >
                          {contractResult.isContract ? "YES" : "NO"}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                      <div className="flex justify-between">
                        <span
                          className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                        >
                          Root Open Source:
                        </span>
                        <span
                          className={`${pixelMonoFont.className} text-sm ${
                            contractResult.isRootOpenSource
                              ? "text-[#00ff00]"
                              : "text-[#ff0000]"
                          }`}
                        >
                          {contractResult.isRootOpenSource ? "YES" : "NO"}
                        </span>
                      </div>
                    </div>
                    {contractResult.fullCheckPerformed &&
                      contractResult.summary && (
                        <>
                          <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                            <div className="flex justify-between">
                              <span
                                className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                              >
                                All Open Source:
                              </span>
                              <span
                                className={`${
                                  pixelMonoFont.className
                                } text-sm ${
                                  contractResult.summary.isOpenSource
                                    ? "text-[#00ff00]"
                                    : "text-[#ff0000]"
                                }`}
                              >
                                {contractResult.summary.isOpenSource
                                  ? "YES"
                                  : "NO"}
                              </span>
                            </div>
                          </div>
                          <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10">
                            <div className="flex justify-between">
                              <span
                                className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                              >
                                Has Proxy Calls:
                              </span>
                              <span
                                className={`${
                                  pixelMonoFont.className
                                } text-sm ${
                                  contractResult.summary.hasProxyCalls
                                    ? "text-[#ff5500]"
                                    : "text-[#00ff00]"
                                }`}
                              >
                                {contractResult.summary.hasProxyCalls
                                  ? "YES"
                                  : "NO"}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                  </div>
                </div>

                {/* Contracts Open Source */}
                {contractResult.contractsOpenSource &&
                  Object.keys(contractResult.contractsOpenSource).length >
                    0 && (
                    <div className="p-3 sm:p-4 bg-black/70 rounded-xl border border-[#ffa500]/20">
                      <h4
                        className={`${pixelMonoFont.className} text-base sm:text-lg font-medium text-[#ffa500] mb-2`}
                      >
                        CONTRACTS OPEN SOURCE STATUS
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {Object.entries(contractResult.contractsOpenSource).map(
                          ([address, isOpenSource]) => (
                            <div
                              key={address}
                              className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/10"
                            >
                              <div className="flex justify-between flex-wrap gap-2">
                                <span
                                  className={`${pixelMonoFont.className} text-xs sm:text-sm text-[#00ffff] break-all`}
                                >
                                  {address}
                                </span>
                                <span
                                  className={`${
                                    pixelMonoFont.className
                                  } text-xs sm:text-sm ${
                                    isOpenSource
                                      ? "text-[#00ff00]"
                                      : "text-[#ff0000]"
                                  }`}
                                >
                                  {isOpenSource
                                    ? "OPEN SOURCE"
                                    : "CLOSED SOURCE"}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Full Check Not Performed Warning */}
                {!contractResult.fullCheckPerformed && (
                  <div className="p-3 sm:p-4 bg-[#ffaa00]/10 rounded-xl border border-[#ffaa00]/30">
                    <div className="flex gap-3 items-start">
                      <AlertTriangle className="h-5 w-5 text-[#ffaa00] flex-shrink-0 mt-0.5" />
                      <p
                        className={`${pixelMonoFont.className} text-sm sm:text-base text-[#ffaa00]`}
                      >
                        Full check could not be performed. This happens when the
                        simulation fails to get a complete call tree. Some
                        information may be missing.
                      </p>
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="p-4 sm:p-5 bg-[#ffaa00]/10 rounded-xl border border-[#ffaa00]/30 mt-5">
                  <div className="flex gap-4 items-start">
                    <Info className="h-6 w-6 text-[#ffaa00] flex-shrink-0 mt-0.5" />
                    <p
                      className={`${pixelMonoFont.className} text-base sm:text-lg text-[#ffaa00]`}
                    >
                      This analysis is provided for informational purposes only.
                      Always do your own research (DYOR) before investing.
                      RugProof is not responsible for any trading decisions made
                      based on this information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pairs Results */}
        {pairsResult && !isLoading && endpoint === "pairs" && (
          <div className="w-full max-w-2xl mt-6 animate-fade-in">
            <div className="p-4 sm:p-6 backdrop-blur-lg bg-black/50 rounded-2xl border border-[#ffa500]/30 shadow-[0_0_15px_rgba(255,165,0,0.2)] overflow-hidden relative">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#ffa500]/10 via-transparent to-transparent"></div>

              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#ffa500]/10 flex items-center justify-center">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-[#ffa500]" />
                </div>
                <h3
                  className={`${pixelFont.className} text-lg sm:text-xl md:text-2xl font-bold text-[#ffa500]`}
                >
                  TOKEN PAIRS
                </h3>
              </div>

              {pairsResult.length === 0 ? (
                <div className="p-6 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-[#ffa500]" />
                  <h4
                    className={`${pixelMonoFont.className} text-lg font-medium text-[#ffa500] mb-2`}
                  >
                    NO PAIRS FOUND
                  </h4>
                  <p
                    className={`${pixelMonoFont.className} text-base text-[#00ffff]`}
                  >
                    No trading pairs were found for this token on the selected
                    chain.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#ffa500]/30">
                          <th
                            className={`${pixelMonoFont.className} text-left p-3 text-[#ffa500] text-base sm:text-lg`}
                          >
                            Pair
                          </th>
                          <th
                            className={`${pixelMonoFont.className} text-right p-3 text-[#ffa500] text-base sm:text-lg`}
                          >
                            Chain
                          </th>
                          <th
                            className={`${pixelMonoFont.className} text-right p-3 text-[#ffa500] text-base sm:text-lg`}
                          >
                            Liquidity
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pairsResult.map((pair, index) => (
                          <tr
                            key={pair.Pair.Address}
                            className={`${
                              index % 2 === 0 ? "bg-black/30" : "bg-black/50"
                            } hover:bg-[#ffa500]/10 transition-colors`}
                          >
                            <td
                              className={`${pixelMonoFont.className} p-3 text-[#00ffff] text-base`}
                            >
                              <div className="flex flex-col">
                                <span>{pair.Pair.Name}</span>
                                <a
                                  href={`https://etherscan.io/address/${pair.Pair.Address}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-[#00ffaa] hover:text-[#00ffff] flex items-center gap-1"
                                >
                                  {pair.Pair.Address.substring(0, 8)}...
                                  {pair.Pair.Address.substring(
                                    pair.Pair.Address.length - 6
                                  )}
                                  <ExternalLink className="inline-block h-4 w-4" />
                                </a>
                              </div>
                            </td>
                            <td
                              className={`${pixelMonoFont.className} p-3 text-right text-[#00ffff] text-base`}
                            >
                              {pair.ChainID === 1
                                ? "Ethereum"
                                : pair.ChainID === 56
                                ? "BSC"
                                : pair.ChainID === 137
                                ? "Polygon"
                                : pair.ChainID === 42161
                                ? "Arbitrum"
                                : pair.ChainID === 10
                                ? "Optimism"
                                : pair.ChainID.toString()}
                            </td>
                            <td
                              className={`${pixelMonoFont.className} p-3 text-right text-[#00ffff] text-base`}
                            >
                              $
                              {pair.Liquidity.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 sm:p-4 bg-[#ffaa00]/10 rounded-xl border border-[#ffaa00]/30">
                    <div className="flex gap-3 items-start">
                      <Info className="h-5 w-5 text-[#ffaa00] flex-shrink-0 mt-0.5" />
                      <p
                        className={`${pixelMonoFont.className} text-sm sm:text-base text-[#ffaa00]`}
                      >
                        The endpoint is currently limited to returning up to 10
                        pairs with the highest liquidity.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Holders Results */}
        {holdersResult && !isLoading && endpoint === "holders" && (
          <div className="w-full max-w-2xl mt-6 animate-fade-in">
            <div className="p-4 sm:p-6 backdrop-blur-lg bg-black/50 rounded-2xl border border-[#ffa500]/30 shadow-[0_0_15px_rgba(255,165,0,0.2)] overflow-hidden relative">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#ffa500]/10 via-transparent to-transparent"></div>

              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-[#ffa500]/10 flex items-center justify-center">
                  <Info className="h-5 w-5 sm:h-6 sm:w-6 text-[#ffa500]" />
                </div>
                <h3
                  className={`${pixelFont.className} text-lg sm:text-xl md:text-2xl font-bold text-[#ffa500]`}
                >
                  TOP TOKEN HOLDERS
                </h3>
              </div>

              <div className="mb-4">
                <div className="p-2 sm:p-3 bg-black/50 rounded-lg border border-[#ffa500]/20 mb-2">
                  <div className="flex justify-between items-center">
                    <span
                      className={`${pixelMonoFont.className} text-sm text-[#ffa500]`}
                    >
                      Total Supply:
                    </span>
                    <span
                      className={`${pixelMonoFont.className} text-sm text-[#00ffff]`}
                    >
                      {BigInt(holdersResult.totalSupply).toLocaleString()}{" "}
                      tokens
                    </span>
                  </div>
                </div>
              </div>

              {holdersResult.holders.length === 0 ? (
                <div className="p-6 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-[#ffa500]" />
                  <h4
                    className={`${pixelMonoFont.className} text-lg font-medium text-[#ffa500] mb-2`}
                  >
                    NO HOLDERS FOUND
                  </h4>
                  <p
                    className={`${pixelMonoFont.className} text-base text-[#00ffff]`}
                  >
                    No token holders were found for this token on the selected
                    chain.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#ffa500]/30">
                          <th
                            className={`${pixelMonoFont.className} text-left p-3 text-[#ffa500] text-base sm:text-lg`}
                          >
                            Address
                          </th>
                          <th
                            className={`${pixelMonoFont.className} text-right p-3 text-[#ffa500] text-base sm:text-lg`}
                          >
                            Balance
                          </th>
                          <th
                            className={`${pixelMonoFont.className} text-center p-3 text-[#ffa500] text-base sm:text-lg`}
                          >
                            Type
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdersResult.holders.map((holder, index) => {
                          // Calculate percentage of total supply
                          const holderBalance = BigInt(holder.balance);
                          const totalSupply = BigInt(holdersResult.totalSupply);
                          const percentage =
                            totalSupply > 0
                              ? Number(
                                  (holderBalance * BigInt(10000)) / totalSupply
                                ) / 100
                              : 0;

                          return (
                            <tr
                              key={holder.address}
                              className={`${
                                index % 2 === 0 ? "bg-black/30" : "bg-black/50"
                              } hover:bg-[#ffa500]/10 transition-colors`}
                            >
                              <td
                                className={`${pixelMonoFont.className} p-3 text-[#00ffff] text-base`}
                              >
                                <a
                                  href={`https://etherscan.io/address/${holder.address}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-[#00ffff] flex items-center gap-1"
                                >
                                  {holder.address}
                                  <ExternalLink className="inline-block h-4 w-4" />
                                </a>
                                {holder.alias && (
                                  <span className="text-sm text-[#ff00ff]">
                                    {holder.alias}
                                  </span>
                                )}
                              </td>
                              <td
                                className={`${pixelMonoFont.className} p-3 text-right text-[#00ffff] text-base`}
                              >
                                <div>{holderBalance.toLocaleString()}</div>
                                <div className="text-sm text-[#00ffaa]">
                                  {percentage.toFixed(2)}%
                                </div>
                              </td>
                              <td
                                className={`${pixelMonoFont.className} p-3 text-center`}
                              >
                                {holder.isContract ? (
                                  <span className="px-3 py-1 bg-[#ff00ff]/10 text-[#ff00ff] rounded-full text-sm">
                                    Contract
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-[#00ff00]/10 text-[#00ff00] rounded-full text-sm">
                                    Wallet
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 sm:p-4 bg-[#ffaa00]/10 rounded-xl border border-[#ffaa00]/30">
                    <div className="flex gap-3 items-start">
                      <Info className="h-5 w-5 text-[#ffaa00] flex-shrink-0 mt-0.5" />
                      <p
                        className={`${pixelMonoFont.className} text-sm sm:text-base text-[#ffaa00]`}
                      >
                        This endpoint shows up to 50 top holders. Premium API
                        access allows retrieving more holders.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <div className="w-full max-w-5xl bg-black/40 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-[#ffa500]/20 animate-fade-in animation-delay-200">
        <h3
          className={`${pixelFont.className} text-center text-base sm:text-lg text-[#ffa500] mb-4`}
        >
          Honeypot Scanner Stats{" "}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="p-4 backdrop-blur-lg bg-black/40 rounded-xl border border-[#ffa500]/20 flex flex-col items-center justify-center text-center">
            <div
              className={`${pixelFont.className} text-lg sm:text-xl md:text-2xl font-bold text-[#ffa500]`}
            >
              4M+
            </div>
            <div
              className={`${pixelMonoFont.className} text-xs sm:text-sm text-[#ffa500]/80 mt-1`}
            >
              Tokens Scanned
              <span className="block text-[#ffa500]/60 text-xs">
                (BSC highest)
              </span>
            </div>
          </div>
          <div className="p-4 backdrop-blur-lg bg-black/40 rounded-xl border border-[#ffa500]/20 flex flex-col items-center justify-center text-center">
            <div
              className={`${pixelFont.className} text-lg sm:text-xl md:text-2xl font-bold text-[#ffa500]`}
            >
              926K+
            </div>
            <div
              className={`${pixelMonoFont.className} text-xs sm:text-sm text-[#ffa500]/80 mt-1`}
            >
              NFTs Analyzed
              <span className="block text-[#ffa500]/60 text-xs">
                (Polygon leads)
              </span>
            </div>
          </div>
          <div className="p-4 backdrop-blur-lg bg-black/40 rounded-xl border border-[#ffa500]/20 flex flex-col items-center justify-center text-center">
            <div
              className={`${pixelFont.className} text-lg sm:text-xl md:text-2xl font-bold text-[#ffa500]`}
            >
              6 Chains
            </div>
            <div
              className={`${pixelMonoFont.className} text-xs sm:text-sm text-[#ffa500]/80 mt-1`}
            >
              Actively Protected
              <span className="block text-[#ffa500]/60 text-xs">Networks</span>
            </div>
          </div>
          <div className="p-4 backdrop-blur-lg bg-black/40 rounded-xl border border-[#ffa500]/20 flex flex-col items-center justify-center text-center">
            <div
              className={`${pixelFont.className} text-lg sm:text-xl md:text-2xl font-bold text-[#ffa500]`}
            >
              5.5M+
            </div>
            <div
              className={`${pixelMonoFont.className} text-xs sm:text-sm text-[#ffa500]/80 mt-1`}
            >
              Wallets Flagged
              <span className="block text-[#ffa500]/60 text-xs">for Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
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

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes pulseSlow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-pulse-slow {
          animation: pulseSlow 3s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
        }

        .glow-green-sm {
          text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
        }

        .glow-red-sm {
          text-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
