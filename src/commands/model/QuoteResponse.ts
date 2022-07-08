export interface Market {
  price: number;
  changeAmount: number;
  changePercent: number;
}

export interface Quote {
  symbol: string;
  companyName: string;
  normalMarket: Market;
  afterMarket?: Market;
}

export interface QuoteResponse {
  symbol: string;
  quote: Quote | undefined;
  error: string | undefined;
}
