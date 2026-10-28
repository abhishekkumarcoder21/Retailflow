# RetailFlow AI — Implementation Plan

## Environment Assessment

| Tool | Version | Status |
|------|---------|--------|
| Java | OpenJDK 17.0.14 LTS | ✅ Available (using Java 17 instead of 21) |
| Maven | Not installed system-wide | ⚠️ Will use Maven Wrapper (mvnw) |
| Node.js | 22.14.0 | ✅ Available |
| npm | 11.11.0 | ✅ Available |
| Docker | 29.8.0 | ✅ Available |
| Docker Compose | 5.5.1 | ✅ Available |
| Git | 2.46.2 | ✅ Available |
| PostgreSQL | Via Docker | ✅ Via Docker Compose |

### Decision: Java 17 vs Java 21

The system has Java 17 LTS installed. Spring Boot 3.x is fully compatible with Java 17+. We will target Java 17 as the minimum and use Spring Boot 3.2.x which supports Java 17-21. This is a safe, well-supported choice for a portfolio project.

---

## Architecture Overview

### Architecture Style: Modular Layered Monolith

```
┌─────────────────────────────────────────────────┐
│                  Next.js Frontend                │
│         (App Router, TypeScript, Tailwind)        │
├─────────────────────────────────────────────────┤
│                   REST API (JSON)                 │
├─────────────────────────────────────────────────┤
│              Spring Boot Backend                  │
│  ┌───────────┬──────────┬───────────────────┐    │
│  │Controllers│ Services │   Repositories    │    │
│  │  (thin)   │ (logic)  │   (Spring Data)   │    │
│  └───────────┴──────────┴───────────────────┘    │
│  ┌───────────┬──────────┬───────────────────┐    │
│  │  Security │   DTOs   │    Validation     │    │
│  └───────────┴──────────┴───────────────────┘    │
├─────────────────────────────────────────────────┤
│              PostgreSQL Database                  │
│           (Flyway Migrations)                     │
└─────────────────────────────────────────────────┘
```

### Multi-Tenancy Model: Shared Database, Shared Schema, Discriminator Column

All entities include an `organization_id` foreign key. A base service/repository pattern filters by the authenticated user's organization. This is the simplest model for a single-database monolith and avoids schema-per-tenant complexity.

### Authentication: JWT in HttpOnly Cookies

- Login returns a JWT in an HttpOnly, Secure, SameSite=Lax cookie
- CSRF protection via double-submit cookie pattern
- Stateless backend (no server-side sessions)
- Token refresh via a refresh endpoint
- Logout clears the cookie

---

## Database Schema (ER Overview)

Core entities and relationships:

```
Organization ──┬── User (with roles)
               ├── Territory
               ├── Retailer ──── RetailerAssignment
               ├── Distributor
               ├── Product
               ├── Inventory ──── InventoryMovement
               ├── Visit
               ├── Order ──── OrderItem
               ├── AuditLog
               ├── Recommendation
               └── IdempotencyRecord
```

---

## Implementation Phases & Task Checklist

### Phase 1: Project Setup ☑
- [x] Inspect workspace & assess tools
- [x] Create implementation plan
- [x] Initialize Spring Boot backend with Maven Wrapper
- [x] Initialize Next.js frontend
- [x] Create Docker Compose (PostgreSQL)
- [x] Create .env.example files
- [x] Create .gitignore
- [x] Verify both apps build & start

### Phase 2: Backend Foundation ☑
- [x] Configure PostgreSQL datasource
- [x] Configure Flyway
- [x] Create initial migration (organizations, users, roles)
- [x] Implement global exception handler
- [x] Implement consistent API response format
- [x] Implement JWT authentication (login/logout/me)
- [x] Implement RBAC (ADMIN, SALES_REP, DISTRIBUTOR)
- [x] Implement organization isolation base pattern
- [x] Add Spring Boot Actuator
- [x] OpenAPI/Swagger configuration
- [x] Write foundational auth tests
- [x] Verify build & tests pass

### Phase 3: Core Business Entities ☑
- [x] Territory entity, migration, CRUD API
- [x] Retailer entity, migration, CRUD API
- [x] RetailerAssignment entity & API
- [x] Distributor entity, migration, CRUD API
- [x] Product entity, migration, CRUD API
- [x] Inventory entity, migration, CRUD API
- [x] InventoryMovement entity & tracking
- [x] Unit tests for each module
- [x] Integration tests for repository/service layers

