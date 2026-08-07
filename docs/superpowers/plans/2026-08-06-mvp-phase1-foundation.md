# TradeScope MVP Phase 1 - Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the monorepo structure, database schema, and basic authentication system for TradeScope.

**Architecture:** Turborepo monorepo with separate backend (Express + TypeScript) and frontend (Next.js 14) apps, shared types package, and Prisma database package. Docker Compose for local PostgreSQL and Redis.

**Tech Stack:**
- **Monorepo:** Turborepo
- **Backend:** Node.js 20+, Express, TypeScript, Prisma, PostgreSQL
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Infrastructure:** Docker Compose (PostgreSQL 16, Redis 7)

## Global Constraints

- Node.js version: 20.x minimum
- TypeScript strict mode enabled
- All passwords hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 7 days
- API returns JSON with consistent error format: `{error: {message: string, code: string}}`
- All timestamps in ISO 8601 format
- Database uses Prisma ORM exclusively (no raw SQL)
- Environment variables required for all secrets
- CORS restricted to frontend origin only
- Rate limiting: 5 req/min for auth endpoints, 100 req/min for API

---

## Task 1: Monorepo Setup & Project Structure

**Files:**
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `apps/backend/package.json`
- Create: `apps/web/package.json`
- Create: `packages/shared-types/package.json`
- Create: `packages/database/package.json`
- Create: `docker-compose.yml`

**Interfaces:**
- Consumes: None (initial setup)
- Produces: Working monorepo with package manager configured, Turborepo build/dev scripts

---

- [ ] **Step 1: Initialize root package.json**

```bash
cd /Users/balu/Desktop/TradeScope
npm init -y
```

- [ ] **Step 2: Install Turborepo**

```bash
npm install turbo --save-dev
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    }
  }
}
```

- [ ] **Step 4: Update root package.json with workspaces and scripts**

```json
{
  "name": "tradescope",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

- [ ] **Step 5: Create .gitignore**

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Build outputs
.next/
out/
build/
dist/

# Misc
.DS_Store
*.pem

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Env files
.env
.env*.local
.env.production

# Vercel
.vercel

# Turborepo
.turbo

# Prisma
*.db
*.db-journal

# IDEs
.vscode/
.idea/
*.swp
*.swo
```

- [ ] **Step 6: Create directory structure**

```bash
mkdir -p apps/backend/src
mkdir -p apps/web/src
mkdir -p packages/shared-types/src
mkdir -p packages/database/prisma
```

- [ ] **Step 7: Create .env.example**

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tradescope

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-256-bit-key-change-in-production
JWT_EXPIRES_IN=7d

# Market Data APIs
COINGECKO_API_KEY=not-required-for-free-tier

# AI Providers (get keys from respective providers)
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# Server Config
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000/ws
```

- [ ] **Step 8: Create docker-compose.yml**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: tradescope-postgres
    environment:
      POSTGRES_DB: tradescope
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d tradescope"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: tradescope-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 9: Initialize packages/shared-types**

```bash
cd packages/shared-types
npm init -y
```

Create `packages/shared-types/package.json`:
```json
{
  "name": "@tradescope/shared-types",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Step 10: Initialize packages/database**

```bash
cd packages/database
npm init -y
npm install prisma @prisma/client
npm install -D typescript
```

Create `packages/database/package.json`:
```json
{
  "name": "@tradescope/database",
  "version": "1.0.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.8.0"
  },
  "devDependencies": {
    "prisma": "^5.8.0",
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Step 11: Initialize apps/backend**

```bash
cd apps/backend
npm init -y
npm install express cors dotenv bcrypt jsonwebtoken ws
npm install -D typescript @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken @types/ws ts-node-dev
```

Create `apps/backend/package.json`:
```json
{
  "name": "@tradescope/backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@tradescope/database": "*",
    "@tradescope/shared-types": "*",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "ws": "^8.16.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.0",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/ws": "^8.5.10",
    "typescript": "^5.3.0",
    "ts-node-dev": "^2.0.0"
  }
}
```

- [ ] **Step 12: Initialize apps/web**

```bash
cd apps/web
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
npm install zustand axios zod react-hook-form @hookform/resolvers
```

This creates Next.js app with App Router, TypeScript, and Tailwind CSS configured.

- [ ] **Step 13: Install root dependencies**

```bash
cd /Users/balu/Desktop/TradeScope
npm install
```

- [ ] **Step 14: Start Docker services**

```bash
docker-compose up -d
```

Expected: PostgreSQL and Redis containers running and healthy

- [ ] **Step 15: Verify setup**

```bash
# Check Docker services
docker-compose ps

