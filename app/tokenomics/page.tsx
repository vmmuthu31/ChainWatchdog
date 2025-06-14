"use client";

import React, { useState, useRef, useEffect } from "react";
import { pixelFont, pixelMonoFont } from "@/lib/font";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useInView } from "framer-motion";
import {
  ShieldCheck,
  Calendar,
  Zap,
  Users,
  ArrowRight,
  Terminal,
  LineChart,
  Lock,
  Rocket,
} from "lucide-react";

function TokenomicsPage() {
  const [activeMonth, setActiveMonth] = useState<number>(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const roadmapRef = useRef<HTMLDivElement>(null);
  useScroll({
    target: roadmapRef,
    offset: ["start end", "end start"],
  });

  const featuresRef = useRef<HTMLDivElement>(null);
  const isFeaturesInView = useInView(featuresRef, {
    once: true,
    margin: "-100px",
  });
  const productsRef = useRef<HTMLDivElement>(null);
  const isProductsInView = useInView(productsRef, {
    once: true,
    margin: "-100px",
  });

  const tokenUtility = [
    {
      category: "AI Agent",
      items: [
        {
          name: "Credit burn",
          description:
            'Every advanced query (e.g., "simulate this contract for hidden self-destructs") costs a small on-chain burn of $R.',
          benefit: "Simple pay-per-use; keeps supply deflationary.",
        },
        {
          name: "Staked quota",
          description:
            "Stake 1,000 $R → 1,000 free queries / month. Stake more, get more. Unstake anytime.",
          benefit:
            "Power users prefer predictable limits over micro-pays. Staking also locks supply.",
        },
        {
          name: "Tier passes (NFT)",
          description:
            "Mint an NFT pass with $R (one-time burn). Bronze/Silver/Gold unlock different agent latencies and API rate-limits.",
          benefit:
            "Shows status, resellable on secondary markets, easy to check in code.",
        },
        {
          name: "Governance hooks",
          description:
            "Token holders vote on which chains / threat models the agent adds next.",
          benefit: "Keeps roadmap aligned with paying users.",
        },
      ],
      iconColor: "text-[#00ff00]",
      borderColor: "border-[#00ff00]/30",
      hoverColor: "hover:border-[#00ff00]",
    },
    {
      category: "Browser Extension",
      items: [
        {
          name: 'Freemium + "Guardian Mode"',
          description:
            "Manual click-to-scan is free. Holding 500 $R toggles Guardian Mode: auto-scans every txn, shows risk badge in the toolbar, pushes phishing warnings.",
          benefit:
            "Clear, visible upgrade; pushes even casual users to accumulate tokens.",
        },
        {
          name: "Ad-free analytics",
          description:
            'Free users see a small "Upgrade for real-time" ribbon. Token holders see a clean UI and advanced graphs.',
          benefit: "Classic SaaS upsell but enforced by on-chain balance.",
        },
        {
          name: "Referral mining",
          description:
            "Each time a token holder shares their referral link and a new wallet installs the extension, referrer earns micro-rewards in $R (paid from a community fund).",
          benefit: "Viral growth loop that circulates tokens.",
        },
      ],
      iconColor: "text-[#00ffff]",
      borderColor: "border-[#00ffff]/30",
      hoverColor: "hover:border-[#00ffff]",
    },
    {
      category: "MetaMask Snap",
      items: [
        {
          name: "Proof-of-Stake heartbeat",
          description:
            "Snap checks every 24h that the wallet still holds ≥ X $R. If not, background monitoring pauses until top-up.",
          benefit: "Keeps tokens parked in hot wallets; constant buy-pressure.",
        },
        {
          name: "Insurance pool access",
          description:
            "Stake tokens into a shared pool. If Snap fails to warn about a verified scam and the user loses funds, pool reimburses a % (community-voted rules).",
          benefit: "Turns $R into real economic insurance.",
        },
        {
          name: "Dynamic gas rebates",
          description:
            "Snap tracks user's on-chain gas spend. Each month, top 10% of stakers get $R rebates.",
          benefit:
            'Gamifies "hold more to earn gas back," driving larger stakes.',
        },
      ],
      iconColor: "text-[#ff00ff]",
      borderColor: "border-[#ff00ff]/30",
      hoverColor: "hover:border-[#ff00ff]",
    },
  ];

  const liveProducts = [
    {
      name: "Spam Detector",
      description: "Hidden spam tokens & malicious approvals",
      actions: [
        "Paste wallet → get instant threat list",
        "One-click Recent Spam lookup",
      ],
      coverage: "100+ chains • 4.8M wallets scanned",
      icon: <ShieldCheck className="h-10 w-10 text-[#00ff00]" />,
      color: "border-[#00ff00]/30",
      hoverColor: "hover:border-[#00ff00]",
    },
    {
      name: "Honeypot Scanner",
      description: "Buy-only traps & sell-tax rugs",
      actions: [
        "Contract address → pass / fail",
        "Auto-detect chain or pick from list",
      ],
      coverage: "7 chains live • 926K flagged honeypots",
      icon: <Lock className="h-10 w-10 text-[#00ffff]" />,
      color: "border-[#00ffff]/30",
      hoverColor: "hover:border-[#00ffff]",
    },
    {
      name: "Contract Verify",
      description: "Ownership, renounce status, proxy risk",
      actions: ["Shows verified source", "Upgrade paths, and admin addresses"],
      coverage: "Same 7 chains",
      icon: <Terminal className="h-10 w-10 text-[#ff00ff]" />,
      color: "border-[#ff00ff]/30",
      hoverColor: "hover:border-[#ff00ff]",
    },
    {
      name: "Top Holders",
      description: "Whale concentration",
      actions: ["Live chart of holder %", "Unlock risk"],
      coverage: "EVM chains",
      icon: <LineChart className="h-10 w-10 text-[#ffff00]" />,
      color: "border-[#ffff00]/30",
      hoverColor: "hover:border-[#ffff00]",
    },
  ];

  const roadmapItems = [
    {
      month: "June",
      title: "$R Token Launch",
      features: [
        "Bonding-curve sale → Meteora DEX pool",
        "No privates / no team pre-mint",
        "Browser Extension v0.7",
        "Click-to-scan any token/contract",
        "Free = manual scans",
        "Stake 500 $R → Guardian Mode (auto-scan + phishing alerts)",
      ],
      icon: <Zap className="h-8 w-8 text-[#00ff00]" />,
    },
    {
      month: "July",
      title: "AI Agent Web App α",
      features: [
        "Single-wallet deep scans (UI)",
        "Access pass burns 50 $R",
        "Each pro scan burns 0.05 $R",
        "Public Bug-Bounty Board",
        "Report scams → verified → database grows",
        "Rewards paid from 10% of all token burns",
        "Verified report = variable $R payout",
        "AI Agent Web App β",
        "Batch scans, PDF export, risk-diff tracker",
        "Stake 1,000 $R → 1,000 free scans/month",
        "Unstake anytime; quota pauses",
      ],
      icon: <Users className="h-8 w-8 text-[#00ffff]" />,
    },
    {
      month: "August",
      title: "MetaMask Snap α",
      features: [
        "24/7 wallet guard inside MetaMask",
        "Snap checks ≥ 800 $R balance daily",
        "Below → Snap switches to manual mode",
        "Browser Extension v1.0",
        "Scam-site blocker, live threat feed",
        "Guardian users toggle real-time blocks",
        "Stake ≥ 5,000 $R → ad-free analytics",
        "DAO Kick-off & Snapshot Governance",
        "Community proposals & voting",
        "≥ 2,000 $R to propose",
        "1 token = 1 vote",
        "Treasury multisig adds 2 elected community signers",
        "AI Agent Public API (dev preview)",
        "Risk-score endpoint for integration",
        "Pay-per-call: 0.02 $R",
        "Partners staking 50k get 25% discount",
      ],
      icon: <ShieldCheck className="h-8 w-8 text-[#ff00ff]" />,
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const viewHeight = window.innerHeight;
        const centerPosition = (rect.top + rect.bottom) / 2;
        const percentageInView = (viewHeight - centerPosition) / viewHeight;

        if (percentageInView < 0.3) {
          setActiveMonth(0);
        } else if (percentageInView < 0.6) {
          setActiveMonth(1);
        } else {
          setActiveMonth(2);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <Navbar />

      <main className="container mx-auto flex flex-1 flex-col items-center gap-8 md:gap-12 py-6 md:py-12 px-4 md:px-0">
        {/* Hero Section */}
        <div className="text-center space-y-4 md:space-y-6 max-w-4xl relative w-full">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00ff00]/20 via-transparent to-transparent blur-3xl"></div>

          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={`${pixelFont.className} text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[#00ff00] via-[#00ffff] to-[#ff00ff] bg-clip-text text-transparent glow-green-md`}
          >
            $R TOKENOMICS
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`${pixelMonoFont.className} text-lg sm:text-xl md:text-2xl text-[#00ffff] leading-relaxed max-w-2xl mx-auto`}
          >
            Utility-driven token powering the RugProof ecosystem —
            <span className="text-[#ff00ff] font-semibold">
              {" "}
              security that pays for itself
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-6 sm:mt-8"
          >
            <Badge className="py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm md:text-base bg-[#00ff00]/20 text-[#00ff00] border border-[#00ff00]/30 hover:bg-[#00ff00]/30">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Deflationary Burns
            </Badge>
            <Badge className="py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm md:text-base bg-[#00ffff]/20 text-[#00ffff] border border-[#00ffff]/30 hover:bg-[#00ffff]/30">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> DAO Governance
            </Badge>
            <Badge className="py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm md:text-base bg-[#ff00ff]/20 text-[#ff00ff] border border-[#ff00ff]/30 hover:bg-[#ff00ff]/30">
              <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Stake-to-Use Model
            </Badge>
          </motion.div>
        </div>

        {/* Key Principles */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full max-w-4xl backdrop-blur-lg bg-black/50 p-4 sm:p-6 md:p-8 rounded-2xl border border-[#00ff00]/30 shadow-xl relative z-[10] transform hover:shadow-[0_0_50px_-12px_rgba(0,255,0,0.5)] overflow-hidden"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#00ff00]/10 via-transparent to-transparent"></div>

          <h2 className={`${pixelFont.className} text-xl sm:text-2xl text-[#00ffff] mb-4 sm:mb-6`}>
            KEY PRINCIPLES
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-black/70 p-4 sm:p-5 rounded-xl border border-[#00ff00]/30 transform transition-all hover:scale-105 hover:border-[#00ff00]">
              <h3
                className={`${pixelMonoFont.className} text-lg sm:text-xl text-[#00ff00] mb-2 sm:mb-3`}
              >
                Try → Stake → Burn
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Free basics, premium via stake, power-use via burn. Simple
                economy that rewards users.
              </p>
            </div>

            <div className="bg-black/70 p-4 sm:p-5 rounded-xl border border-[#00ffff]/30 transform transition-all hover:scale-105 hover:border-[#00ffff]">
              <h3
                className={`${pixelMonoFont.className} text-lg sm:text-xl text-[#00ffff] mb-2 sm:mb-3`}
              >
                Ship Every 2-3 Weeks
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Frequent drops keep momentum high and continuous utility
                expansion.
              </p>
            </div>

            <div className="bg-black/70 p-4 sm:p-5 rounded-xl border border-[#ff00ff]/30 transform transition-all hover:scale-105 hover:border-[#ff00ff]">
              <h3
                className={`${pixelMonoFont.className} text-lg sm:text-xl text-[#ff00ff] mb-2 sm:mb-3`}
              >
                Community-First
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Bug bounties, DAO votes, Genesis perks reward engaged users.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Roadmap Section */}
        <div ref={roadmapRef} className="w-full max-w-4xl py-8 md:py-12 relative">
          <h2
            className={`${pixelFont.className} text-2xl sm:text-3xl text-center text-[#00ffff] mb-10 md:mb-16`}
          >
            <Calendar className="inline-block mr-2 mb-1 text-[#00ff00]" />{" "}
            ROADMAP
          </h2>

          {/* Center timeline line - visible only on desktop */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 top-28 bottom-20 w-1 bg-gradient-to-b from-[#00ff00] via-[#00ffff] to-[#ff00ff] z-0"></div>

          {/* Mobile timeline line - only visible on mobile */}
          <div className="md:hidden absolute left-6 top-28 bottom-20 w-1 bg-gradient-to-b from-[#00ff00] via-[#00ffff] to-[#ff00ff] z-0"></div>

          <div ref={timelineRef} className="relative z-10 space-y-12 md:space-y-24">
            {roadmapItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{
                  opacity: activeMonth >= index ? 1 : 0.5,
                  x: 0,
                  scale: activeMonth === index ? 1.02 : 1,
                }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.2,
                }}
                className={`flex ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } flex-col items-start md:items-center gap-4`}
              >
                {/* Month indicator on timeline - Desktop */}
                <div
                  className={`hidden md:block absolute left-1/2 transform -translate-x-1/2 z-20 p-2 rounded-full 
                  ${
                    activeMonth === index
                      ? "bg-black border-2 border-[#00ff00] shadow-[0_0_15px_rgba(0,255,0,0.7)]"
                      : "bg-black/80 border border-gray-700"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black">
                    {item.icon}
                  </div>
                </div>

                {/* Month indicator on timeline - Mobile */}
                <div
                  className={`md:hidden absolute left-6 transform -translate-x-1/2 z-20 p-1.5 rounded-full 
                  ${
                    activeMonth === index
                      ? "bg-black border-2 border-[#00ff00] shadow-[0_0_15px_rgba(0,255,0,0.7)]"
                      : "bg-black/80 border border-gray-700"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black">
                    {item.icon}
                  </div>
                </div>

                {/* Content card */}
                <div
                  className={`ml-10 md:ml-0 w-full md:w-5/12 bg-black/60 p-4 sm:p-6 rounded-2xl border 
                  ${
                    activeMonth === index
                      ? "border-[#00ff00]/70 shadow-[0_0_30px_-12px_rgba(0,255,0,0.5)]"
                      : "border-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3 md:mb-4">
                    <Badge
                      className={`py-0.5 sm:py-1 px-2 sm:px-3 text-xs sm:text-sm 
                      ${
                        index === 0
                          ? "bg-[#00ff00]/20 text-[#00ff00]"
                          : index === 1
                          ? "bg-[#00ffff]/20 text-[#00ffff]"
                          : "bg-[#ff00ff]/20 text-[#ff00ff]"
                      }`}
                    >
                      {item.month}
                    </Badge>
                    <h3
                      className={`${pixelMonoFont.className} text-lg sm:text-xl text-white`}
                    >
                      {item.title}
                    </h3>
                  </div>

                  <ul className="space-y-1 sm:space-y-2">
                    {item.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex gap-2 items-start">
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#00ff00] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm sm:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Empty div to maintain layout - only needed for desktop */}
                <div className="hidden md:block w-5/12"></div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Token Utility Section */}
        <div ref={featuresRef} className="w-full max-w-4xl mb-8 md:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={
              isFeaturesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.8 }}
            className={`${pixelFont.className} text-2xl sm:text-3xl text-center text-[#00ffff] mb-8 md:mb-12`}
          >
            <Zap className="inline-block mr-2 mb-1 text-[#00ff00]" /> TOKEN
            UTILITY
          </motion.h2>

          <div className="space-y-8 md:space-y-12">
            {tokenUtility.map((category, cIndex) => (
              <motion.div
                key={cIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={
                  isFeaturesInView
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.8, delay: 0.2 * cIndex }}
                className={`backdrop-blur-lg bg-black/50 p-4 sm:p-6 rounded-2xl border ${category.borderColor} overflow-hidden relative`}
              >
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-black via-transparent to-transparent"></div>

                <h3
                  className={`${pixelMonoFont.className} text-xl sm:text-2xl ${category.iconColor} mb-4 sm:mb-6`}
                >
                  {category.category} Utility
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {category.items.map((item, iIndex) => (
                    <motion.div
                      key={iIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={
                        isFeaturesInView
                          ? { opacity: 1, x: 0 }
                          : { opacity: 0, x: -20 }
                      }
                      transition={{ duration: 0.5, delay: 0.2 + 0.1 * iIndex }}
                      className={`bg-black/70 p-3 sm:p-4 rounded-xl border ${category.borderColor} ${category.hoverColor} transform transition-all duration-300 hover:scale-[1.02]`}
                    >
                      <h4
                        className={`${pixelMonoFont.className} text-base sm:text-lg text-white mb-1.5 sm:mb-2`}
                      >
                        {item.name}
                      </h4>
                      <p className="text-gray-300 text-xs sm:text-sm mb-1.5 sm:mb-2">
                        {item.description}
                      </p>
                      <p className="text-gray-400 text-xs">{item.benefit}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Live Products Section */}
        <div ref={productsRef} className="w-full max-w-4xl py-8 md:py-12">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={
              isProductsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.8 }}
            className={`${pixelFont.className} text-2xl sm:text-3xl text-center text-[#00ffff] mb-8 md:mb-12`}
          >
            <Rocket className="inline-block mr-2 mb-1 text-[#00ff00]" /> LIVE
            PRODUCTS
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {liveProducts.map((product, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={
                  isProductsInView
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className={`backdrop-blur-lg bg-black/50 p-4 sm:p-6 rounded-2xl border ${product.color} transform transition-all duration-300 ${product.hoverColor} hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  {product.icon}
                  <h3
                    className={`${pixelMonoFont.className} text-lg sm:text-xl text-white`}
                  >
                    {product.name}
                  </h3>
                </div>

                <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4">{product.description}</p>

                <div className="space-y-1 mb-3 sm:mb-4">
                  {product.actions.map((action, aIndex) => (
                    <div key={aIndex} className="flex items-start sm:items-center gap-1.5 sm:gap-2">
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-[#00ff00] mt-0.5 sm:mt-0 flex-shrink-0" />
                      <span className="text-gray-400 text-xs sm:text-sm">{action}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 sm:mt-4 border-t border-gray-800 pt-3 sm:pt-4">
                  <span
                    className={`${pixelMonoFont.className} text-xs sm:text-sm text-[#00ffff]`}
                  >
                    {product.coverage}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Metrics Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="w-full max-w-4xl backdrop-blur-lg bg-black/50 p-4 sm:p-6 md:p-8 rounded-2xl border border-[#ff00ff]/30 shadow-xl relative mx-4 sm:mx-6 md:mx-0 mb-8 md:mb-12 overflow-hidden"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#ff00ff]/10 via-transparent to-transparent"></div>

          <h2 className={`${pixelFont.className} text-xl sm:text-2xl text-[#ff00ff] mb-4 sm:mb-6`}>
            METRICS TO WATCH
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-black/70 p-4 sm:p-5 rounded-xl border border-[#00ff00]/20 transform transition-all hover:scale-105">
              <h3
                className={`${pixelMonoFont.className} text-lg sm:text-xl text-[#00ff00] mb-2 sm:mb-3`}
              >
                North-star
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">Monthly active protected wallets</p>
            </div>

            <div className="bg-black/70 p-4 sm:p-5 rounded-xl border border-[#00ffff]/20 transform transition-all hover:scale-105">
              <h3
                className={`${pixelMonoFont.className} text-lg sm:text-xl text-[#00ffff] mb-2 sm:mb-3`}
              >
                Token health
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                % supply staked, monthly burn rate, liquidity depth
              </p>
            </div>

            <div className="bg-black/70 p-4 sm:p-5 rounded-xl border border-[#ff00ff]/20 transform transition-all hover:scale-105">
              <h3
                className={`${pixelMonoFont.className} text-lg sm:text-xl text-[#ff00ff] mb-2 sm:mb-3`}
              >
                Revenue
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Scan burns, API fees, staking withdrawal fees
              </p>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

export default TokenomicsPage;
