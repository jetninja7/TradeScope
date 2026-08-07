import { AssetType } from '@tradescope/database';

export interface AssetSearchResult {
  symbol: string;
  name: string;
  assetType: AssetType;
  exchange: string | null;
  logoUrl: string | null;
}

export interface AssetPriceResponse {
  symbol: string;
  price: number;
  volume: number | null;
  marketCap: number | null;
  change24h: number;
  changePercent24h: number;
  lastUpdated: string;
}

export interface PriceHistoryPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface PriceHistoryRequest {
  symbol: string;
  interval: '1min' | '5min' | '1hour' | '1day';
  range: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
}

export interface PriceHistoryResponse {
  symbol: string;
  interval: string;
  data: PriceHistoryPoint[];
}
