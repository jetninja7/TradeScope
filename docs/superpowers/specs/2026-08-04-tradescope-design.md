# TradeScope - Real-Time Portfolio Monitoring Platform
**Design Specification**  
**Date:** 2026-08-04  
**Status:** Approved for Implementation

---

## Executive Summary

TradeScope is a multi-asset portfolio monitoring SaaS platform that combines real-time price tracking for stocks and cryptocurrencies with AI-powered market insights. Unlike purely analytical tools, TradeScope provides intelligent, event-driven analysis that explains market movements in plain English, helping users understand not just what happened, but why.

### Key Differentiators
- **Real market data** from free APIs (Alpha Vantage, CoinGecko, Binance)
- **Multi-asset support** - Track stocks and crypto in unified portfolios
- **AI-powered insights** - Event-driven natural language analysis of portfolio changes
- **Real-time updates** - WebSocket connections for live price feeds
- **Full-stack SaaS** - Complete authentication, user management, and personalized dashboards
- **Production-ready architecture** - Scalable monorepo structure with clean separation

### Target Audience
This project targets GitHub portfolio viewers including recruiters and hiring managers at fintech companies, trading platforms, and full-stack engineering roles requiring real-time systems expertise, AI integration, and production-ready architecture skills.

---

## Architecture

### Monorepo Structure
```
tradescope/
├── apps/
│   ├── backend/              # Express + TypeScript API
│   │   ├── src/
│   │   │   ├── index.ts      # Server entry point
│   │   │   ├── routes/       # Express route handlers
│   │   │   ├── services/     # Business logic
│   │   │   │   ├── priceFetcher.ts
│   │   │   │   ├── alertEngine.ts
│   │   │   │   └── aiInsights.ts
│   │   │   ├── websocket/    # WebSocket server
│   │   │   ├── jobs/         # Background workers (Bull queues)
│   │   │   └── middleware/   # Auth, rate limiting, CORS
│   │   └── .env
│   ├── web/                  # Next.js 14 dashboard
│   │   ├── src/
│   │   │   ├── app/          # App Router pages
│   │   │   ├── components/   # React components
│   │   │   ├── hooks/        # Custom hooks (WebSocket, API)
│   │   │   ├── lib/          # Utils, API client
│   │   │   └── stores/       # Zustand state
│   │   └── public/
│   └── landing/              # (Optional) Marketing site
├── packages/
│   ├── shared-types/         # Shared TypeScript types
│   │   └── src/index.ts
│   └── database/             # Prisma schema & client
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
├── docker-compose.yml        # Local development stack
├── .env.example
└── turbo.json
```

### Core Services (Backend)

1. **API Server** - Express REST API + WebSocket server for authenticated requests and real-time subscriptions
2. **Price Fetcher Service** - Background worker fetching market data every 30-60 seconds, stores in database
3. **Alert Engine** - Evaluates user-configured conditions, triggers notifications and AI insight generation
4. **AI Insights Generator** - Calls Claude/GPT APIs to generate natural language analysis

### Data Flow
```
Market APIs (Alpha Vantage, CoinGecko)
    ↓
Price Fetcher (Bull Queue Worker)
    ↓
PostgreSQL (PriceSnapshot table)
    ↓
WebSocket Server → Frontend (Real-time updates)
    ↓
Alert Engine (Condition evaluation)
    ↓
AI Insights Generator (LLM API calls)
    ↓
Notification System → User
```

### Technology Stack

**Backend:**
- Runtime: Node.js 20+ with TypeScript
- Framework: Express.js
- Database: PostgreSQL 16 with Prisma ORM
- Cache/Queue: Redis (Bull/BullMQ for job queues)
- Authentication: JWT with bcrypt password hashing
- Real-time: WebSockets (ws library)
- HTTP Client: Axios for external APIs

**Frontend:**
- Framework: Next.js 14 (App Router)
- UI: React 18 + TypeScript + Tailwind CSS
- Components: shadcn/ui
- State: Zustand
- Forms: React Hook Form + Zod validation
- Charts: Recharts or TradingView Lightweight Charts
- WebSocket: Native WebSocket API with reconnection logic

**Infrastructure:**
- Containerization: Docker + Docker Compose
- CI/CD: GitHub Actions
- Deployment: Railway (primary), Vercel (frontend alternative)
- Monitoring: (Future: Sentry, LogRocket)

---

## Database Schema

### Users & Authentication
```prisma
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
```

### Portfolio Management
```prisma
model Portfolio {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  description String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  holdings    Holding[]
  alerts      Alert[]
  insights    AIInsight[]
  
  @@index([userId])
}

model Holding {
  id               String    @id @default(cuid())
  portfolioId      String
  portfolio        Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  symbol           String    // e.g., "BTC", "AAPL"
  assetType        AssetType // STOCK or CRYPTO
  quantity         Float
  avgPurchasePrice Float     // User's average buy price
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
```

### Market Data
```prisma
model Asset {
  id              String          @id @default(cuid())
  symbol          String          @unique
  name            String
  assetType       AssetType
  exchange        String?         // e.g., "NASDAQ", "Binance"
  logoUrl         String?
  description     String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  priceSnapshots  PriceSnapshot[]
  priceHistory    PriceHistory[]
  
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
  source    String   // "alpha_vantage", "coingecko", "binance"
  timestamp DateTime @default(now())
  
  @@index([assetId, timestamp])
}

model PriceHistory {
  id        String   @id @default(cuid())
  assetId   String
  asset     Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  interval  String   // "1min", "5min", "1hour", "1day"
  open      Float
  high      Float
  low       Float
  close     Float
  volume    Float?
  timestamp DateTime
  
  @@unique([assetId, interval, timestamp])
  @@index([assetId, interval, timestamp])
}
```

