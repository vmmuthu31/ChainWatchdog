"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { ChainInfo } from "../lib/types";

interface NetworkDropdownProps {
  supportedChains: ChainInfo[];
  selectedChain: string;
  setSelectedChain: (chainId: string) => void;
  isLoading?: boolean;
  currentChain: ChainInfo;
}

export default function NetworkDropdown({
  supportedChains,
  selectedChain,
  setSelectedChain,
  isLoading,
  currentChain,
}: NetworkDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="mb-5">
      <div className="text-sm text-[#00ff00] mb-2 font-medium">Network</div>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="w-full flex items-center justify-between p-3 bg-black/80 border border-[#00ff00]/50 rounded-lg text-left focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-black/80 flex items-center justify-center overflow-hidden border border-[#00ff00]/30">
              {currentChain?.logoUrl && (
                <Image
                  src={currentChain.logoUrl}
                  alt={currentChain.name}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
              )}
            </div>
            <span className="text-[#00ffff]">{currentChain?.name}</span>
            {currentChain?.type === "Testnet" && (
              <span className="text-[10px] px-1.5 py-0.5 bg-[#ff00ff]/20 text-[#ff00ff] rounded-full">
                Testnet
              </span>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-[#00ff00] transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-black/90 border border-[#00ff00]/30 rounded-lg shadow-lg max-h-60 overflow-auto">
            {supportedChains.map((chain) => (
              <button
                key={chain.id}
                type="button"
                onClick={() => {
                  setSelectedChain(chain.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 p-2.5 hover:bg-[#00ff00]/10 text-left ${
                  selectedChain === chain.id
                    ? "bg-[#00ff00]/20 border-l-2 border-[#00ff00]"
                    : ""
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-black/80 flex items-center justify-center overflow-hidden border border-[#00ff00]/30">
                  {chain.logoUrl && (
                    <Image
                      src={chain.logoUrl}
                      alt={chain.name}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                  )}
                </div>
                <span className="text-[#00ffff]">{chain.name}</span>
                {chain.type === "Testnet" && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#ff00ff]/20 text-[#ff00ff] rounded-full">
                    Testnet
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
