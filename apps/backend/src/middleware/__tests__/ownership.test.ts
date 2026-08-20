// Mock environment variables BEFORE importing
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';

import request from 'supertest';
import { app } from '../../index';
import * as prismaModule from '@tradescope/database';
import { generateToken } from '../../utils/jwt';

// Mock prisma client
jest.mock('@tradescope/database', () => ({
  prisma: {
    portfolio: {
      findUnique: jest.fn(),
    },
    holding: {
      findUnique: jest.fn(),
    },
  },
}));

const mockedPrisma = prismaModule.prisma as jest.Mocked<typeof prismaModule.prisma>;

describe('Ownership Middleware', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let user1PortfolioId: string;
  let user1HoldingId: string;

  beforeAll(() => {
    user1Id = 'user1-id';
    user2Id = 'user2-id';
    user1PortfolioId = 'portfolio1-id';
    user1HoldingId = 'holding1-id';
    user1Token = generateToken({ userId: user1Id, email: 'user1@test.com' });
    user2Token = generateToken({ userId: user2Id, email: 'user2@test.com' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyPortfolioOwnership', () => {
    it('should allow owner to access their portfolio', async () => {
      // Mock successful portfolio ownership check
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({
        userId: user1Id,
      });

      const response = await request(app)
        .get(`/portfolios/${user1PortfolioId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).not.toBe(403);
      expect(response.status).toBe(200);
      expect(mockedPrisma.portfolio.findUnique).toHaveBeenCalledWith({
        where: { id: user1PortfolioId },
        select: { userId: true }
      });
    });

    it('should return 403 when user tries to access another user\'s portfolio', async () => {
      // Mock portfolio owned by user1, but accessed by user2
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue({
        userId: user1Id,
      });

      const response = await request(app)
        .get(`/portfolios/${user1PortfolioId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toBe('Access denied');
    });

    it('should return 404 for non-existent portfolio', async () => {
      // Mock portfolio not found
      (mockedPrisma.portfolio.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/portfolios/nonexistent')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Portfolio not found');
    });
  });

  describe('verifyHoldingOwnership', () => {
    it('should allow owner to access their holding', async () => {
      // Mock successful holding ownership check with portfolio relation
      (mockedPrisma.holding.findUnique as jest.Mock).mockResolvedValue({
        portfolio: {
          userId: user1Id,
        },
      });

      const response = await request(app)
        .get(`/holdings/${user1HoldingId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).not.toBe(403);
      expect(response.status).toBe(200);
      expect(mockedPrisma.holding.findUnique).toHaveBeenCalledWith({
        where: { id: user1HoldingId },
        include: {
          portfolio: {
            select: { userId: true }
          }
        }
      });
    });

    it('should return 403 when user tries to access another user\'s holding', async () => {
      // Mock holding owned by user1's portfolio, accessed by user2
      (mockedPrisma.holding.findUnique as jest.Mock).mockResolvedValue({
        portfolio: {
          userId: user1Id,
        },
      });

      const response = await request(app)
        .get(`/holdings/${user1HoldingId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toBe('Access denied');
    });

    it('should return 404 for non-existent holding', async () => {
      // Mock holding not found
      (mockedPrisma.holding.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/holdings/nonexistent')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Holding not found');
    });
  });
});
