import { prisma } from '@tradescope/database';
import type { Portfolio } from '@tradescope/database';

export class PortfolioService {
  async createDefaultPortfolio(userId: string): Promise<Portfolio> {
    return prisma.portfolio.create({
      data: {
        userId,
        name: 'My Portfolio',
        description: null
      }
    });
  }

  async getDefaultPortfolio(userId: string): Promise<Portfolio | null> {
    return prisma.portfolio.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
  }
}