### Alerts & Insights
```prisma
model Alert {
  id            String         @id @default(cuid())
  userId        String
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  portfolioId   String?
  portfolio     Portfolio?     @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  name          String
  condition     Json           // Flexible: {type: "price_target", symbol: "BTC", target: 50000}
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
  id              String   @id @default(cuid())
  alertId         String
  alert           Alert    @relation(fields: [alertId], references: [id], onDelete: Cascade)
  triggeredAt     DateTime @default(now())
  priceAtTrigger  Float?
  metadata        Json?    // Additional context
  notificationId  String?
  
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
  content     String      @db.Text // Markdown formatted
  metadata    Json?       // {model: "claude-3-5-sonnet", tokens: 1234, cost: 0.05}
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
```

### Notifications
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   // "alert_triggered", "insight_ready", "system"
  title     String
  message   String   @db.Text
  isRead    Boolean  @default(false)
  metadata  Json?    // Link to alert, insight, etc.
  createdAt DateTime @default(now())
  
  @@index([userId, isRead])
}
```

**Key Design Decisions:**
- **Flexible alert conditions** stored as JSON for extensibility
- **Separate snapshots and history** - snapshots for real-time, aggregated history for charting performance
- **Cascade deletes** ensure data cleanup when users delete portfolios
- **Indexes** on frequently queried fields (userId, symbol, timestamps)
- **Metadata fields** track AI usage costs and enable debugging

---

## API Design

### REST Endpoints

#### Authentication
```
POST   /auth/register          Create new user account
POST   /auth/login             Authenticate and receive JWT
POST   /auth/logout            Invalidate session (optional if stateless)
GET    /auth/me                Get current user profile
```

#### Portfolios
```
GET    /portfolios             List user's portfolios
POST   /portfolios             Create new portfolio
GET    /portfolios/:id         Get portfolio details with holdings
PATCH  /portfolios/:id         Update portfolio name/description
DELETE /portfolios/:id         Delete portfolio and holdings
```

#### Holdings
```
POST   /portfolios/:id/holdings    Add holding to portfolio
PATCH  /holdings/:id               Update quantity or notes
DELETE /holdings/:id               Remove holding
```

#### Watchlist
```
GET    /watchlist              Get user's watchlist
POST   /watchlist              Add symbol to watchlist
DELETE /watchlist/:symbol      Remove from watchlist
```

#### Market Data
```
GET    /assets/search?q=BTC    Search for stocks/crypto by symbol or name
GET    /assets/:symbol/price   Get current price and 24h change
GET    /assets/:symbol/history Get historical price data
       ?interval=1h&range=7d   (intervals: 1min, 5min, 1h, 1d, 1w)
```

#### Alerts
```
GET    /alerts                 List user's alerts
POST   /alerts                 Create new alert
       Body: {name, condition: {type, symbol, threshold}, portfolioId?}
PATCH  /alerts/:id             Update alert or toggle active
DELETE /alerts/:id             Delete alert
GET    /alerts/:id/triggers    Get alert trigger history
```

#### AI Insights
```
GET    /insights               List user's insights
       ?portfolioId=x&type=EVENT_DRIVEN
POST   /insights/generate      Request on-demand insight
       Body: {portfolioId, question?}
GET    /insights/:id           Get specific insight details
```

#### Notifications
```
GET    /notifications          Get user notifications (paginated)
PATCH  /notifications/:id/read Mark notification as read
DELETE /notifications/:id      Dismiss notification
```

### WebSocket Events

**Connection:** `ws://backend-url/ws?token=JWT_TOKEN`

**Client → Server:**
```typescript
// Subscribe to portfolio real-time updates
{type: 'subscribe:portfolio', portfolioId: string}

// Subscribe to specific asset price
{type: 'subscribe:asset', symbol: string}

// Unsubscribe
{type: 'unsubscribe:portfolio', portfolioId: string}
{type: 'unsubscribe:asset', symbol: string}

// Ping for connection health
{type: 'ping'}
```

**Server → Client:**
```typescript
// Price update
{
  type: 'price:update',
  symbol: string,
  price: number,
  change: number,      // $ change
  changePercent: number,
  timestamp: string
}

// Portfolio value update (recalculated from holdings)
{
  type: 'portfolio:value',
  portfolioId: string,
  totalValue: number,
  change24h: number,
  changePercent24h: number
}

// Alert triggered
{
  type: 'alert:triggered',
  alertId: string,
  alertName: string,
  message: string,
  priceAtTrigger: number,
  timestamp: string
}

// AI insight ready
{
  type: 'insight:ready',
  insightId: string,
  portfolioId: string,
  title: string,
  insightType: string
}

// Pong response
{type: 'pong'}

// Error message
{
  type: 'error',
  message: string,
  code?: string
}
```

### Rate Limiting
- **Auth endpoints:** 5 requests/minute per IP
- **API endpoints:** 100 requests/minute per authenticated user
- **WebSocket:** Max 50 active subscriptions per connection
- **On-demand AI insights:** 5 requests/day per user

### Error Responses
```typescript
{
  error: {
    message: string,
    code: string,      // e.g., "UNAUTHORIZED", "RATE_LIMIT_EXCEEDED"
    details?: any
  }
}
```

---

## Market Data Integration

### Data Sources

**Crypto Prices - CoinGecko API (Primary)**
- **Endpoint:** `https://api.coingecko.com/api/v3/simple/price`
- **Rate Limits:** 50 calls/minute (free tier), no auth required
- **Coverage:** 10,000+ cryptocurrencies
- **Data:** Real-time price, 24h volume, market cap, price change %
- **Reliability:** Very high, no API key needed

**Crypto Prices - Binance API (Backup)**
- **Endpoint:** `https://api.binance.com/api/v3/ticker/price`
- **Rate Limits:** 1200 requests/minute
- **Coverage:** All Binance-listed assets
- **Data:** Real-time spot prices
- **Reliability:** Excellent uptime

