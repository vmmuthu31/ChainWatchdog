import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import WaitlistDialog from "./WaitlistDialog";
import { pixelFont, pixelMonoFont } from "@/lib/font";
import { useEffect, useState, useMemo } from "react";
import { LogOut, Wallet, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const pathname = usePathname();
  const { login } = useLogin();
  const { ready, authenticated, user, logout } = usePrivy();

  const connectedWallets = useMemo(() => {
    return (
      user?.linkedAccounts?.filter((account) => account.type === "wallet") || []
    );
  }, [user]);

  const navItems = [
    {
      href: "/",
      label: "Spam Detector",
      color: "text-[#00ff00]",
      hoverColor: "hover:text-[#00ffff]",
      borderColor: "border-[#00ff00]",
      bgHoverColor: "hover:bg-[#00ff00]/10",
      icon: (
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
      ),
    },
    {
      href: "/honeypot",
      label: "Honeypot Check",
      color: "text-[#ffa500]",
      hoverColor: "hover:text-[#ffcc00]",
      borderColor: "border-[#ffa500]",
      bgHoverColor: "hover:bg-[#ffa500]/10",
      icon: (
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
      ),
    },
    {
      href: "/ai-agent",
      label: "AI Agent",
      color: "text-[#00ffff]",
      hoverColor: "hover:text-[#00ffff]",
      borderColor: "border-[#00ffff]",
      bgHoverColor: "hover:bg-[#00ffff]/10",
      icon: (
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
      ),
      badge: "Join Waitlist",
    },
    {
      href: "/tokenomics",
      label: "Tokenomics",
      color: "text-[#ff00ff]",
      hoverColor: "hover:text-[#00ffff]",
      borderColor: "border-[#ff00ff]",
      bgHoverColor: "hover:bg-[#ff00ff]/10",
      icon: (
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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      href: "#",
      label: "Chrome Extension (Soon)",
      color: "text-[#00ffff]/60",
      hoverColor: "hover:text-[#00ffff]",
      borderColor: "border-[#00ffff]",
      bgHoverColor: "hover:bg-[#00ffff]/10",
      icon: null,
    },
  ];

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

  return (
    <header className="w-full border-b border-[#ffa500]/20 backdrop-blur-md bg-black/50 p-3 sm:p-4 md:p-5 sticky top-0 z-50">
      <div className="mx-auto px-2 flex items-center justify-between">
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

        <nav className="hidden md:flex items-center justify-center flex-1">
          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <div key={item.label} className="relative group">
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`${pixelMonoFont.className} text-lg ${
                      item.color
                    } ${item.hoverColor} transition-colors ${
                      pathname === item.href
                        ? `border-b-2 ${item.borderColor} pb-1`
                        : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    className={`${pixelMonoFont.className} text-lg ${item.color} ${item.hoverColor} transition-colors`}
                  >
                    {item.label}
                  </button>
                )}
                {item.badge && (
                  <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-medium bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/40 rounded-md shadow-[0_0_10px_rgba(0,255,255,0.3)] backdrop-blur-sm animate-pulse transform hover:scale-105 transition-all duration-300">
                    <span className="relative inline-flex items-center">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#00ffff] rounded-full animate-ping"></span>
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#00ffff] rounded-full"></span>
                      <span className="ml-3">{item.badge}</span>
                    </span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            {ready && authenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#00ff00] bg-transparent text-[#00ff00] hover:bg-[#00ff00]/10 hover:text-[#00ffff] font-semibold transition-all duration-200">
                    <Wallet className="w-5 h-5" strokeWidth={2} />
                    <span className="truncate max-w-[80px]">
                      {connectedWallets.length > 0
                        ? connectedWallets[0].address.slice(0, 6) +
                          "..." +
                          connectedWallets[0].address.slice(-4)
                        : "Wallet"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-[220px] bg-black border border-[#00ff00]/30"
                >
                  <div className="px-3 py-2 text-xs text-[#00ff00] font-mono">
                    Connected Wallets
                  </div>
                  {connectedWallets.length > 0 ? (
                    connectedWallets.map((w) => (
                      <DropdownMenuItem
                        key={w.address}
                        className="gap-2 text-[#00ffff] font-mono"
                      >
                        <Wallet className="w-4 h-4" />
                        <span className="truncate">
                          {w.address.slice(0, 8)}...{w.address.slice(-4)}
                        </span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled className="text-slate-400">
                      No wallets connected
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="gap-2 text-red-500 font-semibold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                className={`${pixelFont.className} text-[10px] xs:text-xs sm:text-sm bg-transparent border-2 border-[#00ff00] hover:bg-[#00ff00]/10 text-[#00ff00] hover:text-[#00ffff] font-semibold px-2 sm:px-4 md:px-6 py-1 sm:py-1.5 md:py-2 rounded-xl shadow-[0_0_10px_rgba(0,255,0,0.3)] hover:shadow-[0_0_15px_rgba(0,255,0,0.5)] transition-all duration-200`}
                onClick={login}
              >
                Connect Wallet
              </button>
            )}
          </div>

          <div className="block md:hidden relative z-50">
            <button
              id="mobile-menu-button"
              className="btn btn-sm btn-circle bg-[#00ff00]/10 hover:bg-[#00ff00]/20 border border-[#00ff00]/40 text-[#00ff00]"
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

            {mobileMenuOpen && (
              <div
                id="mobile-menu-container"
                className="z-[100] bg-black/95 backdrop-blur-md rounded-xl shadow-[0_0_15px_rgba(0,255,0,0.3)] border border-[#00ff00]/30 fixed top-16 right-2 w-72 overflow-hidden"
              >
                <div className="flex flex-col p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="absolute top-2 right-2 text-[#00ff00] hover:text-[#00ffff] p-2"
                  >
                    <X className="h-6 w-6" />
                  </button>

                  <div className="space-y-4 mt-2">
                    <div className="px-2 py-1 text-[#00ffff] text-sm font-semibold uppercase">
                      Navigation
                    </div>
                    {navItems.map((item) => (
                      <div
                        key={item.label}
                        className="relative"
                        onClick={() => {
                          setMobileMenuOpen(false);
                        }}
                      >
                        {item.href ? (
                          <Link
                            href={item.href}
                            className={`${
                              pixelMonoFont.className
                            } flex items-center gap-2 px-4 py-3 text-lg ${
                              item.color
                            } ${item.hoverColor} ${
                              item.bgHoverColor
                            } rounded-lg transition-colors ${
                              pathname === item.href
                                ? `border-b-2 ${item.borderColor}`
                                : ""
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {item.icon}
                            {item.label}
                          </Link>
                        ) : (
                          <button
                            className={`${pixelMonoFont.className} w-full flex items-center gap-2 px-4 py-3 text-lg ${item.color} ${item.hoverColor} ${item.bgHoverColor} rounded-lg transition-colors`}
                          >
                            {item.icon}
                            {item.label}
                          </button>
                        )}
                        {item.badge && (
                          <span className="absolute top-4 right-2 px-2 py-0.5 text-xs bg-[#00ffff]/20 text-[#00ffff] border border-[#00ffff]/40 rounded-full animate-pulse">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#00ff00]/20 pt-4 mt-2">
                    <div className="px-2 py-1 text-[#00ffff] text-sm font-semibold uppercase mb-3">
                      Wallet
                    </div>
                    <div className="p-2">
                      {ready && authenticated ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#00ff00] bg-transparent text-[#00ff00] hover:bg-[#00ff00]/10 hover:text-[#00ffff] font-semibold transition-all duration-200 w-full">
                              <Wallet className="w-5 h-5" strokeWidth={2} />
                              <span className="truncate max-w-[80px]">
                                {connectedWallets.length > 0
                                  ? connectedWallets[0].address.slice(0, 6) +
                                    "..." +
                                    connectedWallets[0].address.slice(-4)
                                  : "Wallet"}
                              </span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="min-w-[220px] bg-black border border-[#00ff00]/30"
                          >
                            <div className="px-3 py-2 text-xs text-[#00ff00] font-mono">
                              Connected Wallets
                            </div>
                            {connectedWallets.length > 0 ? (
                              connectedWallets.map((w) => (
                                <DropdownMenuItem
                                  key={w.address}
                                  className="gap-2 text-[#00ffff] font-mono"
                                >
                                  <Wallet className="w-4 h-4" />
                                  <span className="truncate">
                                    {w.address.slice(0, 8)}...
                                    {w.address.slice(-4)}
                                  </span>
                                </DropdownMenuItem>
                              ))
                            ) : (
                              <DropdownMenuItem
                                disabled
                                className="text-slate-400"
                              >
                                No wallets connected
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={logout}
                              className="gap-2 text-red-500 font-semibold cursor-pointer"
                            >
                              <LogOut className="w-4 h-4" />
                              Logout
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <button
                          className={`${pixelFont.className} text-[10px] xs:text-xs sm:text-sm bg-transparent border-2 border-[#00ff00] hover:bg-[#00ff00]/10 text-[#00ff00] hover:text-[#00ffff] font-semibold px-2 sm:px-4 md:px-6 py-1 sm:py-1.5 md:py-2 rounded-xl shadow-[0_0_10px_rgba(0,255,0,0.3)] hover:shadow-[0_0_15px_rgba(0,255,0,0.5)] transition-all duration-200 w-full`}
                          onClick={login}
                        >
                          Connect Wallet
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <WaitlistDialog
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
      />
    </header>
  );
}

export default Navbar;
