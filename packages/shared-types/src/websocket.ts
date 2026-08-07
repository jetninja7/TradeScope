export type WebSocketClientMessage =
  | { type: 'subscribe:portfolio'; portfolioId: string }
  | { type: 'subscribe:asset'; symbol: string }
  | { type: 'unsubscribe:portfolio'; portfolioId: string }
  | { type: 'unsubscribe:asset'; symbol: string }
  | { type: 'ping' };

export type WebSocketServerMessage =
  | {
      type: 'price:update';
      symbol: string;
      price: number;
      change: number;
      changePercent: number;
      timestamp: string;
    }
  | {
      type: 'portfolio:value';
      portfolioId: string;
      totalValue: number;
      change24h: number;
      changePercent24h: number;
    }
  | {
      type: 'alert:triggered';
      alertId: string;
      alertName: string;
      message: string;
      priceAtTrigger: number;
      timestamp: string;
    }
  | {
      type: 'insight:ready';
      insightId: string;
      portfolioId: string;
      title: string;
      insightType: string;
    }
  | { type: 'pong' }
  | {
      type: 'error';
      message: string;
      code?: string;
    };
