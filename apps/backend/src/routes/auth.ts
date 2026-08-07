import express from 'express';
import { prisma } from '@tradescope/database';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
} from '@tradescope/shared-types';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { authenticate, type AuthRequest } from '../middleware/auth';

const router = express.Router();

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body as RegisterRequest;

    // Validate input
    if (!email || !password) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Email and password are required');
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid email format');
    }

    if (password.length < 8) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Password must be at least 8 characters');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError(409, 'USER_EXISTS', 'User with this email already exists');
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Validate input
    if (!email || !password) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Email and password are required');
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid email format');
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
