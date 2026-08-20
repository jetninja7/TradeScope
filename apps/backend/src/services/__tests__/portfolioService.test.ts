import { PortfolioService } from '../portfolioService';
import { prisma } from '@tradescope/database';

describe('PortfolioService', () => {
  const service = new PortfolioService();
  let testUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'portfoliotest@example.com',
        passwordHash: 'hash',
        name: 'Portfolio Test User'
      }
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.portfolio.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('createDefaultPortfolio', () => {
    it('should create a portfolio with name "My Portfolio"', async () => {
      const portfolio = await service.createDefaultPortfolio(testUserId);

      expect(portfolio).toBeDefined();
      expect(portfolio.name).toBe('My Portfolio');
      expect(portfolio.userId).toBe(testUserId);
      expect(portfolio.description).toBeNull();
    });

    it('should create portfolio that persists in database', async () => {
      const portfolio = await service.createDefaultPortfolio(testUserId);

      const found = await prisma.portfolio.findUnique({
        where: { id: portfolio.id }
      });

      expect(found).toBeDefined();
      expect(found?.name).toBe('My Portfolio');
    });
  });

  describe('getDefaultPortfolio', () => {
    it('should return first portfolio for user', async () => {
      await service.createDefaultPortfolio(testUserId);

      const portfolio = await service.getDefaultPortfolio(testUserId);

      expect(portfolio).toBeDefined();
      expect(portfolio?.userId).toBe(testUserId);
    });

    it('should return null if user has no portfolios', async () => {
      const newUser = await prisma.user.create({
        data: {
          email: 'noportfolio@example.com',
          passwordHash: 'hash',
          name: 'No Portfolio User'
        }
      });

      const portfolio = await service.getDefaultPortfolio(newUser.id);

      expect(portfolio).toBeNull();

      await prisma.user.delete({ where: { id: newUser.id } });
    });
  });
});
