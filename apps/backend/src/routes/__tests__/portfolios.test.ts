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
    portfolio: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockedPrisma = databaseModule.prisma as jest.Mocked<typeof databaseModule.prisma>;

describe('Portfolio Routes', () => {
  let authToken: string;
  let userId: string;
  let portfolioId: string;
  let otherUserToken: string;
  let otherUserId: string;

  beforeAll(() => {
    userId = 'test-user-id';
    portfolioId = 'test-portfolio-id';
    otherUserId = 'other-user-id';
    authToken = generateToken({ userId, email: 'portfolio@example.com' });
    otherUserToken = generateToken({ userId: otherUserId, email: 'other@example.com' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /portfolios', () => {
    it('should return user\'s portfolios', async () => {
      const mockPortfolios = [
        {
          id: portfolioId,
          name: 'Test Portfolio',
          description: 'Test description',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockedPrisma.portfolio.findMany as jest.Mock).mockResolvedValue(mockPortfolios);

      const response = await request(app)
        .get('/portfolios')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(mockedPrisma.portfolio.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/portfolios');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /portfolios/:id', () => {
    it('should return portfolio with holdings', async () => {
      const mockPortfolio = {
        id: portfolioId,
        userId,
        name: 'Test Portfolio',
        description: 'Test description',
        createdAt: new Date(),
        updatedAt: new Date(),
        holdings: [],
      };

      // Mock ownership check
      (mockedPrisma.portfolio.findUnique as jest.Mock)
        .mockResolvedValueOnce({ userId }) // First call for ownership check
        .mockResolvedValueOnce(mockPortfolio); // Second call for actual data

      const response = await request(app)
        .get(`/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(portfolioId);
      expect(response.body.name).toBe('Test Portfolio');
      expect(response.body.holdings).toBeDefined();
      expect(Array.isArray(response.body.holdings)).toBe(true);
    });

    it('should return 403 for another user\'s portfolio', async () => {
      // Mock ownership check - different user
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({ userId });

      const response = await request(app)
        .get(`/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent portfolio', async () => {
      // Mock portfolio not found
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/portfolios/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /portfolios/:id', () => {
    it('should update portfolio name', async () => {
      const updatedPortfolio = {
        id: portfolioId,
        name: 'Updated Portfolio',
        description: 'Test description',
        updatedAt: new Date(),
      };

      // Mock ownership check
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({ userId });
      (mockedPrisma.portfolio.update as jest.Mock).mockResolvedValue(updatedPortfolio);

      const response = await request(app)
        .patch(`/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Portfolio' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Portfolio');
      expect(mockedPrisma.portfolio.update).toHaveBeenCalledWith({
        where: { id: portfolioId },
        data: { name: 'Updated Portfolio' },
        select: {
          id: true,
          name: true,
          description: true,
          updatedAt: true,
        },
      });
    });

    it('should update portfolio description', async () => {
      const updatedPortfolio = {
        id: portfolioId,
        name: 'Test Portfolio',
        description: 'New description',
        updatedAt: new Date(),
      };

      // Mock ownership check
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({ userId });
      (mockedPrisma.portfolio.update as jest.Mock).mockResolvedValue(updatedPortfolio);

      const response = await request(app)
        .patch(`/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'New description' });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('New description');
    });

    it('should return 400 if no fields provided', async () => {
      // Mock ownership check
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({ userId });

      const response = await request(app)
        .patch(`/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 403 for another user\'s portfolio', async () => {
      // Mock ownership check - different user
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({ userId });

      const response = await request(app)
        .patch(`/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ name: 'Hacked' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /portfolios/:id', () => {
    it('should delete portfolio', async () => {
      // Mock ownership check
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({ userId });
      (mockedPrisma.portfolio.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete(`/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
      expect(mockedPrisma.portfolio.delete).toHaveBeenCalledWith({
        where: { id: portfolioId },
      });
    });

    it('should return 403 for another user\'s portfolio', async () => {
      // Mock ownership check - different user
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({ userId });

      const response = await request(app)
        .delete(`/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });
  });
});
