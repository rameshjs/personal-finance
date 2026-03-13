// Matches the Rust Investment struct (serde camelCase renames)
export interface Investment {
  id: string;
  name: string;
  ticker: string;
  type: 'stock' | 'mf';
  exchange?: 'NS' | 'BO';
  schemeName?: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice?: number;
  lastUpdated?: number;
  fetchError: boolean;
}

// Matches the Rust MFSearchResult struct
export interface MFSearchResult {
  schemeCode: string;
  schemeName: string;
}

// Payload for add_investment — Rust fills in price/error after insert
export type NewInvestment = Omit<Investment, 'currentPrice' | 'lastUpdated' | 'fetchError'>;