**Stock Prices - Alpha Vantage (Free Tier)**
- **Endpoint:** `https://www.alphavantage.co/query`
- **Rate Limits:** 25 API calls/day free (500/day for $50/month)
- **Coverage:** US stocks, global equities
- **Data:** Real-time quotes, historical data, company fundamentals
- **Requires:** API key (free signup)

**Stock Prices - Finnhub (Backup)**
- **Endpoint:** `https://finnhub.io/api/v1/quote`
- **Rate Limits:** 60 calls/minute (free tier)
- **Coverage:** Stocks, forex, crypto
- **Requires:** API key (free tier available)

### Price Fetcher Strategy

**Fetching Priority:**
1. **Active subscriptions** (WebSocket users) - Fetch every 30-60 seconds
2. **Portfolio holdings** - Fetch every 5 minutes for background updates
3. **Watchlist items** - Fetch every 5 minutes

**Caching Strategy:**
- Store fetched prices in Redis with 30-second TTL
- Check cache before making API calls
- Serve cached data if API quota exceeded

**Implementation:**
```typescript
// Bull Queue Job (runs every 60 seconds)
async function fetchPrices() {
  // Get all unique symbols that need updates
  const symbols = await getActiveSymbols(); // From subscriptions + holdings
  
  const cryptoSymbols = symbols.filter(s => s.assetType === 'CRYPTO');
  const stockSymbols = symbols.filter(s => s.assetType === 'STOCK');
  
  // Batch crypto calls (CoinGecko supports multiple symbols)
  const cryptoPrices = await fetchCryptoPrices(cryptoSymbols);
  
  // Stock calls are limited - prioritize by active subscriptions
  const stockPrices = await fetchStockPrices(stockSymbols.slice(0, 25));
  
  // Store in database
  await storePriceSnapshots([...cryptoPrices, ...stockPrices]);
  
  // Broadcast to WebSocket subscribers
  broadcastPriceUpdates([...cryptoPrices, ...stockPrices]);
}
```

**Rate Limit Handling:**
- Track API call count in Redis
- If approaching limit, prioritize actively viewed assets
- Show "delayed data" indicator in UI when serving cached/stale prices
- Graceful degradation: Stop background updates, serve only on-demand

**Error Handling:**
- Retry failed requests with exponential backoff (3 retries max)
- Fall back to secondary API if primary fails
- Log errors for monitoring
- Don't crash the worker - skip symbol and continue

---

## Alert Engine & AI Insights

### Alert Condition Types

**1. Price Target Alert**
```json
{
  "type": "price_target",
  "symbol": "BTC",
  "target": 50000,
  "direction": "above" // or "below"
}
```

**2. Percentage Change Alert**
```json
{
  "type": "percent_change",
  "symbol": "AAPL",
  "threshold": 5,       // %
  "direction": "up",    // "up", "down", or "either"
  "timeframe": "24h"    // "1h", "24h", "7d"
}
```

**3. Portfolio Value Alert**
```json
{
  "type": "portfolio_value",
  "portfolioId": "...",
  "threshold": 100000,
  "direction": "above"
}
```

**4. Volume Spike Alert**
```json
{
  "type": "volume_spike",
  "symbol": "ETH",
  "multiplier": 3       // 3x average volume
}
```

**5. Volatility Alert**
```json
{
  "type": "volatility",
  "symbol": "DOGE",
  "threshold": 10,      // % price swing
  "timeframe": "1h"
}
```

### Alert Evaluation Flow
```
Price Update Event
    ↓
Get Active Alerts for Symbol/Portfolio
    ↓
Evaluate Condition (check threshold)
    ↓
Condition Met?
    ↓ YES
Create AlertTrigger Record
    ↓
Send Notification (in-app, email future)
    ↓
Check if Event-Driven Insight Trigger
    ↓ YES
Queue AI Insight Generation Job
```

**Cooldown Period:** After an alert triggers, it won't re-trigger for 1 hour (configurable per alert) to prevent spam.

### AI Insight Generation

#### Trigger Scenarios

**1. Daily Summary (Scheduled - Cron)**
- **When:** Once per day at 6 PM user timezone (or UTC default)
- **Target:** All portfolios with holdings
- **Prompt Template:**
  ```
  You are a financial analyst. Analyze this portfolio's performance over the last 24 hours:
  
  Portfolio: {portfolioName}
  Holdings:
  - {symbol}: {quantity} units, current price ${price}, 24h change: {change}%
  - ...
  
  Total portfolio value: ${totalValue} ({change24h}%)
  
  Provide a concise summary (3-4 sentences):
  1. Overall portfolio performance
  2. Top movers (winners/losers) and likely reasons
  3. Any notable market trends affecting these assets
  
  Write in plain English for a non-expert investor.
  ```

**2. Event-Driven (Triggered by Alerts)**
- **Portfolio drops >5% in 1 hour:**
  ```
  ALERT: Portfolio "{portfolioName}" dropped {percent}% in the last hour.
  
  Holdings changes:
  - {symbol}: ${oldPrice} → ${newPrice} ({change}%)
  - ...
  
  Explain:
  1. What likely caused this drop (market-wide sell-off, specific news, sector rotation)
  2. Whether this is part of a broader trend or isolated incident
  3. What the user should monitor next
  
  Keep it brief (2-3 sentences) and actionable.
  ```

- **Asset gains/loses >10% in 24h:**
  ```
  {symbol} has {gained/dropped} {percent}% in the last 24 hours.
  
  Current price: ${price}
  Portfolio impact: {holdings} units worth ${impact}
  
  Explain:
  1. Most likely reason for this move (news, earnings, market sentiment)
  2. Whether this is a typical volatility pattern for this asset
  3. Brief outlook (is this likely to continue, revert, or stabilize)
  
  2-3 sentences, plain English.
  ```

