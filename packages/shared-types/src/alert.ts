export type AlertConditionType =
  | 'price_target'
  | 'percent_change'
  | 'portfolio_value'
  | 'volume_spike'
  | 'volatility';

export interface PriceTargetCondition {
  type: 'price_target';
  symbol: string;
  target: number;
  direction: 'above' | 'below';
}

export interface PercentChangeCondition {
  type: 'percent_change';
  symbol: string;
  threshold: number;
  direction: 'up' | 'down' | 'either';
  timeframe: '1h' | '24h' | '7d';
}

export interface PortfolioValueCondition {
  type: 'portfolio_value';
  portfolioId: string;
  threshold: number;
  direction: 'above' | 'below';
}

export interface VolumeSpikeCondition {
  type: 'volume_spike';
  symbol: string;
  multiplier: number;
}

export interface VolatilityCondition {
  type: 'volatility';
  symbol: string;
  threshold: number;
  timeframe: '1h' | '24h';
}

export type AlertCondition =
  | PriceTargetCondition
  | PercentChangeCondition
  | PortfolioValueCondition
  | VolumeSpikeCondition
  | VolatilityCondition;

export interface CreateAlertRequest {
  name: string;
  condition: AlertCondition;
  portfolioId?: string;
}

export interface UpdateAlertRequest {
  name?: string;
  condition?: AlertCondition;
  isActive?: boolean;
}

export interface AlertResponse {
  id: string;
  name: string;
  condition: AlertCondition;
  isActive: boolean;
  lastTriggered: string | null;
  portfolioId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertTriggerResponse {
  id: string;
  alertId: string;
  triggeredAt: string;
  priceAtTrigger: number | null;
  metadata: any;
}
