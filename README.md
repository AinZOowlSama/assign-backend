# Finance Dashboard — Backend API

A role-based finance dashboard backend built with **Hono**, **Prisma**, and **Turborepo**.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Monorepo | Turborepo | Task orchestration, shared package caching |
| Framework | Hono (Node adapter) | Lightweight, typed middleware, great DX |
| ORM | Prisma | Type-safe queries, easy migrations, great DX |
| Database | Postgresql(neon) | 
| Validation | Zod | Composable schemas, inferred TypeScript types |
| Auth | JWT (jsonwebtoken) | Stateless, role embedded — no DB call per request |
| Password hashing | bcryptjs | Industry standard |

---

## Project Structure

```
finance-dashboard/
├── apps/
│   └── api/                  ← Hono API application
│       └── src/
│           ├── index.ts       ← App entry, middleware, route registration
│           ├── middleware/
│           │   ├── auth.ts    ← JWT verification, attaches user to context
│           │   ├── rbac.ts    ← Role-based access control guard
│           │   ├── validate.ts← Zod body/query validation middleware
│           │   └── errorHandler.ts ← Global error handler + AppError class
│           ├── routes/
│           │   ├── auth.ts    ← POST /register, POST /login, GET /me
│           │   ├── users.ts   ← User management (Admin only)
│           │   ├── records.ts ← Financial records CRUD
│           │   └── dashboard.ts ← Analytics and summary endpoints
│           └── services/
│               ├── authService.ts      ← Register, login, token generation
│               ├── userService.ts      ← User CRUD
│               ├── recordService.ts    ← Financial record CRUD + filtering
│               └── dashboardService.ts ← All aggregation/analytics logic
│
└── packages/
    ├── db/                   ← Prisma schema, client singleton, seed
    ├── validators/           ← Zod schemas (shared, used by API)
    └── types/                ← Enums, interfaces (shared across all packages)
```

---

## API Documentation
Interactive Swagger docs: http://localhost:3000/docs

1. Use POST /api/auth/login with test credentials
2. Copy the token from the response  
3. Click Authorize and paste the token
4. All endpoints are now testable directly in the browser

Test credentials (password: Password123):
- Admin:   admin@finance.dev
- Analyst: analyst@finance.dev  
- Viewer:  viewer@finance.dev

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 9+

```bash
# Install pnpm if you don't have it
npm install -g pnpm
```

### 1. Install dependencies
```bash
pnpm install
```

### 2. Set up environment
```bash
cp apps/api/.env.example apps/api/.env

```
### 3. Generate prisma client
```bash
pnpm db:generate

```

### 4. Run database migrations
```bash
pnpm db:migrate
```

### 5. Seed the database
```bash
pnpm db:seed
```

### 6. Start the dev server
```bash
pnpm dev
```

API is now running at **http://localhost:3000**

---

## Test Credentials (after seeding)

All accounts use password: `Password123`

| Role    | Email                   |
|---------|-------------------------|
| Admin   | admin@finance.dev       |
| Analyst | analyst@finance.dev     |
| Viewer  | viewer@finance.dev      |

---

## Role Permission Matrix

| Action                      | Viewer | Analyst | Admin |
|-----------------------------|--------|---------|-------|
| View financial records      | ✅     | ✅      | ✅    |
| View dashboard analytics    | ✅     | ✅      | ✅    |
| Create financial records    | ❌     | ✅      | ✅    |
| Update financial records    | ❌     | ❌      | ✅    |
| Delete financial records    | ❌     | ❌      | ✅    |
| View all users              | ❌     | ❌      | ✅    |
| Update user roles/status    | ❌     | ❌      | ✅    |
| Deactivate users            | ❌     | ❌      | ✅    |

---

## API Reference

All endpoints return one of two shapes:

```json
// Success
{ "success": true, "data": { ... }, "message": "optional" }

// Error
{ "success": false, "error": "description", "details": [...] }
```

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register a new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user from token |

**Register**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "John Doe",
  "role": "VIEWER"   // optional, defaults to VIEWER
}
```

**Login**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "Password123"
}
// Response includes: { user: {...}, token: "eyJ..." }
```

All subsequent requests need the header:
```
Authorization: Bearer <token>
```

---

### Users (Admin only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/profile` | Own profile (all roles) |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id` | Update name, role, or status |
| DELETE | `/api/users/:id` | Deactivate user |

**Update User**
```json
PATCH /api/users/:id
{
  "role": "ANALYST",     // optional
  "status": "INACTIVE",  // optional
  "name": "New Name"     // optional
}
```

