import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Press_Start_2P, VT323 } from "next/font/google";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

const pixelMonoFont = VT323({
  weight: "400",
  subsets: ["latin"],
});

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
                    className={`${pixelFont.className} bg-transparent border-2 border-[#00ff00] hover:bg-[#00ff00]/10 text-[#00ff00] hover:text-[#00ffff] font-semibold px-6 py-2.5 rounded-xl shadow-[0_0_10px_rgba(0,255,0,0.3)] hover:shadow-[0_0_15px_rgba(0,255,0,0.5)] transition-all duration-200`}
                  >
                    CONNECT
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    className={`${pixelFont.className} bg-[#ff0000]/20 text-[#ff0000] border border-[#ff0000]/50 hover:bg-[#ff0000]/30 font-medium px-4 py-2 rounded-xl`}
                    type="button"
                  >
                    WRONG NETWORK
                  </Button>
                );
              }

              return (
                <div className="flex items-center gap-4">
                  <button
                    onClick={openChainModal}
                    className={`${pixelMonoFont.className} flex items-center gap-2 px-4 py-2 rounded-xl bg-black/50 hover:bg-black/80 border border-[#00ff00]/50 text-[#00ffff] transition-colors duration-200`}
                    type="button"
                  >
                    {chain.hasIcon && (
                      <div
                        className="relative w-5 h-5 rounded-full overflow-hidden border border-[#00ff00]/30"
                        style={{
                          background: chain.iconBackground,
                        }}
                      >
                        {chain.iconUrl && (
                          <Image
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                            layout="fill"
                            objectFit="cover"
                          />
                        )}
                      </div>
                    )}
                    <span className="text-sm font-medium">{chain.name}</span>
                  </button>

                  <button
                    onClick={openAccountModal}
                    className={`${pixelMonoFont.className} flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00ff00]/10 hover:bg-[#00ff00]/20 border border-[#00ff00]/30 text-[#00ff00] transition-colors duration-200`}
                    type="button"
                  >
                    <span className="text-sm font-medium">
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
