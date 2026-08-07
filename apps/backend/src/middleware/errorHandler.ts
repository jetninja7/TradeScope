import type { Request, Response, NextFunction } from 'express';
import type { ErrorResponse } from '@tradescope/shared-types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    const errorResponse: ErrorResponse = {
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    };
    return res.status(err.statusCode).json(errorResponse);
  }

  // Unhandled errors
  console.error('Unhandled error:', err);
  const errorResponse: ErrorResponse = {
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  };
  res.status(500).json(errorResponse);
}