# Expected output:
# tradescope-postgres running (healthy)
# tradescope-redis running (healthy)
```

- [ ] **Step 16: Create tsconfig.json files**

Create `apps/backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Create `packages/shared-types/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

Create `packages/database/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  },
  "include": ["**/*"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 17: Copy .env.example to .env**

```bash
cp .env.example .env
```

- [ ] **Step 18: Commit monorepo setup**

```bash
git add .
git commit -m "feat: initialize monorepo structure with Turborepo

- Set up workspaces for apps and packages
- Add Docker Compose for PostgreSQL and Redis
- Configure TypeScript for all packages
- Add environment variable template
- Initialize backend (Express), web (Next.js), shared-types, database packages"
```

---

## Task 2: Database Schema & Prisma Setup

**Files:**
- Create: `packages/database/prisma/schema.prisma`
- Create: `packages/database/index.ts`
- Generate: Prisma Client types

**Interfaces:**
- Consumes: DATABASE_URL environment variable, PostgreSQL running on localhost:5432
- Produces: Prisma Client instance exported from `@tradescope/database`, database tables created

---

- [ ] **Step 1: Create Prisma schema file**

Create `packages/database/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Users & Authentication
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  passwordHash  String
  name          String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  portfolios    Portfolio[]
  watchlist     Watchlist[]
  alerts        Alert[]
  insights      AIInsight[]
  notifications Notification[]
}

// Portfolio Management
model Portfolio {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  description String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  holdings    Holding[]
  alerts      Alert[]
  insights    AIInsight[]

  @@index([userId])
}

model Holding {
  id               String    @id @default(cuid())
  portfolioId      String
  portfolio        Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  symbol           String
  assetType        AssetType
  quantity         Float
  avgPurchasePrice Float
  notes            String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([portfolioId])
  @@index([symbol])
}

enum AssetType {
  STOCK
  CRYPTO
}

model Watchlist {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  symbol    String
  assetType AssetType
  createdAt DateTime  @default(now())

  @@unique([userId, symbol])
  @@index([userId])
}

// Market Data
model Asset {
  id             String          @id @default(cuid())
  symbol         String          @unique
  name           String
  assetType      AssetType
  exchange       String?
  logoUrl        String?
  description    String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  priceSnapshots PriceSnapshot[]
  priceHistory   PriceHistory[]

  @@index([symbol])
  @@index([assetType])
}

model PriceSnapshot {
  id        String   @id @default(cuid())
  assetId   String
  asset     Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  price     Float
  volume    Float?
  marketCap Float?
  source    String
  timestamp DateTime @default(now())

  @@index([assetId, timestamp])
}

model PriceHistory {
  id        String   @id @default(cuid())
  assetId   String
  asset     Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  interval  String
  open      Float
  high      Float
  low       Float
  close     Float
  volume    Float?
  timestamp DateTime

  @@unique([assetId, interval, timestamp])
  @@index([assetId, interval, timestamp])
}

// Alerts & Insights
model Alert {
  id            String         @id @default(cuid())
  userId        String
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  portfolioId   String?
  portfolio     Portfolio?     @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  name          String
  condition     Json
  isActive      Boolean        @default(true)
  lastTriggered DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  triggers      AlertTrigger[]

  @@index([userId])
  @@index([portfolioId])
  @@index([isActive])
}

model AlertTrigger {
  id             String   @id @default(cuid())
  alertId        String
  alert          Alert    @relation(fields: [alertId], references: [id], onDelete: Cascade)
  triggeredAt    DateTime @default(now())
  priceAtTrigger Float?
  metadata       Json?
  notificationId String?

  @@index([alertId])
}

model AIInsight {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  portfolioId String?
  portfolio   Portfolio?  @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  insightType InsightType
  title       String
  content     String      @db.Text
  metadata    Json?
  createdAt   DateTime    @default(now())

  @@index([userId])
  @@index([portfolioId])
  @@index([createdAt])
}

enum InsightType {
  DAILY_SUMMARY
  EVENT_DRIVEN
  ON_DEMAND
}

// Notifications
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String
  title     String
  message   String   @db.Text
  isRead    Boolean  @default(false)
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([userId, isRead])
}
```

- [ ] **Step 2: Create database index file**

Create `packages/database/index.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';
```

- [ ] **Step 3: Generate Prisma Client**

```bash
cd packages/database
npx prisma generate
```

Expected: Prisma Client generated in node_modules/@prisma/client

- [ ] **Step 4: Push schema to database**

```bash
cd packages/database
npx prisma db push
```

Expected: All tables created in PostgreSQL database

- [ ] **Step 5: Verify database schema**

```bash
cd packages/database
npx prisma studio
```

Expected: Prisma Studio opens in browser showing all tables (User, Portfolio, Holding, etc.)

- [ ] **Step 6: Add database URL to .env (if not already present)**

Verify `.env` contains:
```
DATABASE_URL=postgresql://user:password@localhost:5432/tradescope
```

- [ ] **Step 7: Test Prisma Client import**

Create temporary test file `packages/database/test-connection.ts`:
```typescript
import { prisma } from './index';

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    const userCount = await prisma.user.count();
    console.log(`📊 User count: ${userCount}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
```

Run test:
```bash
cd packages/database
npx ts-node test-connection.ts
```

Expected output:
```
✅ Database connected successfully
📊 User count: 0
```

- [ ] **Step 8: Remove test file**

```bash
rm packages/database/test-connection.ts
```

- [ ] **Step 9: Commit database schema**

```bash
git add packages/database/
git commit -m "feat: add Prisma schema with all MVP models

- Add User, Portfolio, Holding, Watchlist models
- Add Asset, PriceSnapshot, PriceHistory for market data
- Add Alert, AlertTrigger, AIInsight for alerting and insights
- Add Notification model for in-app notifications
- Configure Prisma Client with proper logging
- Add indexes on frequently queried fields"
```

---

## Task 3: Shared TypeScript Types

**Files:**
- Create: `packages/shared-types/src/index.ts`
- Create: `packages/shared-types/src/auth.ts`
- Create: `packages/shared-types/src/portfolio.ts`
- Create: `packages/shared-types/src/market.ts`
- Create: `packages/shared-types/src/alert.ts`
- Create: `packages/shared-types/src/websocket.ts`

**Interfaces:**
- Consumes: Prisma types from `@tradescope/database`
- Produces: Shared TypeScript types and interfaces used across backend and frontend

---

- [ ] **Step 1: Create auth types**

Create `packages/shared-types/src/auth.ts`:

```typescript
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
```

- [ ] **Step 2: Create portfolio types**

Create `packages/shared-types/src/portfolio.ts`:

```typescript
import { AssetType } from '@tradescope/database';

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
}

