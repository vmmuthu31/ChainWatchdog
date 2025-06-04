export interface ChainInfo {
  id: string;
  name: string;
  explorer: string;
  type: "Mainnet" | "Testnet";
  logoUrl?: string;
  category: string;
}

export interface GoldRushResponse {
  data: {
    address: string;
    updated_at: string;
    items: TokenItem[];
    pagination: {
      has_more: boolean;
      page_number: number;
      page_size: number;
      total_count: number;
    };
  };
}

export interface TokenItem {
  contract_decimals: number;
  contract_name: string;
  contract_ticker_symbol: string;
  contract_address: string;
  logo_url: string;
  balance: string;
  quote: number;
  pretty_quote: string;
  is_spam: boolean;
  spamScore: string;
}