- **Unusual volume (3x average):**
  ```
  {symbol} is experiencing {multiplier}x its average trading volume.
  
  Current volume: {volume}
  Average volume: {avgVolume}
  Price change: {priceChange}%
  
  Explain:
  1. What unusual volume typically indicates (accumulation, distribution, news event)
  2. Whether price is confirming the volume pattern
  3. What to watch for next
  
  Keep it concise (2-3 sentences).
  ```

**3. On-Demand (User Requested)**
- **User clicks "Generate Insight" on portfolio:**
  ```
  User request: Analyze my portfolio performance.
  
  Portfolio: {portfolioName}
  Holdings: ...
  Recent performance: ...
  
  Provide:
  1. Overall assessment (strong, weak, balanced)
  2. Suggestions for diversification or risk management
  3. Opportunities or concerns to be aware of
  
  4-5 sentences, conversational tone.
  ```

- **User asks specific question:**
  ```
  User question: "{userQuestion}" (e.g., "Why did Bitcoin drop today?")
  
  Context:
  - User holds {quantity} BTC in their portfolio
  - Current price: ${price}
  - Recent change: {change}%
  
  Answer the user's question specifically, providing:
  1. Direct answer to their question
  2. Impact on their holdings if relevant
  3. What they should know or do next
  
  3-4 sentences, friendly and informative tone.
  ```

### LLM Provider Abstraction

**Interface Design:**
```typescript
interface LLMProvider {
  generateInsight(prompt: string, context: InsightContext): Promise<string>;
  estimateCost(prompt: string): number;
  getName(): string;
}

interface InsightContext {
  userId: string;
  portfolioId?: string;
  insightType: InsightType;
  metadata?: Record<string, any>;
}

// Claude Provider
class ClaudeProvider implements LLMProvider {
  private client: Anthropic;
  
  async generateInsight(prompt: string, context: InsightContext): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{role: 'user', content: prompt}]
    });
    
    return response.content[0].text;
  }
  
  estimateCost(prompt: string): number {
    const inputTokens = prompt.length / 4; // rough estimate
    const outputTokens = 500;
    return (inputTokens * 0.003 + outputTokens * 0.015) / 1000; // Claude pricing
  }
  
  getName(): string {
    return 'claude-3-5-sonnet';
  }
}

// OpenAI Provider
class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  
  async generateInsight(prompt: string, context: InsightContext): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 500,
      messages: [{role: 'user', content: prompt}]
    });
    
    return response.choices[0].message.content || '';
  }
  
  estimateCost(prompt: string): number {
    const inputTokens = prompt.length / 4;
    const outputTokens = 500;
    return (inputTokens * 0.0005 + outputTokens * 0.0015) / 1000; // GPT-3.5 pricing
  }
  
  getName(): string {
    return 'gpt-3.5-turbo';
  }
}

// Factory for easy switching
class LLMFactory {
  static getProvider(type: InsightType): LLMProvider {
    // Use cheaper model for daily summaries, premium for event-driven
    if (type === InsightType.EVENT_DRIVEN) {
      return new ClaudeProvider(); // Better reasoning for critical alerts
    }
    return new OpenAIProvider(); // Cost-effective for daily summaries
  }
}
```

**Usage in Insight Service:**
```typescript
async function generateInsight(
  type: InsightType,
  context: InsightContext,
  data: any
): Promise<AIInsight> {
  const provider = LLMFactory.getProvider(type);
  const prompt = buildPrompt(type, data);
  
  const estimatedCost = provider.estimateCost(prompt);
  console.log(`Generating ${type} insight with ${provider.getName()}, estimated cost: $${estimatedCost}`);
  
  const content = await provider.generateInsight(prompt, context);
  
  // Store insight with metadata
  return await prisma.aIInsight.create({
    data: {
      userId: context.userId,
      portfolioId: context.portfolioId,
      insightType: type,
      title: generateTitle(type, data),
      content,
      metadata: {
        model: provider.getName(),
        estimatedCost,
        prompt: prompt.substring(0, 200), // Store truncated for debugging
        generatedAt: new Date().toISOString()
      }
    }
  });
}
```

### Cost Management

**Rate Limits:**
- **Daily summaries:** Once per portfolio per day
- **Event-driven:** Max 10 per portfolio per day (prevents runaway costs during high volatility)
- **On-demand:** 5 requests per user per day

**Cost Tracking:**
- Store estimated cost in `AIInsight.metadata`
- Track total spend per user per month
- Admin dashboard to monitor LLM costs

**Optimizations:**
- Cache similar prompts (e.g., "Why did BTC drop?" within 1-hour window)
- Batch daily summaries to generate overnight when usage is low
- Use cheaper models for less critical insights

---

## Frontend Design & UX

### Tech Stack
- **Framework:** Next.js 14 with App Router (Server Components + Client Components)
- **Styling:** Tailwind CSS v3
- **UI Components:** shadcn/ui (Radix UI primitives + Tailwind)
- **State Management:** Zustand for global state (user, portfolios)
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts (simpler) or TradingView Lightweight Charts (more professional)
- **API Client:** Axios with interceptors for auth tokens
- **WebSocket:** Native WebSocket with auto-reconnect logic

### Page Structure

#### Public Routes
- **`/` (Landing Page)**
  - Hero section with value proposition
  - Feature highlights (real-time tracking, AI insights, multi-asset)
  - Screenshot carousel of dashboard
  - Pricing info (free tier for MVP)
  - CTA buttons: "Get Started" → `/register`

- **`/login`**
  - Email + password form
  - "Forgot password?" link (future)
  - "Don't have an account? Sign up" link

- **`/register`**
  - Email, password, confirm password, name
  - Form validation with Zod
  - "Already have an account? Log in" link

#### Authenticated Routes (Protected)

- **`/dashboard` (Overview)**
  - **Header:** Total portfolio value, 24h change, best/worst performers
  - **Portfolio Cards:** Grid of user's portfolios with mini stats
  - **Live Ticker:** Horizontal scrolling watchlist prices
  - **Recent Insights:** Timeline of latest 3-5 AI insights
  - **Active Alerts:** Count of active alerts, recent triggers

