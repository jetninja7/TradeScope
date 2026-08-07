import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Try to find .env file in monorepo root
let envPath = resolve(process.cwd(), '.env');
if (!existsSync(envPath)) {
  // If not found in cwd, try 2 levels up (from apps/backend)
  envPath = resolve(process.cwd(), '../../.env');
}

config({ path: envPath });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL || '',
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
};

// Validate required env vars
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
