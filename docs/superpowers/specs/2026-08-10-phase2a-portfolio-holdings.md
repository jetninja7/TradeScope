# TradeScope Phase 2A: Portfolio & Holdings Management
**Design Specification**  
**Date:** 2026-08-10  
**Status:** Ready for Implementation

---

## Executive Summary

Phase 2A builds the core portfolio and holdings management features for TradeScope. Users can manage their investment portfolios, adding and tracking their crypto and stock holdings. This phase provides the foundation for all future features (real-time pricing, alerts, AI insights).

### What We're Building

- Backend API routes for portfolio and holdings CRUD operations
- Automatic default portfolio creation on user registration
- Frontend pages for viewing and managing holdings
- Full authorization and ownership checks
- Comprehensive test coverage

### What We're Deferring

- Real-time price updates (Phase 2B/2C)
- Portfolio value calculations (needs price data)
- Multiple portfolios per user (schema supports it, UI doesn't yet)
- Transaction history tracking
- Portfolio sharing or export features

---

## Scope & Success Criteria

### In Scope

1. **Backend:**
   - Portfolio CRUD routes (list, get, update, delete)
   - Holdings CRUD routes (create, update, delete)
   - Ownership middleware for authorization
   - Portfolio service for business logic
   - Integration tests for all routes

2. **Frontend:**
   - Dashboard layout with navigation
   - Portfolio overview page with holdings list
   - Add/Edit holding forms with validation
   - API client with JWT authentication
   - Component tests

3. **Database:**
   - Use existing Portfolio and Holding models (no schema changes)
   - Default portfolio auto-creation on user registration

### Success Criteria

- ✅ User registers → default portfolio automatically created
- ✅ User can add holdings (symbol, quantity, avg price, notes)
- ✅ User can edit and delete holdings
- ✅ All operations protected by authentication
- ✅ Users cannot access other users' portfolios/holdings
- ✅ Frontend displays holdings list with empty state
- ✅ 80%+ backend test coverage, 60%+ frontend component coverage

---

## Architecture

### Backend Structure

```
apps/backend/src/
├── routes/
│   ├── auth.ts (existing)
│   ├── portfolios.ts (new)
│   └── holdings.ts (new)
├── services/
│   └── portfolioService.ts (new)
├── middleware/
│   ├── auth.ts (existing)
│   └── ownership.ts (new)
└── index.ts (register routes)
```

### Frontend Structure

```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx (existing)
│   │   └── register/page.tsx (existing)
│   └── (dashboard)/
│       ├── layout.tsx (new)
│       └── portfolio/
│           └── page.tsx (new)
├── components/
│   ├── HoldingsList.tsx (new)
│   ├── AddHoldingForm.tsx (new)
│   └── EditHoldingModal.tsx (new)
├── hooks/
│   └── useAuth.tsx (new)
└── lib/
    └── api-client.ts (new)
```

### Key Design Decisions

1. **Ownership Middleware:** Reusable middleware that verifies user owns the portfolio/holding before allowing modifications. Returns 403 Forbidden if ownership check fails.

2. **Portfolio Service:** Encapsulates business logic like creating default portfolio. Keeps routes thin and testable.

3. **Dashboard Layout:** Shared Next.js layout for all authenticated pages with navigation and auth verification.

4. **API Client:** Centralized axios instance that automatically injects JWT token from localStorage.

5. **Single Portfolio MVP:** UI only shows/manages the default portfolio, but backend supports multiple portfolios for future expansion.

---

## API Design

### Portfolio Routes

**Base Path:** `/portfolios`

#### GET /portfolios
List all portfolios for authenticated user.

**Authentication:** Required (JWT)

**Response:** `200 OK`
```typescript
[
  {
    id: string,
    name: string,
    description: string | null,
    createdAt: string,
    updatedAt: string
  }
]
```

---

#### GET /portfolios/:id
Get portfolio details with holdings.

**Authentication:** Required (JWT)  
**Authorization:** User must own portfolio

**Response:** `200 OK`
```typescript
{
  id: string,
  name: string,
  description: string | null,
  holdings: [
    {
      id: string,
      symbol: string,
      assetType: "CRYPTO" | "STOCK",
      quantity: number,
      avgPurchasePrice: number,
      notes: string | null,
      createdAt: string,
      updatedAt: string,
      // Price fields null until Phase 2B
      currentPrice: null,
      totalValue: null,
      profitLoss: null,
      profitLossPercent: null
    }
  ],
  createdAt: string,
  updatedAt: string
}
```

**Errors:**
- `403 Forbidden` - User doesn't own this portfolio
- `404 Not Found` - Portfolio doesn't exist

---

#### PATCH /portfolios/:id
Update portfolio name or description.

**Authentication:** Required (JWT)  
**Authorization:** User must own portfolio

**Request Body:**
```typescript
{
  name?: string,
  description?: string
}
```

**Response:** `200 OK`
```typescript
{
  id: string,
  name: string,
  description: string | null,
  updatedAt: string
}
```

**Validation:**
- `name` must be 1-100 characters if provided
- At least one field must be provided

**Errors:**
- `400 Bad Request` - Validation failed
- `403 Forbidden` - User doesn't own portfolio
- `404 Not Found` - Portfolio doesn't exist

---

#### DELETE /portfolios/:id
Delete portfolio and all its holdings.

**Authentication:** Required (JWT)  
**Authorization:** User must own portfolio

**Response:** `204 No Content`

**Errors:**
- `403 Forbidden` - User doesn't own portfolio
- `404 Not Found` - Portfolio doesn't exist

---

### Holdings Routes

**Base Path:** `/portfolios/:portfolioId/holdings` and `/holdings/:id`

#### POST /portfolios/:portfolioId/holdings
Add a new holding to portfolio.

**Authentication:** Required (JWT)  
**Authorization:** User must own portfolio

**Request Body:**
```typescript
{
  symbol: string,           // e.g., "BTC", "AAPL"
  assetType: "CRYPTO" | "STOCK",
  quantity: number,         // Must be > 0
  avgPurchasePrice: number, // Must be > 0
  notes?: string           // Optional, max 500 chars
}
```

**Response:** `201 Created`
```typescript
{
  id: string,
  portfolioId: string,
  symbol: string,
  assetType: "CRYPTO" | "STOCK",
  quantity: number,
  avgPurchasePrice: number,
  notes: string | null,
  createdAt: string,
  updatedAt: string
}
```

**Validation:**
- `symbol` required, converted to uppercase, max 10 chars
- `assetType` must be "CRYPTO" or "STOCK"
- `quantity` must be positive number with up to 8 decimals
- `avgPurchasePrice` must be positive number with up to 8 decimals
- `notes` max 500 characters

**Errors:**
- `400 Bad Request` - Validation failed
- `403 Forbidden` - User doesn't own portfolio
- `404 Not Found` - Portfolio doesn't exist

---

#### PATCH /holdings/:id
Update an existing holding.

**Authentication:** Required (JWT)  
**Authorization:** User must own the holding's portfolio

**Request Body:**
```typescript
{
  quantity?: number,
  avgPurchasePrice?: number,
  notes?: string
}
```

**Response:** `200 OK`
```typescript
{
  id: string,
  portfolioId: string,
  symbol: string,
  assetType: "CRYPTO" | "STOCK",
  quantity: number,
  avgPurchasePrice: number,
  notes: string | null,
  updatedAt: string
}
```

**Validation:**
- At least one field must be provided
- `quantity` must be positive if provided
- `avgPurchasePrice` must be positive if provided
- `notes` max 500 characters

**Errors:**
- `400 Bad Request` - Validation failed
- `403 Forbidden` - User doesn't own holding
- `404 Not Found` - Holding doesn't exist

---

#### DELETE /holdings/:id
Remove a holding from portfolio.

**Authentication:** Required (JWT)  
**Authorization:** User must own the holding's portfolio

**Response:** `204 No Content`

**Errors:**
- `403 Forbidden` - User doesn't own holding
- `404 Not Found` - Holding doesn't exist

---

## Backend Implementation Details

### Portfolio Service

**File:** `apps/backend/src/services/portfolioService.ts`

**Purpose:** Business logic for portfolio operations.

**Methods:**

```typescript
class PortfolioService {
  // Create default portfolio for new user
  async createDefaultPortfolio(userId: string): Promise<Portfolio> {
    return prisma.portfolio.create({
      data: {
        userId,
        name: "My Portfolio",
        description: null
      }
    });
  }

  // Get user's default portfolio (or first portfolio)
  async getDefaultPortfolio(userId: string): Promise<Portfolio | null> {
    return prisma.portfolio.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
  }
}
```

**Usage:** Called from auth register route after user creation.

---

### Ownership Middleware

**File:** `apps/backend/src/middleware/ownership.ts`

**Purpose:** Verify user owns the resource they're trying to access.

**Implementation:**

```typescript
export async function verifyPortfolioOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const portfolioId = req.params.id || req.params.portfolioId;
  const userId = req.userId;

  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    select: { userId: true }
  });

  if (!portfolio) {
    return res.status(404).json({
      error: { message: 'Portfolio not found', code: 'NOT_FOUND' }
    });
  }

  if (portfolio.userId !== userId) {
    return res.status(403).json({
      error: { message: 'Access denied', code: 'FORBIDDEN' }
    });
  }

  next();
}

export async function verifyHoldingOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const holdingId = req.params.id;
  const userId = req.userId;

  const holding = await prisma.holding.findUnique({
    where: { id: holdingId },
    include: { portfolio: { select: { userId: true } } }
  });

  if (!holding) {
    return res.status(404).json({
      error: { message: 'Holding not found', code: 'NOT_FOUND' }
    });
  }

  if (holding.portfolio.userId !== userId) {
    return res.status(403).json({
      error: { message: 'Access denied', code: 'FORBIDDEN' }
    });
  }

  next();
}
```

**Usage:**
```typescript
router.get('/portfolios/:id', authenticate, verifyPortfolioOwnership, handler);
router.patch('/holdings/:id', authenticate, verifyHoldingOwnership, handler);
```

---

### Auth Route Modification

**File:** `apps/backend/src/routes/auth.ts`

**Change:** After creating user, create default portfolio.

```typescript
// In POST /auth/register handler, after user creation:

const user = await prisma.user.create({
  data: { email, passwordHash, name }
});

// Create default portfolio
await portfolioService.createDefaultPortfolio(user.id);

const token = generateToken({ userId: user.id, email: user.email });
// ... rest of response
```

---

## Frontend Implementation Details

### API Client

**File:** `apps/web/src/lib/api-client.ts`

**Purpose:** Centralized axios instance with JWT authentication.

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 (redirect to login)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### Auth Hook

**File:** `apps/web/src/hooks/useAuth.tsx`

**Purpose:** Manage authentication state.

```typescript
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: { id: string; email: string; name: string | null } | null;
  login: (token: string, user: any) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('authToken') : null,
  user: null,
  
  login: (token, user) => {
    localStorage.setItem('authToken', token);
    set({ token, user });
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    set({ token: null, user: null });
  },
  
  isAuthenticated: () => !!get().token
}));
```

---

### Dashboard Layout

**File:** `apps/web/src/app/(dashboard)/layout.tsx`

**Purpose:** Shared layout for authenticated pages with navigation.

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated()) {
    return null; // or loading spinner
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">TradeScope</h1>
              </div>
              <div className="ml-6 flex space-x-8">
                <a href="/portfolio" className="inline-flex items-center px-1 pt-1 text-sm font-medium">
                  Portfolio
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <button onClick={logout} className="text-sm text-gray-700 hover:text-gray-900">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
```

---

### Portfolio Page

**File:** `apps/web/src/app/(dashboard)/portfolio/page.tsx`

**Purpose:** Display holdings list with add/edit functionality.

**Key Features:**
- Fetch portfolio data on mount
- Display holdings table
- Empty state: "No holdings yet. Add your first investment."
- Add holding button (floating or in header)
- Edit/Delete actions per holding
- Optimistic updates for better UX

**Data Fetching:**
```typescript
const [portfolio, setPortfolio] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchPortfolio() {
    try {
      const { data: portfolios } = await apiClient.get('/portfolios');
      if (portfolios.length > 0) {
        const { data: fullPortfolio } = await apiClient.get(
          `/portfolios/${portfolios[0].id}`
        );
        setPortfolio(fullPortfolio);
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  }
  fetchPortfolio();
}, []);
```

---

### Holdings List Component

**File:** `apps/web/src/components/HoldingsList.tsx`

**Purpose:** Table display of holdings.

**Columns:**
- Symbol (with asset type badge: "CRYPTO" or "STOCK")
- Quantity (formatted with appropriate decimals)
- Avg Purchase Price (currency format)
- Notes (truncated, show full on hover)
- Actions (Edit, Delete icons)

**Empty State:**
```tsx
{holdings.length === 0 && (
  <div className="text-center py-12">
    <p className="text-gray-500 mb-4">No holdings yet.</p>
    <button onClick={onAddClick} className="btn-primary">
      Add Your First Investment
    </button>
  </div>
)}
```

---

### Add/Edit Holding Form

**File:** `apps/web/src/components/AddHoldingForm.tsx`

**Purpose:** Modal form for creating/editing holdings.

**Form Fields:**
- Symbol (text input, uppercase conversion)
- Asset Type (dropdown/radio: CRYPTO, STOCK)
- Quantity (number input, decimal support)
- Avg Purchase Price (number input, currency format)
- Notes (textarea, optional, max 500 chars)

**Validation (Zod schema):**
```typescript
const holdingSchema = z.object({
  symbol: z.string().min(1, 'Symbol required').max(10).toUpperCase(),
  assetType: z.enum(['CRYPTO', 'STOCK']),
  quantity: z.number().positive('Must be greater than 0'),
  avgPurchasePrice: z.number().positive('Must be greater than 0'),
  notes: z.string().max(500).optional()
});
```

**Form Submission:**
```typescript
const onSubmit = async (data) => {
  try {
    if (editingHolding) {
      await apiClient.patch(`/holdings/${editingHolding.id}`, data);
    } else {
      await apiClient.post(`/portfolios/${portfolioId}/holdings`, data);
    }
    // Refresh holdings list
    onSuccess();
    onClose();
  } catch (error) {
    // Show error toast
  }
};
```

---

## Testing Strategy

### Backend Integration Tests

**File:** `apps/backend/src/routes/__tests__/portfolios.test.ts`

**Test Cases:**

1. **GET /portfolios**
   - ✅ Returns user's portfolios when authenticated
   - ✅ Returns empty array if no portfolios
   - ✅ Returns 401 if not authenticated

2. **GET /portfolios/:id**
   - ✅ Returns portfolio with holdings
   - ✅ Returns 403 if user doesn't own portfolio
   - ✅ Returns 404 if portfolio doesn't exist

3. **PATCH /portfolios/:id**
   - ✅ Updates portfolio name
   - ✅ Updates portfolio description
   - ✅ Returns 400 if validation fails
   - ✅ Returns 403 if user doesn't own portfolio

4. **DELETE /portfolios/:id**
   - ✅ Deletes portfolio and cascades holdings
   - ✅ Returns 403 if user doesn't own portfolio

---

**File:** `apps/backend/src/routes/__tests__/holdings.test.ts`

**Test Cases:**

1. **POST /portfolios/:portfolioId/holdings**
   - ✅ Creates holding with valid data
   - ✅ Returns 400 if quantity <= 0
   - ✅ Returns 400 if avgPurchasePrice <= 0
   - ✅ Returns 403 if user doesn't own portfolio
   - ✅ Symbol automatically uppercased

2. **PATCH /holdings/:id**
   - ✅ Updates quantity
   - ✅ Updates avgPurchasePrice
   - ✅ Updates notes
   - ✅ Returns 400 if no fields provided
   - ✅ Returns 403 if user doesn't own holding

3. **DELETE /holdings/:id**
   - ✅ Deletes holding
   - ✅ Returns 403 if user doesn't own holding
   - ✅ Returns 404 if holding doesn't exist

---

**File:** `apps/backend/src/services/__tests__/portfolioService.test.ts`

**Test Cases:**

1. **createDefaultPortfolio**
   - ✅ Creates portfolio with name "My Portfolio"
   - ✅ Associates with correct user
   - ✅ Returns created portfolio

2. **getDefaultPortfolio**
   - ✅ Returns first portfolio for user
   - ✅ Returns null if no portfolios

---

### Frontend Component Tests

**File:** `apps/web/src/components/__tests__/HoldingsList.test.tsx`

**Test Cases:**
- ✅ Renders holdings table with data
- ✅ Shows empty state when no holdings
- ✅ Calls edit handler when edit clicked
- ✅ Calls delete handler when delete clicked
- ✅ Formats quantity and price correctly

---

**File:** `apps/web/src/components/__tests__/AddHoldingForm.test.tsx`

**Test Cases:**
- ✅ Validates required fields
- ✅ Validates quantity > 0
- ✅ Validates avgPurchasePrice > 0
- ✅ Converts symbol to uppercase
- ✅ Submits form with correct data
- ✅ Shows error message on API failure

---

### E2E Test (Optional for MVP)

**Scenario:** Complete user journey
1. User registers
2. Redirected to portfolio page (empty)
3. Clicks "Add Holding"
4. Fills form with BTC data
5. Submits form
6. Sees holding in list
7. Edits holding
8. Deletes holding

---

## Implementation Order

### Phase 1: Backend (PR #1)

**Tasks:**

1. **Ownership Middleware**
   - Create `apps/backend/src/middleware/ownership.ts`
   - Implement `verifyPortfolioOwnership`
   - Implement `verifyHoldingOwnership`
   - Write unit tests

2. **Portfolio Service**
   - Create `apps/backend/src/services/portfolioService.ts`
   - Implement `createDefaultPortfolio`
   - Implement `getDefaultPortfolio`
   - Write unit tests

3. **Update Auth Routes**
   - Modify `POST /auth/register` to create default portfolio
   - Add integration test for default portfolio creation

4. **Portfolio Routes**
   - Create `apps/backend/src/routes/portfolios.ts`
   - Implement all portfolio endpoints
   - Write integration tests
   - Register routes in `apps/backend/src/index.ts`

5. **Holdings Routes**
   - Create `apps/backend/src/routes/holdings.ts`
   - Implement all holdings endpoints
   - Write integration tests
   - Register routes in `apps/backend/src/index.ts`

6. **Seed Data (Optional)**
   - Create seed script for testing
   - Add sample portfolios and holdings

**Testing:** Run `npm test` - all tests must pass before PR.

---

### Phase 2: Frontend (PR #2)

**Tasks:**

1. **API Client Setup**
   - Create `apps/web/src/lib/api-client.ts`
   - Configure axios with JWT interceptors
   - Test token injection

2. **Auth Hook**
   - Create `apps/web/src/hooks/useAuth.tsx`
   - Implement Zustand store for auth state
   - Test login/logout flows

3. **Dashboard Layout**
   - Create `apps/web/src/app/(dashboard)/layout.tsx`
   - Add navigation bar
   - Add auth check and redirect
   - Style with Tailwind CSS

4. **Portfolio Page**
   - Create `apps/web/src/app/(dashboard)/portfolio/page.tsx`
   - Fetch and display portfolio data
   - Handle loading and error states

5. **Holdings List Component**
   - Create `apps/web/src/components/HoldingsList.tsx`
   - Display holdings table
   - Add empty state
   - Add edit/delete actions
   - Write component tests

6. **Add/Edit Form**
   - Create `apps/web/src/components/AddHoldingForm.tsx`
   - Build form with React Hook Form + Zod
   - Add validation
   - Handle create/update logic
   - Write component tests

7. **Integration**
   - Wire up all components
   - Test full CRUD flow manually
   - Fix any issues

**Testing:** Run `npm test` and manually test in browser before PR.

---

## Database Considerations

### No Schema Changes Needed

The existing Prisma schema from Phase 1 already has:
- `Portfolio` model with userId, name, description
- `Holding` model with portfolioId, symbol, assetType, quantity, avgPurchasePrice, notes
- Proper foreign keys and cascade deletes

### Future-Proofing

The schema is already designed to support:
- Multiple portfolios per user (schema allows, UI doesn't yet)
- Additional holding fields (could add purchaseDate, transactionId later)
- Portfolio-level metadata (could add currency, timezone preferences)

---

## Security Considerations

1. **Authentication:** All routes require valid JWT token
2. **Authorization:** Ownership middleware prevents users from accessing other users' data
3. **Input Validation:** All inputs validated with Zod on both client and server
4. **SQL Injection:** Prisma ORM parameterizes queries automatically
5. **XSS Protection:** React escapes output by default
6. **CORS:** Already configured in Phase 1 to restrict origins

---

## Performance Considerations

1. **Database Queries:**
   - Use `include` to fetch holdings with portfolio (avoid N+1)
   - Add indexes on `userId` in Portfolio (already exists from Phase 1)
   
2. **Frontend Optimization:**
   - Use React.memo for HoldingsList if performance issues
   - Debounce search/filter inputs
   - Optimistic updates for better perceived performance

3. **Pagination:** Not needed for MVP (users unlikely to have >100 holdings initially)

---

## Error Handling

### Backend Errors

**Standard Error Format:**
```typescript
{
  error: {
    message: string,
    code: string,
    details?: any
  }
}
```

**Error Codes:**
- `UNAUTHORIZED` - Missing or invalid JWT
- `FORBIDDEN` - User doesn't own resource
- `NOT_FOUND` - Resource doesn't exist
- `VALIDATION_ERROR` - Input validation failed
- `INTERNAL_ERROR` - Server error

### Frontend Error Handling

1. **Network Errors:** Show toast notification with retry button
2. **Validation Errors:** Display inline under form fields
3. **401 Unauthorized:** Redirect to login, clear auth state
4. **403 Forbidden:** Show "Access denied" message
5. **404 Not Found:** Show "Not found" message
6. **500 Server Error:** Show generic error message

---

## Acceptance Criteria

### Backend

- [ ] Default portfolio created on user registration
- [ ] All portfolio CRUD routes working
- [ ] All holdings CRUD routes working
- [ ] Ownership checks prevent unauthorized access
- [ ] Integration tests pass (80%+ coverage)
- [ ] Manual testing with curl/Postman successful

### Frontend

- [ ] Dashboard layout with navigation renders
- [ ] Portfolio page displays holdings
- [ ] Add holding form validates and submits
- [ ] Edit holding form pre-fills and updates
- [ ] Delete holding works with confirmation
- [ ] Empty state shows helpful message
- [ ] Component tests pass (60%+ coverage)
- [ ] Manual testing in browser successful

### End-to-End

- [ ] User can register → default portfolio created
- [ ] User can add holding → appears in list
- [ ] User can edit holding → changes reflected
- [ ] User can delete holding → removed from list
- [ ] Auth protects all routes correctly

---

## Future Enhancements (Post-MVP)

1. **Multiple Portfolios:**
   - Add "Create Portfolio" button in UI
   - Portfolio switcher/selector
   - Different portfolios for different strategies

2. **Bulk Operations:**
   - Import holdings from CSV
   - Export portfolio to CSV/PDF
   - Bulk edit/delete

3. **Portfolio Analytics:**
   - Total value (needs price data from Phase 2B)
   - Performance charts
   - Asset allocation pie chart
   - P&L calculations

4. **Advanced Holdings:**
   - Transaction history (buy/sell records)
   - Cost basis tracking
   - Realized vs unrealized gains
   - Tax reporting

5. **Search & Filter:**
   - Search holdings by symbol
   - Filter by asset type
   - Sort by various columns

---

## Dependencies

### Backend
- `@tradescope/database` (existing)
- `@tradescope/shared-types` (existing)
- `express` (existing)
- `prisma` (existing)
- `jsonwebtoken` (existing)
- `zod` (add for validation)

### Frontend
- `react` (existing)
- `next` (existing)
- `zustand` (existing)
- `axios` (existing)
- `react-hook-form` (existing)
- `@hookform/resolvers` (existing)
- `zod` (existing)
- `@radix-ui/*` (for shadcn/ui components)
- `sonner` (for toast notifications - add)

---

## Risks & Mitigations

### Risk: Price Data Coupling
**Problem:** UI shows null for currentPrice, totalValue, P&L - might confuse users.  
**Mitigation:** Show clear placeholder text: "Live prices coming in Phase 2B" or just hide these columns for now.

### Risk: Single Portfolio Limitation
**Problem:** Users might want multiple portfolios immediately.  
**Mitigation:** Backend already supports it. If users request it, adding UI for multiple portfolios is straightforward.

### Risk: Test Data Cleanup
**Problem:** Integration tests might leave test data in database.  
**Mitigation:** Use test database with cleanup in afterEach hooks. Add `NODE_ENV=test` check.

---

## Conclusion

Phase 2A delivers the core portfolio and holdings management functionality. Users can register, automatically receive a portfolio, and manage their investments. This phase provides a solid foundation for Phase 2B (market data) and Phase 2C (real-time updates).

**Estimated Timeline:**
- Backend: 2-3 days
- Frontend: 2-3 days  
- Testing & Bug Fixes: 1 day
- **Total: 5-7 days**

**Next Steps:**
1. Review and approve this spec
2. Create implementation plan
3. Begin Phase 1: Backend implementation
4. Create PR #1 for backend
5. Begin Phase 2: Frontend implementation
6. Create PR #2 for frontend
7. Merge both PRs when complete
8. Move to Phase 2B: Market Data Infrastructure
