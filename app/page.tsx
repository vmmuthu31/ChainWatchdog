"use client";

import * as React from "react";
import { TokenInputForm } from "@/components/token-input-form";
import { TokenResult } from "@/components/token-result";
import { getTokenSpamStatus, type Token } from "@/lib/services/goldrush";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import WalletConnect from "@/components/WalletConnect";
export default function Home() {
  const [tokenData, setTokenData] = React.useState<Token | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCheckToken = async ({
    tokenAddress,
  }: {
    tokenAddress: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setTokenData(null);

    try {
      if (!tokenAddress) {
        throw new Error("Please enter a token address.");
      }

      const result = await getTokenSpamStatus(tokenAddress);
      setTokenData(result);
    } catch (err) {
      console.error("Error checking token:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-gray-900 via-[#0f1729] to-black text-white">
      <header className="w-full border-b border-gray-800/50 backdrop-blur-md bg-black/20 p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-[#FA4C15]" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FA4C15] to-orange-500 bg-clip-text text-transparent">
              ChainWatchDog
            </h1>
          </div>
          <WalletConnect />
        </div>
      </header>

      <main className="container mx-auto flex flex-1 flex-col items-center justify-center gap-12 p-4 md:p-8">
        <div className="text-center space-y-4 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[#FA4C15] via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            🛡️ Token Spam Shield
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            Safeguard your wallet from malicious tokens and scams. Simply paste
            any ERC20 token address below for instant verification.
          </p>
        </div>

        <div className="w-full max-w-xl backdrop-blur-lg bg-white/5 p-8 rounded-2xl border border-gray-800/50 shadow-xl">
          <TokenInputForm onSubmit={handleCheckToken} isLoading={isLoading} />
        </div>

        <div className="w-full max-w-xl">
          <TokenResult token={tokenData} isLoading={isLoading} error={error} />
        </div>
      </main>

      <footer className="w-full border-t border-gray-800/50 backdrop-blur-md bg-black/20 p-6 text-center">
        <p className="text-sm text-gray-400">
          Powered by{" "}
          <span className="text-[#FA4C15] font-semibold">
            GoldRush Enhanced Spam Lists API
          </span>
        </p>
      </footer>
    </div>
  );
}
