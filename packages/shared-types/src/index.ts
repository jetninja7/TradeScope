export * from './auth';
export * from './portfolio';
export * from './market';
export * from './alert';
export * from './websocket';

// Re-export commonly used Prisma enums
export { AssetType, InsightType } from '@tradescope/database';

// Error response type
export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
  };
}

// Pagination types
export interface PaginatedRequest {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
