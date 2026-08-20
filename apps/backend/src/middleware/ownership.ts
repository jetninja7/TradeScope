import type { Response, NextFunction } from 'express';
import { prisma } from '@tradescope/database';
import type { AuthRequest } from './auth';
import { AppError } from './errorHandler';

export async function verifyPortfolioOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const portfolioId = req.params.id || req.params.portfolioId;
    const userId = req.userId;

    if (!portfolioId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Portfolio ID required');
    }

    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: { userId: true }
    });

    if (!portfolio) {
      throw new AppError(404, 'NOT_FOUND', 'Portfolio not found');
    }

    if (portfolio.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied');
    }

    next();
  } catch (error) {
    next(error);
  }
}

export async function verifyHoldingOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const holdingId = req.params.id;
    const userId = req.userId;

    if (!holdingId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Holding ID required');
    }

    const holding = await prisma.holding.findUnique({
      where: { id: holdingId },
      include: {
        portfolio: {
          select: { userId: true }
        }
      }
    });

    if (!holding) {
      throw new AppError(404, 'NOT_FOUND', 'Holding not found');
    }

    if (holding.portfolio.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied');
    }

    next();
  } catch (error) {
    next(error);
  }
}
