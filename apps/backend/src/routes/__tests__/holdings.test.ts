// Mock environment variables BEFORE importing
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';

import request from 'supertest';
import { app } from '../../index';
import * as databaseModule from '@tradescope/database';
import { generateToken } from '../../utils/jwt';

// Mock the database
jest.mock('@tradescope/database', () => ({
  prisma: {
    holding: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    portfolio: {
      findUnique: jest.fn(),
    },
  },
  AssetType: {
    CRYPTO: 'CRYPTO',
    STOCK: 'STOCK',
  },
}));

const mockedPrisma = databaseModule.prisma as jest.Mocked<typeof databaseModule.prisma>;

describe('Holdings Routes', () => {
  let authToken: string;
  let userId: string;
  let portfolioId: string;
  let holdingId: string;
  let otherUserToken: string;
  let otherUserId: string;

  beforeAll(() => {
    userId = 'test-user-id';
    portfolioId = 'test-portfolio-id';
    holdingId = 'test-holding-id';
    otherUserId = 'other-user-id';
    authToken = generateToken({ userId, email: 'holdings@example.com' });
    otherUserToken = generateToken({ userId: otherUserId, email: 'other2@example.com' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /portfolios/:portfolioId/holdings', () => {
    it('should create holding with valid data', async () => {
      // Mock portfolio ownership verification
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({
        id: portfolioId,
        userId: userId,
      });

      // Mock holding creation
      (mockedPrisma.holding.create as jest.Mock).mockResolvedValue({
        id: holdingId,
        portfolioId,
        symbol: 'BTC',
        assetType: 'CRYPTO',
        quantity: 0.5,
        avgPurchasePrice: 45000.00,
        notes: 'Long-term hold',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post(`/portfolios/${portfolioId}/holdings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'btc',
          assetType: 'CRYPTO',
          quantity: 0.5,
          avgPurchasePrice: 45000.00,
          notes: 'Long-term hold'
        });

      expect(response.status).toBe(201);
      expect(response.body.symbol).toBe('BTC');
      expect(response.body.assetType).toBe('CRYPTO');
      expect(response.body.quantity).toBe(0.5);
      expect(response.body.avgPurchasePrice).toBe(45000.00);
      expect(response.body.notes).toBe('Long-term hold');
      expect(mockedPrisma.holding.create).toHaveBeenCalled();
    });

    it('should auto-uppercase symbol', async () => {
      // Mock portfolio ownership verification
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({
        id: portfolioId,
        userId: userId,
      });

      // Mock holding creation
      (mockedPrisma.holding.create as jest.Mock).mockResolvedValue({
        id: 'eth-holding-id',
        portfolioId,
        symbol: 'ETH',
        assetType: 'CRYPTO',
        quantity: 1.0,
        avgPurchasePrice: 3000.00,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .post(`/portfolios/${portfolioId}/holdings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'eth',
          assetType: 'CRYPTO',
          quantity: 1.0,
          avgPurchasePrice: 3000.00
        });

      expect(response.status).toBe(201);
      expect(response.body.symbol).toBe('ETH');
    });

    it('should return 400 for missing required fields', async () => {
      // Mock portfolio ownership verification
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({
        id: portfolioId,
        userId: userId,
      });

      const response = await request(app)
        .post(`/portfolios/${portfolioId}/holdings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'BTC'
          // Missing other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for quantity <= 0', async () => {
      // Mock portfolio ownership verification
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({
        id: portfolioId,
        userId: userId,
      });

      const response = await request(app)
        .post(`/portfolios/${portfolioId}/holdings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'BTC',
          assetType: 'CRYPTO',
          quantity: -1,
          avgPurchasePrice: 45000.00
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for avgPurchasePrice <= 0', async () => {
      // Mock portfolio ownership verification
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({
        id: portfolioId,
        userId: userId,
      });

      const response = await request(app)
        .post(`/portfolios/${portfolioId}/holdings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'BTC',
          assetType: 'CRYPTO',
          quantity: 1.0,
          avgPurchasePrice: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for notes exceeding 500 characters', async () => {
      // Mock portfolio ownership verification
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({
        id: portfolioId,
        userId: userId,
      });

      const longNotes = 'a'.repeat(501); // 501 characters

      const response = await request(app)
        .post(`/portfolios/${portfolioId}/holdings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'BTC',
          assetType: 'CRYPTO',
          quantity: 1.0,
          avgPurchasePrice: 45000.00,
          notes: longNotes
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('500 characters');
    });

    it('should return 400 for invalid assetType', async () => {
      // Mock portfolio ownership verification
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({
        id: portfolioId,
        userId: userId,
      });

      const response = await request(app)
        .post(`/portfolios/${portfolioId}/holdings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'BTC',
          assetType: 'INVALID',
          quantity: 1.0,
          avgPurchasePrice: 45000.00
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('CRYPTO or STOCK');
    });

    it('should return 403 for another user\'s portfolio', async () => {
      // Mock portfolio owned by different user
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({
        id: portfolioId,
        userId: userId,
      });

      const response = await request(app)
        .post(`/portfolios/${portfolioId}/holdings`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          symbol: 'BTC',
          assetType: 'CRYPTO',
          quantity: 1.0,
          avgPurchasePrice: 45000.00
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('PATCH /holdings/:id', () => {
    it('should update holding quantity', async () => {
      // Mock holding ownership verification
      (mockedPrisma.holding.findUnique as jest.Mock).mockResolvedValue({
        id: holdingId,
        portfolio: {
          userId: userId,
        },
      });

      // Mock holding update
      (mockedPrisma.holding.update as jest.Mock).mockResolvedValue({
        id: holdingId,
        portfolioId,
        symbol: 'BTC',
        assetType: 'CRYPTO',
        quantity: 2.0,
        avgPurchasePrice: 45000.00,
        notes: 'Original',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .patch(`/holdings/${holdingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 2.0 });

      expect(response.status).toBe(200);
      expect(response.body.quantity).toBe(2.0);
      expect(mockedPrisma.holding.update).toHaveBeenCalled();
    });

    it('should update holding avgPurchasePrice', async () => {
      // Mock holding ownership verification
      (mockedPrisma.holding.findUnique as jest.Mock).mockResolvedValue({
        id: holdingId,
        portfolio: {
          userId: userId,
        },
      });

      // Mock holding update
      (mockedPrisma.holding.update as jest.Mock).mockResolvedValue({
        id: holdingId,
        portfolioId,
        symbol: 'BTC',
        assetType: 'CRYPTO',
        quantity: 1.0,
        avgPurchasePrice: 50000.00,
        notes: 'Original',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .patch(`/holdings/${holdingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ avgPurchasePrice: 50000.00 });

      expect(response.status).toBe(200);
      expect(response.body.avgPurchasePrice).toBe(50000.00);
    });

    it('should update holding notes', async () => {
      // Mock holding ownership verification
      (mockedPrisma.holding.findUnique as jest.Mock).mockResolvedValue({
        id: holdingId,
        portfolio: {
          userId: userId,
        },
      });

      // Mock holding update
      (mockedPrisma.holding.update as jest.Mock).mockResolvedValue({
        id: holdingId,
        portfolioId,
        symbol: 'BTC',
        assetType: 'CRYPTO',
        quantity: 1.0,
        avgPurchasePrice: 45000.00,
        notes: 'Updated note',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .patch(`/holdings/${holdingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Updated note' });

      expect(response.status).toBe(200);
      expect(response.body.notes).toBe('Updated note');
    });

    it('should return 400 if no fields provided', async () => {
      // Mock holding ownership verification
      (mockedPrisma.holding.findUnique as jest.Mock).mockResolvedValue({
        id: holdingId,
        portfolio: {
          userId: userId,
        },
      });

      const response = await request(app)
        .patch(`/holdings/${holdingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 403 for another user\'s holding', async () => {
      // Mock holding owned by different user
      (mockedPrisma.holding.findUnique as jest.Mock).mockResolvedValue({
        id: holdingId,
        portfolio: {
          userId: userId,
        },
      });

      const response = await request(app)
        .patch(`/holdings/${holdingId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ quantity: 999 });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 for non-existent holding', async () => {
      // Mock holding not found
      (mockedPrisma.holding.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .patch('/holdings/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 1 });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /holdings/:id', () => {
    it('should delete holding', async () => {
      // Mock holding ownership verification
      (mockedPrisma.holding.findUnique as jest.Mock).mockResolvedValue({
        id: holdingId,
        portfolio: {
          userId: userId,
        },
      });

      // Mock holding deletion
      (mockedPrisma.holding.delete as jest.Mock).mockResolvedValue({
        id: holdingId,
      });

      const response = await request(app)
        .delete(`/holdings/${holdingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
      expect(mockedPrisma.holding.delete).toHaveBeenCalledWith({
        where: { id: holdingId }
      });
    });

    it('should return 403 for another user\'s holding', async () => {
      // Mock holding owned by different user
      (mockedPrisma.holding.findUnique as jest.Mock).mockResolvedValue({
        id: holdingId,
        portfolio: {
          userId: userId,
        },
      });

      const response = await request(app)
        .delete(`/holdings/${holdingId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});
