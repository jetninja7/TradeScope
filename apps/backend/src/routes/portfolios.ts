import express from 'express';
import { prisma } from '@tradescope/database';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { verifyPortfolioOwnership } from '../middleware/ownership';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// GET /portfolios - List user's portfolios
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: req.userId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(portfolios);
  } catch (error) {
    next(error);
  }
});

// GET /portfolios/:id - Get portfolio with holdings
router.get('/:id', authenticate, verifyPortfolioOwnership, async (req: AuthRequest, res, next) => {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: req.params.id },
      include: {
        holdings: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!portfolio) {
      throw new AppError(404, 'NOT_FOUND', 'Portfolio not found');
    }

    // Map holdings to include null price fields (for Phase 2B)
    const portfolioWithPrices = {
      ...portfolio,
      holdings: (portfolio.holdings || []).map(h => ({
        ...h,
        currentPrice: null,
        totalValue: null,
        profitLoss: null,
        profitLossPercent: null
      }))
    };

    res.json(portfolioWithPrices);
  } catch (error) {
    next(error);
  }
});

// PATCH /portfolios/:id - Update portfolio
router.patch('/:id', authenticate, verifyPortfolioOwnership, async (req: AuthRequest, res, next) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (!name && description === undefined) {
      throw new AppError(400, 'VALIDATION_ERROR', 'At least one field (name or description) must be provided');
    }

    if (name && (typeof name !== 'string' || name.length === 0 || name.length > 100)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Name must be 1-100 characters');
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const portfolio = await prisma.portfolio.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true
      }
    });

    res.json(portfolio);
  } catch (error) {
    next(error);
  }
});

// DELETE /portfolios/:id - Delete portfolio
router.delete('/:id', authenticate, verifyPortfolioOwnership, async (req: AuthRequest, res, next) => {
  try {
    await prisma.portfolio.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
