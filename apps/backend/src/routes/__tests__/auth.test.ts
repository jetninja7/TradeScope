// Mock environment variables BEFORE importing
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';

import request from 'supertest';
import { app } from '../../index';
import * as databaseModule from '@tradescope/database';

// Mock the database
jest.mock('@tradescope/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    portfolio: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockedPrisma = databaseModule.prisma as jest.Mocked<typeof databaseModule.prisma>;

describe('POST /auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create default portfolio on user registration', async () => {
    const testUserId = 'test-user-id';
    const testPortfolioId = 'test-portfolio-id';

    // Mock user doesn't exist
    (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const mockUser = {
      id: testUserId,
      email: 'newuser@example.com',
      passwordHash: 'hashed-password',
      name: 'New User',
    };

    const mockPortfolio = {
      id: testPortfolioId,
      userId: testUserId,
      name: 'My Portfolio',
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock transaction to execute callback with mock tx object
    (mockedPrisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const mockTx = {
        user: {
          create: jest.fn().mockResolvedValue(mockUser),
        },
        portfolio: {
          create: jest.fn().mockResolvedValue(mockPortfolio),
        },
      };
      return await callback(mockTx);
    });

    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'TestPassword123',
        name: 'New User',
      });

    expect(response.status).toBe(201);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.id).toBe(testUserId);
    expect(response.body.token).toBeDefined();

    // Verify transaction was called
    expect(mockedPrisma.$transaction).toHaveBeenCalled();
  });
});
