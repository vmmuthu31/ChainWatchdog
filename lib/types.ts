export interface Token {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
  totalHolders: number;
}

export interface WithToken {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
  totalHolders: number;
}

export interface Summary {
  risk: "very_low" | "low" | "medium" | "high" | "very_high";
  riskLevel: number;
}

export interface HoneypotResult {
  isHoneypot: boolean;
  honeypotReason?: string;
}

export interface MaxValues {
  token: number;
  tokenWei: string;
  withToken: number;
  withTokenWei: string;
}

export interface SimulationResult {
  maxBuy?: MaxValues;
  maxSell?: MaxValues;
  buyTax: number;
  sellTax: number;
  transferTax: number;
  buyGas: string;
  sellGas: string;
}

export interface TaxDistribution {
  tax: number;
  count: number;
}

export interface HolderAnalysis {
  holders: string;
  successful: string;
  failed: string;
  siphoned: string;
  averageTax: number;
  averageGas: number;
  highestTax: number;
  highTaxWallets: string;
  taxDistribution: TaxDistribution[];
}

export interface ContractCode {
  openSource: boolean;
  rootOpenSource: boolean;
  isProxy: boolean;
  hasProxyCalls: boolean;
}

export interface Chain {
  id: string;
  name: string;
  shortName: string;
  currency: string;
}

export interface PairInfo {
  name: string;
  address: string;
  token0: string;
  token1: string;
  type: "UniswapV2" | "UniswapV3";
}

export interface Pair {
  pair: PairInfo;
  chainId: string;
  reserves0: string;
  reserves1: string;
  liquidity: number;
  router: string;
  createdAtTimestamp: string;
  creationTxHash: string;
}

export interface HoneypotResponse {
  token: Token;
  withToken?: WithToken;
  summary: Summary;
  simulationSuccess: boolean;
  simulationError?: string;
  honeypotResult: HoneypotResult;
  simulationResult: SimulationResult;
  holderAnalysis?: HolderAnalysis;
  flags: string[];
  contractCode?: ContractCode;
  chain: Chain;
  router?: string;
  pair?: Pair;
  pairAddress?: string;
}

export interface ContractVerificationResponse {
  isContract: boolean;
  isRootOpenSource: boolean;
  fullCheckPerformed: boolean;
  summary?: {
    isOpenSource: boolean;
    hasProxyCalls: boolean;
  };
  contractsOpenSource?: Record<string, boolean>;
  contractCalls?: Array<{
    caller: string;
    callee: string;
    type: string;
  }>;
}

export interface PairResponse {
  ChainID: number;
  Pair: {
    Name: string;
    Tokens: string[];
    Address: string;
  };
  Reserves: number[];
  Liquidity: number;
  Router: string;
}

interface Holder {
  address: string;
  balance: string;
  alias: string;
  isContract: boolean;
}

export interface TopHoldersResponse {
  totalSupply: string;
  holders: Holder[];
}

export type EndpointType = "honeypot" | "contract" | "pairs" | "holders";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTokenAnalysis?: boolean;
};

export interface YamlData {
  SpamContracts?: string[];
  [key: string]: unknown;
}

export interface TokenBalance {
  contract_decimals: number;
  contract_name: string;
  contract_ticker_symbol: string;
  contract_address: string;
  supports_erc: string[] | null;
  logo_url: string;
  contract_display_name: string;
  logo_urls: {
    token_logo_url: string;
    protocol_logo_url: string | null;
    chain_logo_url: string;
  };
  last_transferred_at: string;
  block_height: number;
  native_token: boolean;
  type: string;
  is_spam: boolean;
  balance: string;
  balance_24h: string;
  quote_rate: number;
  quote_rate_24h: number;
  quote: number;
  pretty_quote: string;
  quote_24h: number;
  pretty_quote_24h: string;
  protocol_metadata: Record<string, unknown>;
  nft_data: Record<string, unknown>;
  spamConfidence?: "YES" | "MAYBE" | "NO";
  spamScore?: string;
}

export interface GoldRushResponse {
  data: {
    address: string;
    updated_at: string;
    next_update_at: string;
    quote_currency: string;
    chain_id: number;
    chain_name: string;
    items: TokenBalance[];
  };
  error: boolean;
  error_message: string | null;
  error_code: string | null;
}

export interface ChainInfo {
  id: string;
  name: string;
  explorer: string;
  type: string;
  logoUrl?: string;
  category?: "EVM" | "Layer2" | "Non-EVM" | "Other";
}
