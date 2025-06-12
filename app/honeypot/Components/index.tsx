/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense, FormEvent, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Search,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { pixelFont, pixelMonoFont } from "@/lib/font";
import {
  ContractVerificationResponse,
  EndpointType,
  HoneypotResponse,
  PairResponse,
  TopHoldersResponse,
} from "@/lib/types";
import Footer from "@/components/Footer";
import { getChainName } from "@/lib/utils/getChainName";
import TopHolders from "./TopHolders";
import PairResult from "./PairResult";
import ContractVertification from "./ContractVertification";
import HoneyPotResult from "./HoneyPotResult";
import { chainsToCheck } from "@/lib/utils/chainsToCheck";
import { fetchSolanaTokenInfo } from "@/lib/services/solanaScan";

function HoneyPot() {
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [contractAddress, setContractAddress] = useState("");
  const [selectedChain, setSelectedChain] = useState("1");
  const [autoDetectChain, setAutoDetectChain] = useState(true);
  const [detectedChain, setDetectedChain] = useState<string | null>(null);
  const [isDetectingChain, setIsDetectingChain] = useState(false);
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
  const [initialQueryHandled, setInitialQueryHandled] = useState(false);
  const detectChain = async (address: string) => {
    if (!address) return null;

    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (solanaRegex.test(address)) {
      await fetchSolanaTokenInfo(address);
      return "solana-mainnet";
    }

    if (address.length < 42) return null;

    setIsDetectingChain(true);
    setDetectedChain(null);

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
                  setDetectedChain(chainObj.id);
                  setSelectedChain(chainObj.id);
                  setIsDetectingChain(false);
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
              setDetectedChain(chainObj.id);
              setSelectedChain(chainObj.id);
              setIsDetectingChain(false);
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
              setDetectedChain(chainObj.id);
              setSelectedChain(chainObj.id);
              setIsDetectingChain(false);
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

      setIsDetectingChain(false);
      return null;
    } catch (error) {
      console.error("Error in chain detection:", error);
      setIsDetectingChain(false);
      return null;
    }
  };

  const fetchHoneypotData = useCallback(
    async (address: string, chainId: string) => {
      try {
        // If Solana, use our custom Solana service
        if (
          chainId === "solana-mainnet" ||
          /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
        ) {
          // Dynamically import the Solana service
          const { solanaScanService } = await import(
            "@/lib/services/solanaScan"
          );
          const data = await solanaScanService(address);

          // Patch token type to ensure decimals property exists
          if (
            data &&
            data.token &&
            typeof (data.token as any).decimals === "undefined"
          ) {
            // Default to 9 decimals for Solana tokens if not provided
            (data.token as any).decimals = 9;
          }

          // Patch summary to ensure riskLevel property exists
          if (
            data &&
            data.summary &&
            typeof (data.summary as any).riskLevel === "undefined"
          ) {
            (data.summary as any).riskLevel = 2;
          }

          return {
            ...data,
            chain: "solana-mainnet",
            token: {
              ...data.token,
              decimals:
                typeof (data.token as any).decimals === "number"
                  ? (data.token as any).decimals
                  : 9,
            },
            summary: {
              risk:
                typeof (data.summary as any)?.risk === "string"
                  ? (data.summary as any).risk
                  : "medium",
              riskLevel:
                typeof (data.summary as any)?.riskLevel === "number"
                  ? (data.summary as any).riskLevel
                  : 2,
            },
            simulationResult: {
              ...data.simulationResult,
              buyGas: String((data.simulationResult as any)?.buyGas ?? ""),
              sellGas: String((data.simulationResult as any)?.sellGas ?? ""),
            },
            flags: Array.isArray(data.flags)
              ? data.flags
              : typeof data.flags === "object" && data.flags !== null
              ? Object.keys(data.flags).filter(
                  (key) => !!(data.flags as any)[key]
                )
              : [],
          } as unknown as HoneypotResponse;
        }

        // For EVM chains, use the original API
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
    },
    []
  );

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

  const validateAddress = (address: string): boolean => {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

    // Check if the address matches either Ethereum or Solana format
    const isValid =
      ethAddressRegex.test(address) || solanaAddressRegex.test(address);

    // If it's a Solana address and the selected chain isn't Solana, auto-select Solana
    if (
      solanaAddressRegex.test(address) &&
      selectedChain !== "solana-mainnet"
    ) {
      setSelectedChain("solana-mainnet");
      setDetectedChain("solana-mainnet");
    }

    return isValid;
  };

  const handleCheck = async (e: FormEvent) => {
    e.preventDefault();

    if (!contractAddress) {
      setError("Please enter a contract address");
      return;
    }

    if (!validateAddress(contractAddress)) {
      setError(
        "Invalid address format. Please enter a valid Ethereum (0x...) or Solana address"
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setHoneypotResult(null);
    setContractResult(null);
    setPairsResult(null);
    setHoldersResult(null);

    try {
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

  useEffect(() => {
    const address = searchParams.get("address");
    const chainId = searchParams.get("chainId");

    if (address && !initialQueryHandled) {
      setContractAddress(address);

      if (chainId) {
        setSelectedChain(chainId);
        setAutoDetectChain(false);
        setDetectedChain(chainId);
      }

      const runInitialCheck = async () => {
        setIsLoading(true);
        setError(null);

        try {
          const chainToUse = chainId || selectedChain;
          const honeypotData = await fetchHoneypotData(address, chainToUse);
          setHoneypotResult(honeypotData);
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to check contract. Please try again.";
          setError(errorMessage);
          console.error(err);
        } finally {
          setIsLoading(false);
          setInitialQueryHandled(true);
        }
      };

      runInitialCheck();
    }
  }, [searchParams, initialQueryHandled, selectedChain, fetchHoneypotData]);

  useEffect(() => {
    if (initialQueryHandled) {
      const timer = setTimeout(() => {
        if (
          contractAddress &&
          ((contractAddress.length >= 42 && contractAddress.startsWith("0x")) ||
            /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contractAddress)) &&
          autoDetectChain
        ) {
          detectChain(contractAddress);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [contractAddress, autoDetectChain, initialQueryHandled, detectChain]);

  return (
    <Suspense>
      <div className="flex min-h-screen flex-col items-center bg-black text-white">
        {/* Header */}
        <Navbar />

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
            <div className="grid md:grid-cols-4 grid-cols-2 p-1 bg-black/80 border border-[#ffa500]/50 rounded-lg overflow-hidden mb-4">
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
                    placeholder="Enter a contract address (0x... for EVM or base58 for Solana)"
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
                    disabled={
                      isLoading || (autoDetectChain && isDetectingChain)
                    }
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
                    <option value="solana-mainnet">Solana</option>
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

          {honeypotResult && !isLoading && endpoint === "honeypot" && (
            <HoneyPotResult
              honeypotResult={{
                token: honeypotResult.token,
                simulationResult: {
                  buyTax: honeypotResult.simulationResult.buyTax,
                  sellTax: honeypotResult.simulationResult.sellTax,
                  transferTax: honeypotResult.simulationResult.transferTax,
                  buyGas: Number(honeypotResult.simulationResult.buyGas),
                  sellGas: Number(honeypotResult.simulationResult.sellGas),
                },
                contractCode: honeypotResult.contractCode,
                summary: honeypotResult.summary,
                honeypotResult: honeypotResult.honeypotResult,
              }}
              detectedChain={detectedChain}
            />
          )}

          {/* Contract Verification Results */}
          {contractResult && !isLoading && endpoint === "contract" && (
            <ContractVertification contractResult={contractResult} />
          )}

          {/* Pairs Results */}
          {pairsResult && !isLoading && endpoint === "pairs" && (
            <PairResult pairsResult={pairsResult} />
          )}

          {/* Top Holders Results */}
          {holdersResult && !isLoading && endpoint === "holders" && (
            <TopHolders holdersResult={holdersResult} />
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
                7 Chains
              </div>
              <div
                className={`${pixelMonoFont.className} text-xs sm:text-sm text-[#ffa500]/80 mt-1`}
              >
                Actively Protected
                <span className="block text-[#ffa500]/60 text-xs">
                  Networks
                </span>
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
                <span className="block text-[#ffa500]/60 text-xs">
                  for Risk
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </Suspense>
  );
}

export default HoneyPot;
