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
  UNKNOWN = "unknown",
}

export interface CommandHandler {
  execute: (ctx: BotContext) => Promise<void>;
}

export interface WalletScanResult {
  address: string;
  chainId: string;
  spamTokensCount: number;
  safeTokensCount: number;
  totalTokens: number;
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
