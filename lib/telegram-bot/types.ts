import { Message } from "node-telegram-bot-api";

export interface BotContext {
  message: Message;
  args: string[];
  command: string;
}

export enum CommandType {
  SCAN_WALLET = "scan_wallet",
  CHECK_CONTRACT = "check_contract",
  HONEYPOT = "honeypot",
  HELP = "help",
  START = "start",
  NETWORKS = "networks",
  GREETING = "greeting",
  UNKNOWN = "unknown",
}

export interface CommandHandler {
  execute: (ctx: BotContext) => Promise<void>;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  balance: string;
  formattedBalance: string;
  value?: number;
  isSpam: boolean;
  contractAddress: string;
}

export interface WalletScanResult {
  address: string;
  chainId: string;
  spamTokensCount: number;
  safeTokensCount: number;
  totalTokens: number;
  totalValue?: number;
  tokens: TokenInfo[];
}

export interface ContractCheckResult {
  address: string;
  chainId: string;
  isContract: boolean;
  isOpenSource: boolean;
  hasProxyCalls?: boolean;
  securityRisks?: {
    hasMintAuthority?: boolean;
    hasFreezeAuthority?: boolean;
    isMutable?: boolean;
    hasTransferFee?: boolean;
  };
}

export interface HoneypotCheckResult {
  address: string;
  chainId: string;
  isHoneypot: boolean;
  honeypotReason?: string;
  buyTax?: number;
  sellTax?: number;
  tokenName?: string;
  tokenSymbol?: string;
}

export interface TokenAnalysisResult {
  honeypot: HoneypotData | null;
  contract: ContractData | null;
  pairs: PairData[];
  holders: HoldersData | null;
  detectedChain: string;
  tokenInfo: {
    name: string;
    symbol: string;
    decimals?: number;
  };
}

export interface HoneypotData {
  honeypotResult?: {
    isHoneypot: boolean;
    honeypotReason?: string;
  };
  simulationResult?: {
    buyTax?: number;
    sellTax?: number;
    transferTax?: number;
    buyGas?: string | number;
    sellGas?: string | number;
  };
  summary?: {
    risk?: string;
    riskLevel?: number;
    riskReason?: string;
  };
  flags?:
    | string[]
    | {
        isHoneypot?: boolean;
        isSellable?: boolean;
        isOpen?: boolean;
        isAntiWhale?: boolean;
        hasAntiBot?: boolean;
        staysLiquid?: boolean;
        routerOkForOps?: boolean;
        hasForeignCalls?: boolean;
        hasPermissions?: boolean;
      };
  token?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    address?: string;
    totalHolders?: number;
  };
  withToken?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    address?: string;
    totalHolders?: number;
  };
  holderAnalysis?: {
    holders?: string;
    successful?: string;
    failed?: string;
    siphoned?: string;
    averageTax?: number;
    averageGas?: number;
    highestTax?: number;
    highTaxWallets?: string;
    snipersFailed?: number;
    snipersSuccess?: number;
  };
  contractCode?: {
    openSource?: boolean;
    rootOpenSource?: boolean;
    isProxy?: boolean;
    hasProxyCalls?: boolean;
  };
  chain?: {
    id?: string;
    name?: string;
    shortName?: string;
    currency?: string;
  };
  pair?: {
    pair?: {
      name?: string;
      address?: string;
      token0?: string;
      token1?: string;
      type?: string;
    };
    chainId?: string;
    reserves0?: string;
    reserves1?: string;
    liquidity?: number;
    router?: string;
    createdAtTimestamp?: string;
    creationTxHash?: string;
  };
  pairAddress?: string;
  risks?: Array<{
    name?: string;
    value?: string;
    description?: string;
    score?: number;
    level?: string;
  }>;
  score?: number;
  score_normalised?: number;
}

export interface ContractData {
  isOpenSource?: boolean;
  isVerified?: boolean;
}

export interface PairData {
  dexName?: string;
  liquidity?: {
    usd?: number;
  };
  pairName?: string;
  Liquidity?: number;
  Pair?: {
    Name?: string;
    Address?: string;
  };
  ChainID?: number;
}

export interface HoldersData {
  totalHolders?: number;
  holders?: Array<{
    percent?: string;
    percentage?: string;
  }>;
  recentHolderAnalysis?: {
    canSell?: number;
    total?: number;
    avgGas?: string;
    avgTax?: string;
  };
}

export interface LiquidityInfo {
  dex: string;
  liquidityUsd: number;
  liquidityPercent: string;
  pairName: string;
  pairAddress?: string;
}

export interface ContractInfo {
  isOpenSource: boolean;
  isVerified: boolean;
  canSell: string;
  avgGas: string;
  avgTax: string;
  isProxy: boolean;
  hasProxyCalls: boolean;
}