---

### Financial Records

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/records` | ALL | List with filters + pagination |
| GET | `/api/records/:id` | ALL | Single record |
| POST | `/api/records` | ADMIN, ANALYST | Create record |
| PATCH | `/api/records/:id` | ADMIN | Update record |
| DELETE | `/api/records/:id` | ADMIN | Soft delete record |

**Create Record**
```json
POST /api/records
{
  "amount": 85000,
  "type": "INCOME",
  "category": "Salary",
  "date": "2024-01-01",
  "notes": "January salary"  // optional
}
```

**Filter Records (query params)**
```
GET /api/records?type=EXPENSE&category=Rent&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=20
```

| Param | Type | Description |
|-------|------|-------------|
| type | INCOME \| EXPENSE | Filter by type |
| category | string | Partial match on category |
| startDate | ISO date | Records on or after |
| endDate | ISO date | Records on or before |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |

---

### Dashboard Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard` | Full dashboard (all data in one request) |
| GET | `/api/dashboard/summary` | Income, expenses, net balance |
| GET | `/api/dashboard/categories` | Totals grouped by category |
| GET | `/api/dashboard/trend` | Monthly income vs expense (last 12 months) |
| GET | `/api/dashboard/recent` | Recent transactions feed |

All dashboard endpoints accept optional `startDate` and `endDate` query params.

**Summary Response**
```json
{
  "success": true,
  "data": {
    "totalIncome": 100000,
    "totalExpenses": 27500,
    "netBalance": 72500,
    "totalTransactions": 8
  }
}
```

**Monthly Trend Response**
```json
{
  "success": true,
  "data": [
    { "month": "2024-01", "income": 100000, "expenses": 17500, "net": 82500 },
    { "month": "2024-02", "income": 85000, "expenses": 20000, "net": 65000 }
  ]
}
```

---

## Design Decisions & Assumptions

### Authentication
- **JWT is stateless** — the role is embedded in the token payload. The RBAC middleware reads `c.get('user').role` without any DB lookup on every request.
- Token expiry is 7 days. If a user's role changes, their old token remains valid until expiry. For higher-security needs, a token revocation list (e.g. Redis) can be added.

### Role Design
- `VIEWER` — read-only access to records and dashboard. Useful for stakeholders who need visibility but should not modify data.
- `ANALYST` — can create records (data entry) but cannot modify or delete. This prevents analysts from covering up mistakes.
- `ADMIN` — full access including user management.

### Soft Deletes
- Financial records are **never hard deleted**. The `isDeleted` flag hides them from normal queries but preserves the data for audits.
- Users are deactivated (status = INACTIVE) rather than deleted — their records still reference them.

### Error Handling
- A global `errorHandler` on `app.onError` catches all errors.
- Prisma error codes (P2002 duplicate, P2025 not found, etc.) are mapped to appropriate HTTP responses.
- A custom `AppError` class lets services throw with explicit status codes.
- Production mode hides internal error messages from responses.

### Database
- SQLite is used for local development — zero setup, file-based.
- Switching to PostgreSQL requires only changing `provider` in `schema.prisma` and updating `DATABASE_URL`. No application code changes.
- Indexes are defined on `type`, `category`, `date`, and `isDeleted` — the most common filter fields.

### Pagination
- All list endpoints are paginated (default page size: 20, max: 100).
- Count and data queries run in parallel with `Promise.all` to avoid sequential round-trips.

### Monthly Trend Query
- Prisma's `groupBy` does not support grouping by derived date parts (e.g. year-month).
- `$queryRaw` is used for the monthly trend — this is the correct approach, not a workaround.
- The SQLite `strftime` function is used. For PostgreSQL, replace with `TO_CHAR(date, 'YYYY-MM')`.

---

## Switching to PostgreSQL

1. Update `packages/db/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update `apps/api/.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/finance_db"
```

3. Update the raw SQL in `dashboardService.ts`:
```sql
-- Replace strftime('%Y-%m', date) with:
TO_CHAR(date, 'YYYY-MM') AS month
-- And replace is_deleted = 0 with:
is_deleted = false
```

4. Run migrations:
```bash
pnpm db:migrate
```

---

## Useful Commands

```bash
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all packages
pnpm db:generate      # Regenerate Prisma client after schema changes
pnpm db:migrate       # Run pending migrations
pnpm db:studio        # Open Prisma Studio (visual DB browser)
pnpm db:seed          # Seed the database with test data
```