### Phase 4: Visit & Order Management ☑
- [x] Visit entity, migration, check-in/complete API
- [x] Order entity, migration, order lifecycle API
- [x] OrderItem entity
- [x] Order state machine (CREATED→CONFIRMED→PROCESSING→SHIPPED→DELIVERED)
- [x] Server-side price calculation
- [x] Inventory validation & deduction
- [x] Idempotency for order creation
- [x] Optimistic locking for inventory
- [x] Comprehensive order tests
- [x] Inventory consistency tests

### Phase 5: Analytics & Recommendations ☑
- [x] Analytics service (aggregation queries)
- [x] Analytics API endpoints
- [x] Rule-based recommendation engine
- [x] Recommendation API endpoints
- [x] AuditLog entity & service
- [x] Tests for analytics & recommendations

### Phase 6: Frontend Implementation ☑
- [x] Design system (Tailwind config, custom tokens, glassmorphism)
- [x] Layout components (sidebar, topbar, dashboard shell)
- [x] Auth pages (login with 1-click accounts, registration)
- [x] API client with typed models
- [x] Dashboard page (live KPIs, trends, order status pipeline, velocity SKUs)
- [x] Retailer management pages (CRUD, territories, sales rep assignment)
- [x] Territory management page (CRUD, coverage areas)
- [x] Product management pages (SKUs, packaging units, wholesale pricing)
- [x] Inventory management pages (stock levels, low stock alerts, movement ledger)
- [x] Order management pages (state machine, line item builder, idempotency)
- [x] Visit management pages (GPS store check-in, outcome logger)
- [x] Recommendations page (AI rule evaluation, action items)
- [x] User management page (team directory, RBAC provisioning)
- [x] Organization settings page (tenant profile, health diagnostics, audit logs)
- [x] Public landing page (features, live demo sandbox launcher)

### Phase 7: QA Automation ☑
- [x] Backend unit tests (order calculations, state transitions)
- [x] Backend integration tests (auth, order lifecycle, idempotency replay)
- [x] Inventory concurrency & optimistic locking tests
- [x] Frontend production build verification (17/17 routes compiled)

### Phase 8: Production Readiness ☑
- [x] Security review (JWT HttpOnly cookies, RBAC, org isolation)
- [x] Deterministic demo data seeder (Admin, Sales Rep, Distributor)
- [x] Documentation (comprehensive README with architecture & API guide)
- [x] Dockerfiles for backend & frontend
- [x] Docker Compose with PostgreSQL 16
- [x] Final build verification (all tests green)

---

## Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Java 17 vs 21 | Low — Spring Boot 3.2.x works fine with 17 | Use Java 17 features only |
| No system Maven | Low | Maven Wrapper included in project |
| Testcontainers + Docker on Windows | Medium | Verify Docker is running, use fallback H2 for unit tests |
| JWT cookie auth + CSRF | Medium | Implement double-submit cookie pattern |
| Inventory concurrency | High | Use optimistic locking + database constraints |
| Large scope | High | Prioritize core workflow, defer polish |

---

## Key Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Java 17 target | System has Java 17; Spring Boot 3.2.x fully supports it |
| 2 | Maven Wrapper | No system Maven; mvnw is self-contained |
| 3 | JWT in HttpOnly cookie | Secure, stateless, CSRF-protected |
| 4 | Shared schema multi-tenancy | Simplest for monolith; org_id discriminator |
| 5 | Optimistic locking for inventory | Balance of simplicity and correctness |
| 6 | Spring Boot 3.2.x | Latest stable with Java 17 support |
| 7 | Flyway for migrations | Explicit, versioned schema management |
| 8 | BigDecimal for money | No floating-point rounding errors |

---

## Implementation Order Priority

The acceptance criteria require an end-to-end working workflow. Implementation will focus on the critical path first:

1. **Auth + Org isolation** — everything depends on this
2. **Products + Inventory** — needed for orders
3. **Retailers + Territories** — needed for orders
4. **Orders** — the core business workflow
5. **Visits** — sales rep workflow
6. **Analytics + Recommendations** — dashboard data
7. **Frontend** — connected to real backend
8. **Tests** — built alongside, formalized at end
9. **Documentation** — maintained throughout

---

*Plan created: 2026-10-27*
*Status: Completed — All Phases 1-8 Production-Ready*