- **`/portfolios` (All Portfolios)**
  - Grid/list view of portfolios
  - Create new portfolio button
  - Sort by: Name, value, performance
  - Quick stats per portfolio card

- **`/portfolios/[id]` (Portfolio Detail)**
  - **Header:** Portfolio name, total value, 24h change, edit/delete actions
  - **Holdings Table:**
    - Columns: Symbol, Quantity, Avg Purchase Price, Current Price, P&L ($), P&L (%), Actions
    - Add holding button
    - Delete/edit holding inline
  - **Performance Chart:** Line chart of portfolio value over time
    - Time range selector: 1D, 1W, 1M, 3M, 1Y, ALL
    - Toggle between $ value and % change
  - **AI Insights Feed:** Timeline of insights for this portfolio
    - Expandable cards with timestamp, type badge, content
  - **Quick Actions:** "Generate Insight Now", "Create Alert", "Add Holding"

- **`/watchlist`**
  - Grid of watched assets (cards with live prices)
  - Real-time price updates with color flashing (green up, red down)
  - Add to watchlist button with search
  - Create alert from watchlist item
  - Add to portfolio from watchlist

- **`/alerts`**
  - List of all alerts with status (active/inactive)
  - Create alert button → modal with condition builder
  - Toggle alert on/off inline
  - Edit/delete actions
  - Alert trigger history (expandable)

- **`/insights`**
  - Timeline/feed of all AI insights
  - Filter by: Portfolio, Type (daily/event/on-demand), Date range
  - Search insights content
  - Click to expand full insight in modal

- **`/settings`**
  - Account info (name, email)
  - Change password
  - Notification preferences (future: email, push)
  - Timezone setting (for daily summaries)
  - Danger zone: Delete account

### Real-Time UI Features

**WebSocket Integration:**
```typescript
// Custom hook for WebSocket connection
function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    const token = getAuthToken();
    ws.current = new WebSocket(`${WS_URL}?token=${token}`);
    
    ws.current.onopen = () => setIsConnected(true);
    ws.current.onclose = () => {
      setIsConnected(false);
      // Reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000);
    };
    
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };
    
    return () => ws.current?.close();
  }, []);
  
  const subscribe = (type: string, id: string) => {
    ws.current?.send(JSON.stringify({type: `subscribe:${type}`, id}));
  };
  
  return {isConnected, subscribe};
}
```

**Live Price Updates:**
- Green/red flash animation on price change (1 second fade)
- Smooth number transitions with react-spring or CSS transitions
- "Live" badge in header when WebSocket connected
- "Reconnecting..." indicator when disconnected

**Notifications:**
- Toast notifications for alert triggers (top-right corner)
- Sound effect option (user preference)
- Click toast to navigate to relevant alert/portfolio
- Notification bell icon in header with unread count

**Loading States:**
- Skeleton loaders for portfolio cards, charts, tables
- Shimmer effect for AI insight generation ("Thinking...")
- Spinners for form submissions
- Optimistic UI updates (add holding immediately, rollback on error)

### Mobile Responsive Design

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Adaptations:**
- Collapsible sidebar navigation (hamburger menu)
- Stacked portfolio cards (single column)
- Horizontal swipe for chart time ranges
- Bottom sheet modals for actions (add holding, create alert)
- Fixed header with live badge and portfolio value
- Simplified tables (hide less important columns, show details on row tap)

### Design System (shadcn/ui Components)

**Core Components:**
- Button, Input, Select, Checkbox, Switch
- Card, Badge, Avatar, Separator
- Dialog, Sheet, Popover, Toast
- Table, Tabs, Accordion
- Form (with React Hook Form integration)

**Custom Components:**
- `PriceDisplay` - Formatted price with currency symbol, color coded change
- `PortfolioCard` - Reusable card for portfolio grid
- `HoldingRow` - Table row with live price updates
- `InsightCard` - Expandable AI insight with timestamp and type
- `AlertBadge` - Visual indicator for alert status
- `LiveTicker` - Horizontal scrolling price feed
- `PerformanceChart` - Recharts wrapper with time range selector