export interface PortfolioResponse {
  id: string;
  name: string;
  description: string | null;
  totalValue: number;
  change24h: number;
  changePercent24h: number;
  holdings: HoldingWithPrice[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateHoldingRequest {
  symbol: string;
  assetType: AssetType;
  quantity: number;
  avgPurchasePrice: number;
  notes?: string;
}

export interface UpdateHoldingRequest {
  quantity?: number;
  avgPurchasePrice?: number;
  notes?: string;
}

export interface HoldingWithPrice {
  id: string;
  symbol: string;
  assetType: AssetType;
  quantity: number;
  avgPurchasePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  assetType: AssetType;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  createdAt: string;
}
```

- [ ] **Step 3: Create market data types**

Create `packages/shared-types/src/market.ts`:

```typescript
import { AssetType } from '@tradescope/database';

export interface AssetSearchResult {
  symbol: string;
  name: string;
  assetType: AssetType;
  exchange: string | null;
  logoUrl: string | null;
}

export interface AssetPriceResponse {
  symbol: string;
  price: number;
  volume: number | null;
  marketCap: number | null;
  change24h: number;
  changePercent24h: number;
  lastUpdated: string;
}

export interface PriceHistoryPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface PriceHistoryRequest {
  symbol: string;
  interval: '1min' | '5min' | '1hour' | '1day';
  range: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
}

export interface PriceHistoryResponse {
  symbol: string;
  interval: string;
  data: PriceHistoryPoint[];
}
```

- [ ] **Step 4: Create alert types**

Create `packages/shared-types/src/alert.ts`:

```typescript
export type AlertConditionType = 
  | 'price_target' 
  | 'percent_change' 
  | 'portfolio_value' 
  | 'volume_spike' 
  | 'volatility';

export interface PriceTargetCondition {
  type: 'price_target';
  symbol: string;
  target: number;
  direction: 'above' | 'below';
}

export interface PercentChangeCondition {
  type: 'percent_change';
  symbol: string;
  threshold: number;
  direction: 'up' | 'down' | 'either';
  timeframe: '1h' | '24h' | '7d';
}

export interface PortfolioValueCondition {
  type: 'portfolio_value';
  portfolioId: string;
  threshold: number;
  direction: 'above' | 'below';
}

export interface VolumeSpikeCondition {
  type: 'volume_spike';
  symbol: string;
  multiplier: number;
}

export interface VolatilityCondition {
  type: 'volatility';
  symbol: string;
  threshold: number;
  timeframe: '1h' | '24h';
}

export type AlertCondition = 
  | PriceTargetCondition 
  | PercentChangeCondition 
  | PortfolioValueCondition 
  | VolumeSpikeCondition 
  | VolatilityCondition;

export interface CreateAlertRequest {
  name: string;
  condition: AlertCondition;
  portfolioId?: string;
}

export interface UpdateAlertRequest {
  name?: string;
  condition?: AlertCondition;
  isActive?: boolean;
}

export interface AlertResponse {
  id: string;
  name: string;
  condition: AlertCondition;
  isActive: boolean;
  lastTriggered: string | null;
  portfolioId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertTriggerResponse {
  id: string;
  alertId: string;
  triggeredAt: string;
  priceAtTrigger: number | null;
  metadata: any;
}
```

- [ ] **Step 5: Create WebSocket types**

Create `packages/shared-types/src/websocket.ts`:

```typescript
export type WebSocketClientMessage =
  | { type: 'subscribe:portfolio'; portfolioId: string }
  | { type: 'subscribe:asset'; symbol: string }
  | { type: 'unsubscribe:portfolio'; portfolioId: string }
  | { type: 'unsubscribe:asset'; symbol: string }
  | { type: 'ping' };

export type WebSocketServerMessage =
  | {
      type: 'price:update';
      symbol: string;
      price: number;
      change: number;
      changePercent: number;
      timestamp: string;
    }
  | {
      type: 'portfolio:value';
      portfolioId: string;
      totalValue: number;
      change24h: number;
      changePercent24h: number;
    }
  | {
      type: 'alert:triggered';
      alertId: string;
      alertName: string;
      message: string;
      priceAtTrigger: number;
      timestamp: string;
    }
  | {
      type: 'insight:ready';
      insightId: string;
      portfolioId: string;
      title: string;
      insightType: string;
    }
  | { type: 'pong' }
  | {
      type: 'error';
      message: string;
      code?: string;
    };
```

- [ ] **Step 6: Create main index file**

Create `packages/shared-types/src/index.ts`:

```typescript
export * from './auth';
export * from './portfolio';
export * from './market';
export * from './alert';
export * from './websocket';

// Re-export commonly used Prisma enums
export { AssetType, InsightType } from '@tradescope/database';

// Error response type
export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
  };
}

// Pagination types
export interface PaginatedRequest {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

- [ ] **Step 7: Run type-check**

```bash
cd packages/shared-types
npm run type-check
```

Expected: No TypeScript errors

- [ ] **Step 8: Commit shared types**

```bash
git add packages/shared-types/
git commit -m "feat: add shared TypeScript types for API contracts

- Add auth types (register, login, JWT payload)
- Add portfolio and holding types with price calculations
- Add market data types (assets, price history)
- Add alert types with all condition variants
- Add WebSocket message types (client and server)
- Add pagination and error response types"
```

---

## Task 4: Backend Authentication System

**Files:**
- Create: `apps/backend/src/index.ts`
- Create: `apps/backend/src/config/env.ts`
- Create: `apps/backend/src/middleware/auth.ts`
- Create: `apps/backend/src/middleware/errorHandler.ts`
- Create: `apps/backend/src/routes/auth.ts`
- Create: `apps/backend/src/utils/jwt.ts`
- Create: `apps/backend/src/utils/password.ts`

**Interfaces:**
- Consumes: Prisma Client from `@tradescope/database`, shared types from `@tradescope/shared-types`
- Produces: Express server listening on port 4000, auth endpoints (`POST /auth/register`, `POST /auth/login`, `GET /auth/me`)

---

- [ ] **Step 1: Write failing test for password hashing**

Create `apps/backend/src/utils/__tests__/password.test.ts`:

```typescript
import { hashPassword, comparePassword } from '../password';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isMatch = await comparePassword('WrongPassword', hash);
      expect(isMatch).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

First install Jest:
```bash
cd apps/backend
npm install -D jest @types/jest ts-jest
```

Create `apps/backend/jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**'
  ]
};
```

Add test script to `apps/backend/package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

