/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { chainsToCheck } from "@/lib/utils/chainsToCheck";
import { fetchSolanaTokenInfo } from "@/lib/services/solanaScan";
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
  const detectChain = useCallback(
    async (address: string) => {
      if (!address) return null;

      setIsDetectingChain(true);
      setDetectedChain(null);

      try {
        const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        if (solanaRegex.test(address)) {
          try {
            console.log("Detected potential Solana address:", address);
            await fetchSolanaTokenInfo(address);
            console.log("Valid Solana token address confirmed");

            setDetectedChain("solana-mainnet");
            setSelectedChain("solana-mainnet");
            console.log("Setting chain to solana-mainnet");

            setIsDetectingChain(false);
            return "solana-mainnet";
          } catch (error) {
            console.error("Invalid Solana address:", error);
          }
        }

        const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!evmAddressRegex.test(address)) {
          setIsDetectingChain(false);
          return null;
        }

        for (const chainObj of chainsToCheck) {
          try {
            let apiUrl: string;
            let headers: Record<string, string> = {};

            if (chainObj.id === "43114") {
              apiUrl = `${chainObj.explorer}/v1/chains/${chainObj.id}/addresses/${address}`;
              headers = {
                "x-glacier-api-key": chainObj.apikey || "",
              };
            } else {
              apiUrl = `${chainObj.explorer}/api?module=contract&action=getabi&address=${address}&apikey=${chainObj.apikey}`;
            }

            const response = await fetch(apiUrl, {
              headers,
            });

            if (response.ok) {
              const data = await response.json();

              let isValidContract = false;

              if (chainObj.id === "43114") {
                isValidContract = data && data.address;
              } else {
                isValidContract =
                  data.status === "1" ||
                  (data.result &&
                    data.result !== "Contract source code not verified" &&
                    data.result !== "" &&
                    data.result !== null);
              }

              if (isValidContract) {
                setDetectedChain(chainObj.id);
                setSelectedChain(chainObj.id);
                setIsDetectingChain(false);
                return chainObj.id;
              }
            }
          } catch (error) {
            console.error(
              `Error checking chain ${chainObj.id} (${chainObj.name}):`,
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
              `Error checking balance for chain ${chainObj.id}:`,
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
    },
    [setIsDetectingChain, setDetectedChain, setSelectedChain]
  );

  const fetchHoneypotData = useCallback(
    async (address: string, chainId: string) => {
      try {
        const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        const evmRegex = /^0x[a-fA-F0-9]{40}$/;

        const isSolanaAddress = solanaRegex.test(address);
        const isEvmAddress = evmRegex.test(address);

        console.log("Address check:", {
          address,
          isSolana: isSolanaAddress,
          isEvm: isEvmAddress,
          providedChain: chainId,
        });

        if (isSolanaAddress) {
          console.log("Using RugCheck API for Solana address");
          const { getSolanaTokenHoneypotAnalysis } = await import(
            "@/lib/services/rugCheckService"
          );
          const data = await getSolanaTokenHoneypotAnalysis(address);

          if (
            data &&
            data.token &&
            typeof (data.token as any).decimals === "undefined"
          ) {
            (data.token as any).decimals = 6;
          }

          if (
            data &&
            data.summary &&
            typeof (data.summary as any).riskLevel === "undefined"
          ) {
            const score = data.score_normalised || 0;
            (data.summary as any).riskLevel =
              score > 70 ? 3 : score > 40 ? 2 : 1;
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

        if (isEvmAddress) {
          console.log(
            "Using honeypot.is API for EVM address with chain:",
            chainId
          );

          const numericChainId =
            chainId === "solana-mainnet" ? 1 : parseInt(chainId);

          console.log(
            `Making request to honeypot.is with chainID=${numericChainId}`
          );
          const response = await fetch(
            `https://api.honeypot.is/v2/IsHoneypot?address=${address}&chainID=${numericChainId}`
          );

          if (!response.ok) {
            throw new Error(
              `API error: ${response.statusText} (${response.status})`
            );
          }

          const data = await response.json();
          return data as HoneypotResponse;
        }

        throw new Error(`Unsupported address format: ${address}`);
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
      const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      const evmRegex = /^0x[a-fA-F0-9]{40}$/;

      const isSolanaAddress = solanaRegex.test(address);
      const isEvmAddress = evmRegex.test(address);

      console.log("Contract verification address check:", {
        address,
        isSolana: isSolanaAddress,
        isEvm: isEvmAddress,
        providedChain: chainId,
      });

      if (isSolanaAddress) {
        console.log("Fetching Solana contract verification for:", address);
        const { getSolanaTokenContractVerification } = await import(
          "@/lib/services/rugCheckService"
        );
        return await getSolanaTokenContractVerification(address);
      }

      if (isEvmAddress) {
        console.log(
          "Fetching EVM contract verification for:",
          address,
          "with chain:",
          chainId
        );
        const response = await fetch(
          `https://api.honeypot.is/v2/GetContractVerification?address=${address}&chainID=${chainId}`
        );

        if (!response.ok) {
          throw new Error(
            `API error (${response.status}): ${response.statusText}`
          );
        }

        const data = await response.json();
        return data as ContractVerificationResponse;
      }

      throw new Error(`Unsupported address format: ${address}`);
    } catch (error) {
      console.error("Error fetching contract verification:", error);
      throw error;
    }
  };

  const fetchPairs = async (address: string, chainId: string) => {
    try {
      const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      const evmRegex = /^0x[a-fA-F0-9]{40}$/;

      const isSolanaAddress = solanaRegex.test(address);
      const isEvmAddress = evmRegex.test(address);

      console.log("Pairs address check:", {
        address,
        isSolana: isSolanaAddress,
        isEvm: isEvmAddress,
        providedChain: chainId,
      });

      if (isSolanaAddress) {
        console.log("Fetching Solana pairs for:", address);
        const { getSolanaTokenPairs } = await import(
          "@/lib/services/rugCheckService"
        );
        return await getSolanaTokenPairs(address);
      }

      if (isEvmAddress) {
        console.log("Fetching EVM pairs for:", address, "with chain:", chainId);
        const response = await fetch(
          `https://api.honeypot.is/v1/GetPairs?address=${address}&chainID=${chainId}`
        );

        if (!response.ok) {
          throw new Error(
            `API error (${response.status}): ${response.statusText}`
          );
        }

        const data = await response.json();
        return data as PairResponse[];
      }

      throw new Error(`Unsupported address format: ${address}`);
    } catch (error) {
      console.error("Error fetching pairs:", error);
      throw error;
    }
  };

  const fetchTopHolders = async (address: string, chainId: string) => {
    try {
      const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      const evmRegex = /^0x[a-fA-F0-9]{40}$/;

      const isSolanaAddress = solanaRegex.test(address);
      const isEvmAddress = evmRegex.test(address);

      console.log("Top holders address check:", {
        address,
        isSolana: isSolanaAddress,
        isEvm: isEvmAddress,
        providedChain: chainId,
      });

      if (isSolanaAddress) {
        console.log("Fetching Solana top holders for:", address);
        const { getSolanaTokenHolders } = await import(
          "@/lib/services/rugCheckService"
        );
        return await getSolanaTokenHolders(address);
      }

      if (isEvmAddress) {
        const numericChainId =
          chainId === "solana-mainnet" ? 1 : parseInt(chainId);

        console.log(
          "Fetching EVM top holders for:",
          address,
          "with chain:",
          chainId,
          `(numeric: ${numericChainId})`
        );
        const response = await fetch(
          `https://api.honeypot.is/v1/TopHolders?address=${address}&chainID=${numericChainId}`
        );

        if (!response.ok) {
          throw new Error(
            `API error (${response.status}): ${response.statusText}`
          );
        }

        const data = await response.json();
        return data as TopHoldersResponse;
      }

      throw new Error(`Unsupported address format: ${address}`);
    } catch (error) {
      console.error("Error fetching top holders:", error);
      throw error;
    }
  };

  const validateAddress = (address: string): boolean => {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

    const isEvm = ethAddressRegex.test(address);
    const isSolana = solanaAddressRegex.test(address);
    const isValid = isEvm || isSolana;

    console.log("Validating address:", { address, isEvm, isSolana });

    if (isSolana) {
      console.log(
        "Setting chain to solana-mainnet for Solana address in validateAddress"
      );
      setSelectedChain("solana-mainnet");
      setDetectedChain("solana-mainnet");
    }

    if (isEvm && (!detectedChain || detectedChain === "solana-mainnet")) {
      console.log(
        "EVM address detected but chain is not set correctly. Current:",
        detectedChain
      );
      const defaultEvmChain = "1";
      setSelectedChain(defaultEvmChain);
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
      const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      const evmRegex = /^0x[a-fA-F0-9]{40}$/;

      const isSolanaAddress = solanaRegex.test(contractAddress);
      const isEvmAddress = evmRegex.test(contractAddress);

      console.log("Handle check address type:", {
        contractAddress,
        isSolana: isSolanaAddress,
        isEvm: isEvmAddress,
        currentSelectedChain: selectedChain,
        currentDetectedChain: detectedChain,
      });

      if (isSolanaAddress) {
        console.log("Setting chain to solana-mainnet for Solana address");
        setSelectedChain("solana-mainnet");
        setAutoDetectChain(true);
        setDetectedChain("solana-mainnet");
      } else if (isEvmAddress) {
        if (autoDetectChain) {
          console.log("Auto-detecting chain for EVM address");
          setIsDetectingChain(true);
          try {
            const detectedChainId = await detectChain(contractAddress);
            if (detectedChainId) {
              console.log("Chain detected:", detectedChainId);
              setSelectedChain(detectedChainId);
              setDetectedChain(detectedChainId);
            } else {
              console.log("No chain detected, defaulting to Ethereum mainnet");
              setSelectedChain("1");
              setDetectedChain("1");
            }
          } catch (error) {
            console.error("Error detecting chain:", error);
            setSelectedChain("1");
            setDetectedChain("1");
          } finally {
            setIsDetectingChain(false);
          }
        }
      }

      if (isEvmAddress && autoDetectChain) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (isSolanaAddress) {
        console.log("Using solana-mainnet for Solana address in handleCheck");
        setSelectedChain("solana-mainnet");
        setDetectedChain("solana-mainnet");
      } else if (isEvmAddress) {
        if (autoDetectChain && !isDetectingChain) {
          console.log("Auto-detecting chain for EVM address");
          const chainId = await detectChain(contractAddress);

          if (chainId) {
            console.log("Chain detected:", chainId);
            setSelectedChain(chainId);
            setDetectedChain(chainId);
          } else if (!selectedChain || selectedChain === "solana-mainnet") {
            console.log("No chain detected, defaulting to Ethereum mainnet");
            setSelectedChain("1");
          }
        } else if (selectedChain === "solana-mainnet") {
          console.log(
            "EVM address with Solana chain selected - fixing to Ethereum mainnet"
          );
          setSelectedChain("1");
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
          const normalizedPairsData = Array.isArray(pairsData)
            ? pairsData.map((pair: any) => ({
                ...pair,
                Reserves: pair.Reserves ?? {},
                Router: pair.Router ?? "",
              }))
            : [];
          setPairsResult(normalizedPairsData);
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

    console.log("Search params:", { address, chainId });
    if (address && !initialQueryHandled) {
      setContractAddress(address);

      const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      const evmRegex = /^0x[a-fA-F0-9]{40}$/;

      const isSolanaAddress = solanaRegex.test(address);
      const isEvmAddress = evmRegex.test(address);

      console.log("Initial query address check:", {
        address,
        isSolana: isSolanaAddress,
        isEvm: isEvmAddress,
        providedChain: chainId,
      });

      if (isSolanaAddress) {
        console.log("Setting chain to solana-mainnet for Solana address");
        setSelectedChain("solana-mainnet");
        setAutoDetectChain(true);
        setDetectedChain("solana-mainnet");
        setInitialQueryHandled(true);
      } else if (isEvmAddress) {
        if (chainId) {
          console.log("Using provided chain for EVM address:", chainId);
          setSelectedChain(chainId);
          setAutoDetectChain(false);
          setDetectedChain(chainId);
          setInitialQueryHandled(true);
        } else {
          console.log("No chain provided, will auto-detect for EVM address");
          setAutoDetectChain(true);
          setIsDetectingChain(true);
          detectChain(address)
            .then((detectedChainId) => {
              if (detectedChainId) {
                console.log("Chain detected:", detectedChainId);
                setSelectedChain(detectedChainId);
                setDetectedChain(detectedChainId);
              } else {
                console.log(
                  "No chain detected, defaulting to Ethereum mainnet"
                );
                setSelectedChain("1");
                setDetectedChain("1");
              }
              setInitialQueryHandled(true);
            })
            .catch((error) => {
              console.error("Error detecting chain:", error);
              setSelectedChain("1");
              setDetectedChain("1");
              setInitialQueryHandled(true);
            })
            .finally(() => {
              setIsDetectingChain(false);
            });
        }
      }
    }
  }, [searchParams, initialQueryHandled]);

  useEffect(() => {
    if (contractAddress && initialQueryHandled && !isDetectingChain) {
      const runInitialCheck = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const chainToUse = selectedChain;
          console.log(
            "Using chain for analysis:",
            chainToUse,
            "for address:",
            contractAddress
          );
          const honeypotData = await fetchHoneypotData(
            contractAddress,
            chainToUse
          );
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
        }
      };

      runInitialCheck();
    }
  }, [contractAddress, initialQueryHandled, selectedChain, isDetectingChain]);

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
                    onChange={(e) => {
                      detectChain(e.target.value).then((detectedChainId) => {
                        if (detectedChainId) {
                          console.log("Detected chain ID:", detectedChainId);
                          setDetectedChain(detectedChainId);
                          setSelectedChain(detectedChainId);
                        } else {
                          console.log("No chain detected, using default");
                          setDetectedChain(null);
                          setSelectedChain("1");
                        }
                        setError(null);
                      });
                      setContractAddress(e.target.value);
                    }}
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
                        onChange={() => {
                          const newAutoDetect = !autoDetectChain;
                          setAutoDetectChain(newAutoDetect);

                          if (!newAutoDetect && detectedChain) {
                            console.log(
                              "Setting selected chain to match detected chain:",
                              detectedChain
                            );
                            setSelectedChain(detectedChain);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#222] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#ffa500] after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#005500]"></div>
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={selectedChain}
                    onChange={(e) => {
                      console.log("Chain selected:", e.target.value);
                      setSelectedChain(e.target.value);
                      if (!autoDetectChain) {
                        setDetectedChain(e.target.value);
                      }
                    }}
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
                    {/* Solana is now shown for all endpoints */}
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
            <ContractVertification
              contractResult={contractResult}
              detectedChain={detectedChain}
            />
          )}

          {/* Pairs Results */}
          {pairsResult && !isLoading && endpoint === "pairs" && (
            <PairResult
              pairsResult={pairsResult}
              detectedChain={detectedChain}
            />
          )}

          {/* Top Holders Results */}
          {holdersResult && !isLoading && endpoint === "holders" && (
            <TopHolders
              holdersResult={holdersResult}
              detectedChain={detectedChain}
            />
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
