import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";
import { pixelFont, pixelMonoFont } from "@/lib/font";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

const ChainIcon = ({ src, alt }: { src?: string; alt: string }) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <span className="w-full h-full flex items-center justify-center text-[#00ff00] text-xs">
        {alt.charAt(0)}
      </span>
    );
  }

  return (
    <Image
      alt={alt || "Chain icon"}
      src={src}
      width={16}
      height={16}
      className="object-cover"
      onError={() => setError(true)}
      unoptimized
    />
  );
};

function WalletConnect() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {!connected ? (
              <Button
                onClick={openConnectModal}
                className={`${pixelFont.className} text-[10px] xs:text-xs sm:text-sm bg-transparent border-2 border-[#00ff00] hover:bg-[#00ff00]/10 text-[#00ff00] hover:text-[#00ffff] font-semibold px-2 sm:px-4 md:px-6 py-1 sm:py-1.5 md:py-2 rounded-xl shadow-[0_0_10px_rgba(0,255,0,0.3)] hover:shadow-[0_0_15px_rgba(0,255,0,0.5)] transition-all duration-200`}
              >
                CONNECT
              </Button>
            ) : chain.unsupported ? (
              <Button
                onClick={openChainModal}
                className={`${pixelFont.className} text-[10px] xs:text-xs sm:text-sm bg-[#ff0000]/20 text-[#ff0000] border border-[#ff0000]/50 hover:bg-[#ff0000]/30 font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl`}
                type="button"
              >
                WRONG NETWORK
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className={`${pixelMonoFont.className} flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#00ff00]/10 hover:bg-[#00ff00]/20 border border-[#00ff00]/30 text-[#00ff00] transition-colors duration-200`}
                  >
                    {chain.hasIcon && (
                      <div
                        className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full overflow-hidden border border-[#00ff00]/30 mr-1"
                        style={{
                          background: chain.iconBackground || "#000",
                        }}
                      >
                        <ChainIcon
                          src={chain.iconUrl}
                          alt={chain.name || "Chain"}
                        />
                      </div>
                    )}
                    <span className="text-[10px] xs:text-xs sm:text-sm font-medium truncate max-w-[60px] xs:max-w-[80px] sm:max-w-[120px] md:max-w-none">
                      {account.displayName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black border border-[#00ff00]/30 text-[#00ff00]">
                  <DropdownMenuLabel className="text-[#00ffff]">
                    <div className="flex flex-col">
                      <span>Connected Wallet</span>
                      <span className="font-mono text-xs mt-1">
                        {account.address}
                      </span>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="bg-[#00ff00]/20" />

                  <DropdownMenuItem
                    onClick={openChainModal}
                    className="cursor-pointer hover:bg-[#00ff00]/10 hover:text-[#00ffff]"
                  >
                    <div className="flex items-center gap-2">
                      {chain.hasIcon && (
                        <div
                          className="relative w-4 h-4 rounded-full overflow-hidden border border-[#00ff00]/30"
                          style={{
                            background: chain.iconBackground || "#000",
                          }}
                        >
                          <ChainIcon
                            src={chain.iconUrl}
                            alt={chain.name || "Chain"}
                          />
                        </div>
                      )}
                      <span>Switch Network ({chain.name})</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={openAccountModal}
                    className="cursor-pointer hover:bg-[#00ff00]/10 hover:text-[#00ffff]"
                  >
                    <div className="flex items-center gap-2">
                      <span>Wallet Details</span>
                      <span className="ml-auto text-xs opacity-70">
                        {account.displayBalance}
                      </span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-[#00ff00]/20" />

                  <DropdownMenuItem
                    onClick={openAccountModal}
                    className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Disconnect</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default WalletConnect;
