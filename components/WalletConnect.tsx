import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";
import { pixelFont, pixelMonoFont } from "@/lib/font";

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
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    className={`${pixelFont.className} text-[10px] xs:text-xs sm:text-sm bg-transparent border-2 border-[#00ff00] hover:bg-[#00ff00]/10 text-[#00ff00] hover:text-[#00ffff] font-semibold px-2 sm:px-4 md:px-6 py-1 sm:py-1.5 md:py-2 rounded-xl shadow-[0_0_10px_rgba(0,255,0,0.3)] hover:shadow-[0_0_15px_rgba(0,255,0,0.5)] transition-all duration-200`}
                  >
                    CONNECT
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    className={`${pixelFont.className} text-[10px] xs:text-xs sm:text-sm bg-[#ff0000]/20 text-[#ff0000] border border-[#ff0000]/50 hover:bg-[#ff0000]/30 font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl`}
                    type="button"
                  >
                    WRONG NET
                  </Button>
                );
              }

              return (
                <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
                  <button
                    onClick={openChainModal}
                    className={`${pixelMonoFont.className} flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-black/50 hover:bg-black/80 border border-[#00ff00]/50 text-[#00ffff] transition-colors duration-200`}
                    type="button"
                  >
                    {chain.hasIcon && (
                      <div
                        className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full overflow-hidden border border-[#00ff00]/30"
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
                    <span className="text-[10px] xs:text-xs sm:text-sm font-medium hidden xs:inline">
                      {chain.name}
                    </span>
                  </button>

                  <button
                    onClick={openAccountModal}
                    className={`${pixelMonoFont.className} flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#00ff00]/10 hover:bg-[#00ff00]/20 border border-[#00ff00]/30 text-[#00ff00] transition-colors duration-200`}
                    type="button"
                  >
                    <span className="text-[10px] xs:text-xs sm:text-sm font-medium truncate max-w-[60px] xs:max-w-[80px] sm:max-w-[120px] md:max-w-none">
                      {account.displayName}
                      {account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ""}
                    </span>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default WalletConnect;