Run test:
```bash
npm test
```

Expected: Test fails with "Cannot find module '../password'"

- [ ] **Step 3: Implement password utilities**

Create `apps/backend/src/utils/password.ts`:

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/backend
npm test
```

Expected: All password tests pass

- [ ] **Step 5: Write failing test for JWT utilities**

Create `apps/backend/src/utils/__tests__/jwt.test.ts`:

```typescript
import { generateToken, verifyToken } from '../jwt';

// Mock environment variable
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';

describe('JWT Utils', () => {
  const mockPayload = {
    userId: 'user123',
    email: 'test@example.com'
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid.token.here');
      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      // This test would require mocking time or using a library
      // For now, we'll test with an obviously malformed token
      const decoded = verifyToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid');
      expect(decoded).toBeNull();
    });
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
cd apps/backend
npm test
```

Expected: Test fails with "Cannot find module '../jwt'"

- [ ] **Step 7: Implement JWT utilities**

Create `apps/backend/src/utils/jwt.ts`:

```typescript
import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@tradescope/shared-types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

```bash
cd apps/backend
npm test
```

Expected: All JWT tests pass

- [ ] **Step 9: Create environment config**

Create `apps/backend/src/config/env.ts`:

```typescript
import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
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
```

- [ ] **Step 10: Create error handler middleware**

Create `apps/backend/src/middleware/errorHandler.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express';
import type { ErrorResponse } from '@tradescope/shared-types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    const errorResponse: ErrorResponse = {
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    };
    return res.status(err.statusCode).json(errorResponse);
  }

  // Unhandled errors
  console.error('Unhandled error:', err);
  const errorResponse: ErrorResponse = {
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  };
  res.status(500).json(errorResponse);
}
```

- [ ] **Step 11: Create auth middleware**

Create `apps/backend/src/middleware/auth.ts`:

```typescript
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyToken(token);

  if (!decoded) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }

  req.userId = decoded.userId;
  req.userEmail = decoded.email;
  next();
}
```

- [ ] **Step 12: Create auth routes**

Create `apps/backend/src/routes/auth.ts`:

```typescript
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

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body as RegisterRequest;

    // Validate input
    if (!email || !password) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Email and password are required');
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
```

- [ ] **Step 13: Create main Express server**

Create `apps/backend/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';

const app = express();

// Middleware
app.use(cors({ origin: env.ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${env.PORT}`);
  console.log(`📊 Environment: ${env.NODE_ENV}`);
});
```

- [ ] **Step 14: Update backend package.json with test script**

Ensure `apps/backend/package.json` has test dependencies and scripts:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0"
  }
}
```