**Color Palette:**
- Primary: Blue (#3B82F6) for CTAs and links
- Success: Green (#10B981) for gains
- Danger: Red (#EF4444) for losses
- Warning: Yellow (#F59E0B) for alerts
- Neutral: Gray scale for backgrounds and text
- Dark mode support (future)

---

## Security Considerations

### Authentication & Authorization

1. **Password Security**
   - Hash passwords with bcrypt (salt rounds: 10)
   - Enforce minimum password length: 8 characters
   - (Future) Password strength requirements: uppercase, lowercase, number, symbol

2. **JWT Tokens**
   - Sign with strong secret (256-bit minimum)
   - Expiry: 7 days
   - Store in HTTP-only cookies (future) or localStorage (MVP)
   - Include user ID and email in payload
   - Refresh token strategy (future phase)

3. **Authorization Checks**
   - Middleware verifies JWT on every protected route
   - Database queries filter by `userId` to ensure data isolation
   - Check portfolio/alert ownership before mutations
   - WebSocket connections require valid token on handshake

4. **Session Management**
   - Track active sessions in Redis (future)
   - Logout invalidates token (if using cookie-based)
   - Concurrent session limits (future)

### API Security

1. **Rate Limiting**
   - Redis-based rate limiter (express-rate-limit)
   - Different limits for auth vs. API routes
   - IP-based for public routes, user-based for authenticated
   - Return 429 status with Retry-After header

2. **Input Validation**
   - Zod schemas validate all request bodies
   - Sanitize user inputs (xss library)
   - Validate symbols against allowed list (prevent injection)
   - Limit request body size (100KB max)

3. **CORS Configuration**
   - Restrict to frontend domain(s) only
   - No wildcard origins in production
   - Allow credentials if using cookies

4. **SQL Injection Prevention**
   - Prisma ORM uses parameterized queries (automatic protection)
   - Never concatenate user input into raw SQL

5. **API Key Security**
   - Store third-party API keys in environment variables
   - Never expose to frontend
   - Rotate keys periodically
   - Use separate keys for dev/prod

### WebSocket Security

1. **Authentication**
   - Require JWT token in connection query string
   - Validate token on handshake, reject if invalid
   - Associate connection with userId

2. **Authorization**
   - Only broadcast data for user's own portfolios/alerts
   - Verify subscription requests (user owns portfolioId)
   - Rate limit subscription requests (max 50 per connection)

3. **Data Sanitization**
   - Validate all client messages
   - Ignore malformed JSON
   - Prevent message injection

### Infrastructure Security

1. **Environment Variables**
   - Never commit `.env` files
   - Use different secrets for dev/prod
   - Rotate secrets periodically
   - Vault solutions (future: AWS Secrets Manager, HashiCorp Vault)

2. **HTTPS Only**
   - Enforce HTTPS in production
   - HSTS headers
   - WSS (secure WebSocket) for real-time connections

3. **Database Security**
   - Use connection pooling (Prisma default)
   - Restrict database access to backend server IP only
   - Regular backups
   - Encrypted connections (SSL)

4. **Logging & Monitoring**
   - Log authentication attempts
   - Log API errors (without sensitive data)
   - Monitor for unusual patterns (rapid requests, failed auths)
   - (Future) Integrate Sentry for error tracking

### Data Privacy

1. **User Data**
   - Don't log passwords (even hashed)
   - Redact sensitive info in logs
   - Delete user data on account deletion (cascade)

2. **Third-Party APIs**
   - Don't send user PII to market data APIs
   - LLM prompts don't include user email/name
   - Review API provider privacy policies

3. **AI Insights**
   - Store insights with portfolioId (user-scoped)
   - Don't share insights across users
   - Allow users to delete insights

---

## Testing Strategy

### Backend Testing

**Unit Tests (Jest + TypeScript)**
- **Services:**
  - Alert condition evaluation logic
  - Portfolio value calculations (P&L, percentage changes)
  - AI prompt building functions
  - Price data transformations
- **Utilities:**
  - JWT signing/verification
  - Password hashing/comparison
  - Input validation schemas (Zod)

**Integration Tests (Supertest + Test Database)**
- **API Endpoints:**
  - Auth flow (register, login, protected routes)
  - Portfolio CRUD operations
  - Holdings management
  - Alert creation and triggering
  - Market data fetching with mocked APIs
- **Database:**
  - Prisma queries with test PostgreSQL instance
  - Transaction rollbacks
  - Cascade deletes
- **WebSocket:**
  - Connection authentication
  - Subscription/unsubscription
  - Message broadcasting

**End-to-End Tests (Future)**
- Complete user flows with Playwright
- Real WebSocket connections
- Mocked external APIs (Alpha Vantage, CoinGecko)

**Mocking External Services:**
- Use `nock` to mock HTTP requests to market data APIs
- Mock LLM providers with fixtures for predictable test outcomes
- Mock Redis for rate limiting tests

**Test Coverage Goal:** 70%+ for business logic, skip simple CRUD/Prisma wrappers

### Frontend Testing

**Component Tests (React Testing Library + Vitest)**
- **Core Components:**
  - Portfolio card rendering with mock data
  - Holdings table with add/edit/delete interactions
  - Alert form validation
  - Price display with color coding
  - Insight card expansion
- **Custom Hooks:**
  - `useWebSocket` connection and reconnection
  - `useAuth` authentication state
  - API hooks (React Query/SWR if used)

**E2E Tests (Playwright)**
- **Critical User Flows:**
  1. Register → Login → Create Portfolio → Add Holding → See Price Update
  2. Create Alert → Wait for Trigger → See Notification
  3. Generate On-Demand Insight → View Insight
  4. Add Symbol to Watchlist → View Live Prices
- **Visual Regression (Future):**
  - Capture screenshots of key pages
  - Compare against baseline with Percy or Chromatic

**Accessibility Testing:**
- Run axe-core on key pages
- Keyboard navigation tests
- Screen reader compatibility (aria-labels)

**Test Coverage Goal:** 60%+ for components, 100% for critical flows (auth, portfolio management)

### Manual Testing Checklist

**Pre-Release:**
- [ ] Test real API integrations (Alpha Vantage, CoinGecko)
- [ ] Verify WebSocket reconnection on network drop
- [ ] Test rate limiting behavior (trigger 429 responses)
- [ ] Test AI insight generation with real LLM calls
- [ ] Mobile responsive testing on iOS/Android devices
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Test with slow network (throttle to 3G)
- [ ] Verify security headers in production
- [ ] Test CORS with different origins
- [ ] Load testing (future: simulate 100 concurrent users)

---

## Deployment

### Local Development

**Prerequisites:**
- Node.js 20+
- npm 10+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis (or use Docker)

**Setup:**
```bash
# Clone repo
git clone <repo-url>
cd tradescope

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with API keys

# Start infrastructure with Docker
docker-compose up -d  # Starts PostgreSQL + Redis

# Run database migrations
cd apps/backend
npx prisma migrate dev
npx prisma generate
cd ../..

# Start all apps
npm run dev
```

**Running Services:**
- Backend: http://localhost:4000
- Frontend: http://localhost:3000
- Prisma Studio: `npm run prisma:studio` (database GUI)

**Docker Compose Services:**
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: tradescope
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Production Deployment

**Railway (Recommended - Simplest)**

Railway supports monorepos and provides PostgreSQL + Redis add-ons.

**Step 1: Create Railway Project**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and create project
railway login
railway init
```

**Step 2: Add Services**
```bash
# Add PostgreSQL
railway add --service postgresql

# Add Redis
railway add --service redis

# These will auto-populate DATABASE_URL and REDIS_URL env vars
```

**Step 3: Configure Backend Service**
- Create `railway.json` in `apps/backend/`:
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "always"
  }
}
```
- Deploy: `railway up --service backend`

**Step 4: Configure Frontend Service**
- Create `railway.json` in `apps/web/`:
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm run start"
  }
}
```
- Set env var: `NEXT_PUBLIC_API_URL=<backend-railway-url>`
- Deploy: `railway up --service web`

**Step 5: Environment Variables**
Set in Railway dashboard for each service:
- Backend: `JWT_SECRET`, `ALPHA_VANTAGE_KEY`, `COINGECKO_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `ALLOWED_ORIGINS`
- Frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`

**Vercel (Frontend Alternative)**

Deploy frontend to Vercel for better Next.js optimization:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from apps/web directory
cd apps/web
vercel --prod
```

Set environment variables in Vercel dashboard.

**Backend on Railway + Frontend on Vercel** is a solid combination.

### CI/CD (GitHub Actions)

**`.github/workflows/test.yml`:**
```yaml
name: Test
on: [pull_request, push]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run test
      - run: npm run build
```

**`.github/workflows/deploy.yml`:**
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm i -g @railway/cli
          railway up --service backend
          railway up --service web
```

**Deployment Strategy:**
- **Feature branches:** Run tests only
- **Main branch:** Run tests + auto-deploy to production
- **Migrations:** Run `prisma migrate deploy` in deployment script

### Environment Variables Reference

**Backend (`apps/backend/.env`):**
```bash
# Server
PORT=4000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/tradescope

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-super-secret-256-bit-key
JWT_EXPIRES_IN=7d

# Market Data APIs
ALPHA_VANTAGE_KEY=your-alpha-vantage-key
COINGECKO_API_KEY=your-coingecko-key  # Optional, free tier doesn't need key
FINNHUB_API_KEY=your-finnhub-key      # Backup for stocks

# AI Providers
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# Security
ALLOWED_ORIGINS=https://your-frontend-url.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

**Frontend (`apps/web/.env.local`):**
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend-url.railway.app/ws
```

### Monitoring & Logging (Future Enhancements)

**Application Monitoring:**
- Sentry for error tracking
- LogRocket for session replay
- PostHog for product analytics

**Infrastructure Monitoring:**
- Railway built-in metrics (CPU, memory, requests)
- Uptime monitoring (UptimeRobot, Better Uptime)

**Logs:**
- Centralized logging with Winston or Pino
- Log levels: error, warn, info, debug
- Structured JSON logs for easier parsing

---

## MVP Scope & Development Phases

### Phase 1: MVP (Core Features)

**Goal:** Launch a working product that demonstrates real-time portfolio tracking with AI insights

**Must Have:**
- ✅ User registration and login (email/password)
- ✅ Create portfolio and add holdings
- ✅ Real-time price updates via WebSocket (crypto only for MVP to avoid Alpha Vantage rate limits)
- ✅ Basic price alerts (price target, % change)
- ✅ Event-driven AI insights (portfolio drops/gains >5%)
- ✅ Portfolio performance dashboard with live value
- ✅ Watchlist with live crypto prices
- ✅ Historical price charts (1D, 1W, 1M ranges)
- ✅ In-app notifications for triggered alerts
- ✅ Mobile responsive design

**Excluded from MVP (Phase 2+):**
- Stock market data (focus on crypto first to avoid API rate limit complexity)
- Daily AI summary cron job
- On-demand AI insights
- Email notifications
- Password reset flow
- Advanced alerts (volume spikes, volatility)
- Multiple portfolios per user (start with one)
- Export/share portfolios

**Estimated Timeline:** 3-4 weeks for MVP

**Success Criteria:**
- User can register, create portfolio, add crypto holdings
- Prices update in real-time when dashboard is open
- Alerts trigger and generate AI insights when conditions met
- UI is clean, responsive, and demonstrates full-stack skills
- Deployed to production with proper security

### Phase 2: Enhanced Features

**Timeline:** +2 weeks after MVP

**Features:**
- ✅ Stock market data integration (Alpha Vantage)
- ✅ Daily AI summary cron job (scheduled insights)
- ✅ On-demand AI insights (user-triggered analysis)
- ✅ Advanced alerts (volume spikes, volatility)
- ✅ Multiple portfolios per user
- ✅ Email notifications (SendGrid, Resend)
- ✅ Password reset flow (email-based)
- ✅ Portfolio performance history tracking (store historical snapshots)

### Phase 3: Polish & Growth Features

**Timeline:** +2-3 weeks after Phase 2

**Features:**
- ✅ Dark mode support
- ✅ Social features (share portfolios publicly with unique URL)
- ✅ Export portfolio data (CSV, PDF reports)
- ✅ Advanced charts (TradingView Lightweight Charts)
- ✅ Tax reporting helpers (cost basis, realized gains)
- ✅ Push notifications (web push API)
- ✅ Mobile apps (React Native or PWA conversion)
- ✅ Onboarding tutorial/tour
- ✅ Referral system
- ✅ Premium tier (more insights, alerts, portfolios)

### Phase 4: Scale & Optimization (Future)

**Features:**
- ✅ Horizontal scaling (multiple backend instances behind load balancer)
- ✅ Caching layer optimization (Redis for hot data)
- ✅ Database read replicas for analytics queries
- ✅ Advanced AI features (predictive insights, anomaly detection)
- ✅ Backtesting engine (test strategies against historical data)
- ✅ API for third-party integrations
- ✅ Slack/Discord bot for alerts
- ✅ Community features (forums, shared strategies)

---

## Technical Risks & Mitigation

### Risk 1: API Rate Limits

**Problem:** Alpha Vantage free tier only allows 25 calls/day, insufficient for multiple users.

**Mitigation:**
- **MVP:** Focus on crypto (CoinGecko has generous free tier)
- **Phase 2:** Implement intelligent caching and prioritization
- **Long-term:** Upgrade to paid Alpha Vantage plan ($50/month for 500 calls/day) or switch to Finnhub
- **Fallback:** Show "delayed data" indicator, graceful degradation

### Risk 2: LLM API Costs

**Problem:** AI insights could get expensive with many users and events.

**Mitigation:**
- **Rate limits:** 5 on-demand insights per user per day
- **Batching:** Generate daily summaries overnight, not in real-time
- **Cost tracking:** Store estimated costs in metadata, alert when threshold exceeded
- **Caching:** Reuse similar insights within time windows
- **Model selection:** Use cheaper GPT-3.5 for daily summaries, Claude only for critical events
- **Freemium model:** Limit free tier to 10 insights/month, charge for more

### Risk 3: Real-Time Performance at Scale

**Problem:** WebSocket connections don't scale linearly; broadcasting to 1000s of users could overload single server.

**Mitigation:**
- **MVP:** Single server handles ~1000 concurrent connections easily
- **Phase 3:** Use Redis pub/sub for multi-server WebSocket broadcasting
- **Phase 4:** Horizontal scaling with sticky sessions or shared message bus (RabbitMQ, Kafka)
- **Optimization:** Only broadcast price updates to actively subscribed assets, not all prices

### Risk 4: Data Consistency

**Problem:** Race conditions between price updates, alert checks, and portfolio value calculations.

**Mitigation:**
- **Transactions:** Use Prisma transactions for critical operations
- **Idempotency:** Alert triggers check `lastTriggered` timestamp to prevent duplicates
- **Job queues:** Bull queues ensure sequential processing of alerts per portfolio
- **Eventual consistency:** Accept minor delays in portfolio value updates (recalculate every 60s)

### Risk 5: Security Vulnerabilities

**Problem:** Financial data is sensitive; security breaches damage reputation.

**Mitigation:**
- **Code review:** Peer review all auth and payment-related code
- **Dependency scanning:** Use `npm audit` and Dependabot
- **Security testing:** Run OWASP ZAP or Burp Suite scans
- **Bug bounty:** (Future) Offer rewards for responsible disclosure
- **Compliance:** Follow OWASP Top 10 best practices

### Risk 6: Database Growth

**Problem:** `PriceSnapshot` table grows indefinitely (millions of rows).

**Mitigation:**
- **Data retention:** Delete snapshots older than 90 days (keep aggregated history)
- **Partitioning:** Use PostgreSQL table partitioning by timestamp
- **Archival:** Move old data to cold storage (S3, data lake)
- **Indexes:** Proper indexing on `assetId + timestamp` for fast queries

---

## Success Metrics (Post-Launch)

### Technical Metrics
- **Uptime:** >99.5% availability
- **API Latency:** p95 < 500ms for REST endpoints
- **WebSocket Latency:** < 100ms for price updates
- **Error Rate:** < 1% of requests
- **Test Coverage:** >70% backend, >60% frontend

### User Engagement Metrics
- **Daily Active Users (DAU)**
- **Portfolios created per user**
- **Average holdings per portfolio**
- **Alerts created per user**
- **AI insights generated per day**
- **WebSocket session duration** (time spent on dashboard)
- **Retention:** 7-day, 30-day user return rate

### Business Metrics (Future)
- **Conversion rate:** Free → Paid tier
- **Monthly Recurring Revenue (MRR)**
- **Customer Acquisition Cost (CAC)**
- **Lifetime Value (LTV)**

---

## Open Questions & Future Considerations

1. **Monetization Strategy:**
   - Free tier: 1 portfolio, 10 alerts, 10 AI insights/month
   - Pro tier ($9/month): Unlimited portfolios, 100 alerts, unlimited insights
   - Enterprise tier: API access, priority support

2. **Mobile Strategy:**
   - Start with responsive web (PWA)
   - Phase 3: Native apps with React Native if user demand justifies effort

3. **Trading Integration:**
   - Future: Connect to Robinhood, Coinbase APIs for automatic portfolio sync
   - Legal/compliance considerations (not a broker, data provider only)

4. **Community Features:**
   - Public portfolios (share strategy)
   - Follow other users
   - Comments/discussions on insights
   - Leaderboards (best performing portfolios)

5. **Advanced AI Features:**
   - Sentiment analysis from Twitter/Reddit
   - Predictive price movement (ML models)
   - Personalized trading suggestions (regulatory concerns)

6. **Internationalization:**
   - Support for global stocks (LSE, TSE, etc.)
   - Multi-currency portfolios
   - Localization (i18n)

---

## Conclusion

TradeScope is a full-stack SaaS platform that demonstrates modern web development skills across real-time systems, AI integration, and production-ready architecture. By focusing on crypto for the MVP, we avoid API rate limit complexities while delivering a compelling portfolio piece that showcases:

- **Backend expertise:** Express, WebSockets, job queues, LLM integration
- **Frontend skills:** Next.js 14, real-time UI, responsive design
- **System design:** Scalable architecture, caching, rate limiting
- **DevOps:** Docker, CI/CD, deployment to Railway/Vercel
- **Security:** Authentication, authorization, input validation
- **Product thinking:** MVP scope, phased rollout, user-centric features

The phased approach allows for quick iteration and learning, with clear milestones and success criteria. Phase 1 delivers a working product in 3-4 weeks, setting a strong foundation for future enhancements.

---

**Next Steps:**
1. Review and approve this design specification
2. Create implementation plan (task breakdown, timeline)
3. Set up project repository and infrastructure
4. Begin Phase 1 development

**Estimated Total Effort:**
- Phase 1 (MVP): 3-4 weeks
- Phase 2 (Enhanced): +2 weeks
- Phase 3 (Polish): +2-3 weeks
- **Total to production-ready showcase:** 7-9 weeks

This timeline assumes full-time focus. For part-time work (evenings/weekends), multiply by 2-3x.
