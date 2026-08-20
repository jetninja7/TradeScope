import express from 'express';
import { prisma, AssetType } from '@tradescope/database';
import { Decimal } from '@prisma/client/runtime/library';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { verifyPortfolioOwnership, verifyHoldingOwnership } from '../middleware/ownership';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// POST /portfolios/:portfolioId/holdings - Add holding
router.post(
  '/portfolios/:portfolioId/holdings',
  authenticate,
  verifyPortfolioOwnership,
  async (req: AuthRequest, res, next) => {
    try {
      const { symbol, assetType, quantity, avgPurchasePrice, notes } = req.body;
      const portfolioId = req.params.portfolioId;

      // Validation
      if (!symbol || !assetType || quantity === undefined || avgPurchasePrice === undefined) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Symbol, assetType, quantity, and avgPurchasePrice are required');
      }

      if (!['CRYPTO', 'STOCK'].includes(assetType)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Asset type must be CRYPTO or STOCK');
      }

      if (typeof quantity !== 'number' || quantity <= 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Quantity must be greater than 0');
      }

      if (typeof avgPurchasePrice !== 'number' || avgPurchasePrice <= 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Average purchase price must be greater than 0');
      }

      if (notes && notes.length > 500) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Notes must be 500 characters or less');
      }

      // Create holding
      const holding = await prisma.holding.create({
        data: {
          portfolioId,
          symbol: symbol.toUpperCase(),
          assetType: assetType as AssetType,
          quantity: new Decimal(quantity) as any,
          avgPurchasePrice: new Decimal(avgPurchasePrice) as any,
          notes: notes || null
        }
      });

      res.status(201).json(holding);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /holdings/:id - Update holding
router.patch('/holdings/:id', authenticate, verifyHoldingOwnership, async (req: AuthRequest, res, next) => {
  try {
    const { quantity, avgPurchasePrice, notes } = req.body;

    // Validation
    if (quantity === undefined && avgPurchasePrice === undefined && notes === undefined) {
      throw new AppError(400, 'VALIDATION_ERROR', 'At least one field must be provided');
    }

    if (quantity !== undefined && (typeof quantity !== 'number' || quantity <= 0)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Quantity must be greater than 0');
    }

    if (avgPurchasePrice !== undefined && (typeof avgPurchasePrice !== 'number' || avgPurchasePrice <= 0)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Average purchase price must be greater than 0');
    }

    if (notes && notes.length > 500) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Notes must be 500 characters or less');
    }

    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = new Decimal(quantity) as any;
    if (avgPurchasePrice !== undefined) updateData.avgPurchasePrice = new Decimal(avgPurchasePrice) as any;
    if (notes !== undefined) updateData.notes = notes;

    const holding = await prisma.holding.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(holding);
  } catch (error) {
    next(error);
  }
});

// DELETE /holdings/:id - Remove holding
router.delete('/holdings/:id', authenticate, verifyHoldingOwnership, async (req: AuthRequest, res, next) => {
  try {
    await prisma.holding.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