- [ ] **Step 15: Run all backend tests**

```bash
cd apps/backend
npm test
```

Expected: All tests pass (password and JWT tests)

- [ ] **Step 16: Start backend server**

```bash
cd apps/backend
npm run dev
```

Expected: Server starts on http://localhost:4000

- [ ] **Step 17: Test health endpoint**

In a new terminal:
```bash
curl http://localhost:4000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-08-06T..."}
```

- [ ] **Step 18: Test register endpoint**

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123","name":"Test User"}'
```

Expected: 201 status with token and user object

- [ ] **Step 19: Test login endpoint**

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123"}'
```

Expected: 200 status with token and user object

- [ ] **Step 20: Test /auth/me endpoint (extract token from previous response)**

```bash
TOKEN="<paste-token-from-login>"
curl http://localhost:4000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

Expected: 200 status with user details

- [ ] **Step 21: Commit authentication system**

```bash
git add apps/backend/
git commit -m "feat: implement backend authentication system

- Add password hashing utilities with bcrypt (10 salt rounds)
- Add JWT generation and verification utilities
- Add auth middleware for protected routes
- Add error handling middleware with AppError class
- Implement auth routes: register, login, /me
- Add unit tests for password and JWT utilities
- Configure Express server with CORS and JSON parsing
- Add health check endpoint"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-06-mvp-phase1-foundation.md`. 

This plan covers the foundation (Tasks 1-4):
1. ✅ Monorepo setup with Turborepo, Docker Compose
2. ✅ Database schema with Prisma
3. ✅ Shared TypeScript types
4. ✅ Backend authentication system

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
