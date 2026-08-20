import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { verifyHoldingOwnership } from './middleware/ownership';
import authRoutes from './routes/auth';
import portfolioRoutes from './routes/portfolios';
import holdingsRoutes from './routes/holdings';

const app = express();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({ origin: env.ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());
app.use(apiLimiter); // Apply general rate limit to all routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authLimiter, authRoutes); // Apply stricter rate limit to auth routes
app.use('/portfolios', portfolioRoutes);
app.use('/', holdingsRoutes); // Register holdings routes (includes /portfolios and /holdings paths)

// Temporary test route for holding ownership middleware (used by ownership.test.ts)
app.get('/holdings/:id', authenticate, verifyHoldingOwnership, (req, res) => {
  res.json({ message: 'OK' });
});

// Error handler (must be last)
app.use(errorHandler);

// Export app for testing
export { app };

// Start server only if this file is run directly
if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${env.PORT}`);
    console.log(`📊 Environment: ${env.NODE_ENV}`);
  });
}
