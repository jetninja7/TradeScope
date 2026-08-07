import { AssetType } from '@tradescope/database';

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
}

export interface PortfolioResponse {
  id: string;
  name: string;
  description: string | null;
  totalValue: number;
  change24h: number;
  changePercent24h: number;
  holdings: HoldingWithPrice[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateHoldingRequest {
  symbol: string;
  assetType: AssetType;
  quantity: number;
  avgPurchasePrice: number;
  notes?: string;
}

export interface UpdateHoldingRequest {
  quantity?: number;
  avgPurchasePrice?: number;
  notes?: string;
}

export interface HoldingWithPrice {
  id: string;
  symbol: string;
  assetType: AssetType;
  quantity: number;
  avgPurchasePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  assetType: AssetType;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  createdAt: string;
}
