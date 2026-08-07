# TradeScope

Real-time portfolio monitoring platform for stocks and cryptocurrencies with AI-powered market insights.

## Overview

TradeScope is a full-stack SaaS application that provides:
- **Real-time price tracking** for stocks and cryptocurrencies
- **Smart alerting system** with customizable conditions
- **AI-powered insights** that explain market movements in plain English
- **Beautiful dashboard** with live charts and portfolio analytics

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Prisma, Redis
- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Real-time**: WebSockets for live price updates
- **AI**: Claude (Anthropic) and OpenAI GPT for insights generation
- **Infrastructure**: Docker, Railway, GitHub Actions

## Project Status

🚧 **Design Phase** - See [design specification](./docs/superpowers/specs/2026-08-04-tradescope-design.md) for complete architecture and feature details.

## Features (Planned)

### MVP (Phase 1)
- User authentication (email/password)
- Portfolio management (create, add holdings, track value)
- Real-time cryptocurrency price updates via WebSocket
- Price alerts (target price, percentage change)
- Event-driven AI insights (portfolio drops/gains >5%)
- Watchlist with live prices
- Mobile-responsive dashboard

### Phase 2
- Stock market data integration
- Daily AI summary (scheduled insights)
- On-demand AI insights
- Advanced alerts (volume spikes, volatility)
- Multiple portfolios per user
- Email notifications

### Phase 3
- Dark mode
- Public portfolio sharing
- Export data (CSV, PDF)
- Advanced charting (TradingView integration)
- Tax reporting helpers
- Push notifications

## Architecture

Monorepo structure with Turborepo:
```
tradescope/
├── apps/
│   ├── backend/              # Express API + WebSocket server
│   ├── web/                  # Next.js dashboard
│   └── landing/              # Marketing site (optional)
├── packages/
│   ├── shared-types/         # Shared TypeScript types
│   └── database/             # Prisma schema & client
└── docker-compose.yml        # Local development stack
```

## Documentation

- [Design Specification](./docs/superpowers/specs/2026-08-04-tradescope-design.md) - Complete architecture, data models, and API design

## Development Timeline

- **Phase 1 (MVP)**: 3-4 weeks
- **Phase 2 (Enhanced)**: +2 weeks
- **Phase 3 (Polish)**: +2-3 weeks

**Total to production-ready**: 7-9 weeks

## License

MIT

## Author

Built as a portfolio showcase project demonstrating full-stack development, real-time systems, and AI integration.
