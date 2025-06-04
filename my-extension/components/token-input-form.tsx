"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface TokenInputFormProps {
  onSubmit: ({ tokenAddress }: { tokenAddress: string }) => void;
  isLoading?: boolean;
}

export function TokenInputForm({
  onSubmit,
  isLoading = false,
}: TokenInputFormProps) {
  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    onSubmit({ tokenAddress: address.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Enter wallet address or ENS"
          className="w-full pl-10 pr-4 py-3 bg-black/80 border border-[#00ff00]/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00ff00] text-[#00ffff]"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={isLoading}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#00ff00]" />
      </div>

      <button
        type="submit"
        className="w-full py-3 px-6 bg-[#00ff00]/80 hover:bg-[#00ff00] text-black font-bold rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
        disabled={!address.trim() || isLoading}
      >
        {isLoading ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
            <span>Scanning...</span>
          </>
        ) : (
          "Scan Address"
        )}
      </button>
    </form>
  );
}
