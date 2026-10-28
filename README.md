# RetailFlow AI — Intelligent Retail Sales & Distribution Platform

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.12-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17%20LTS-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2%20App%20Router-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**RetailFlow AI** is an enterprise-grade distribution execution platform that bridges brand manufacturers, wholesale distributors, retail stores, and mobile field sales representatives. Built with high-performance Java 17 / Spring Boot 3.2 and a Next.js 14 App Router dark-mode interface, RetailFlow AI eliminates over-allocation risks, automates geocoded field visits, and delivers real-time AI replenishment recommendations.

---

## 🏛️ Architecture Overview

RetailFlow AI uses a **Modular Layered Monolith** architecture with strict multi-tenant isolation, ensuring sub-15ms transaction execution without distributed overhead.

```
┌─────────────────────────────────────────────────────────────┐
│              Next.js 14 Frontend (App Router)               │
│  TailwindCSS • Lucide Icons • Glassmorphism UI • TypeScript │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON (JWT HttpOnly)
┌──────────────────────────────▼──────────────────────────────┐
│                  Spring Boot 3.2 API Layer                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Security: JWT Filter • Cookie Extraction • RBAC       │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ Controllers: Auth • Orders • Inventory • Visits • AI  │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ Domain Services: Optimistic Locks • State Machine     │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ Persistence: Spring Data JPA • Flyway Migrations      │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ JDBC (HikariCP)
┌──────────────────────────────▼──────────────────────────────┐
│                    PostgreSQL 16 Engine                     │
│    (Tenant Partitioning by organization_id Discriminator)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Functional Capabilities

### 1. Multi-Tenant Enterprise Data Isolation
- **Shared Database, Shared Schema, Discriminator Column**: All domain tables enforce foreign keys to `organization_id`.
- **Security Context Filtering**: Repositories and service logic automatically scope queries to the authenticated tenant.

### 2. Optimistic Concurrency Control for Inventory
- Zero stock over-allocation guaranteed via JPA versioning (`@Version private Long version;`).
- High-concurrency warehouse movements automatically log to the immutable `InventoryMovement` ledger.

### 3. Idempotent Order Finite State Machine
- Strict state transitions:
  $$\text{CREATED} \longrightarrow \text{CONFIRMED} \longrightarrow \text{PROCESSING} \longrightarrow \text{SHIPPED} \longrightarrow \text{DELIVERED}$$
- Rejections and cancellations cleanly release or reverse inventory commitments.
- Prevents double billing using client-generated `Idempotency-Key` headers stored in an atomic replay table.

### 4. GPS-Verified Field Sales Visits
- Mobile field representatives record physical store check-ins capturing browser geolocation coordinates (latitude/longitude) and timestamps.
- Visit logs link directly to retailer accounts and outcomes (e.g. *Order Taken*, *Inventory Verified*, *Follow-up Scheduled*).

### 5. Deterministic AI Insights & Recommendations Engine
- Automated heuristic analysis evaluating:
  - **LOW_STOCK**: Stock below reorder safety thresholds.
  - **DECLINING_ORDERS**: Stores with decreasing order frequency.
  - **UNVISITED_RETAILER**: Licensed accounts not serviced within designated cadence.
  - **REORDER_SUGGESTION**: Predicts upcoming stock depletion based on sales velocity.
  - **FREQUENTLY_BOUGHT_TOGETHER**: Basket analysis identifying SKU bundles.

---

## 🔑 Pre-Seeded Demo Accounts

The system automatically initializes deterministic seed data on startup. You can sign in immediately using any of these roles:

| Role | Email Address | Password | Capabilities |
|------|---------------|----------|--------------|
| **HQ Admin** | `admin@retailflow.com` | `Password123!` | Full enterprise control: master SKUs, warehouse allocations, user RBAC, audit trail |
| **Sales Rep** | `sales.rep@retailflow.com` | `Password123!` | Field territory execution: geocoded check-ins, new sales order placement |
| **Distributor** | `distributor@retailflow.com` | `Password123!` | Fulfillment & logistics: warehouse stock adjustments, shipments, dispatch |

---

## 💻 Quickstart: Running Locally

### Prerequisites
- **Java 17+** (OpenJDK 17 recommended)
- **Node.js 18+** (Node 22 LTS recommended)
- **Git**

### 1. Start the Backend API

```bash
# Navigate to backend directory
cd backend

# Option A: Run using default H2 in-memory database (Zero external DB needed!)
./mvnw spring-boot:run -Dspring-boot.run.profiles=h2

# Option B: Run with PostgreSQL (after starting PostgreSQL on localhost:5432)
./mvnw spring-boot:run
```
The backend starts on `http://localhost:8080`.
- Swagger / OpenAPI UI: `http://localhost:8080/swagger-ui/index.html`
- Actuator Health Check: `http://localhost:8080/actuator/health`

### 2. Start the Frontend Dashboard

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Next.js development server
npm run dev
```
The web dashboard opens on `http://localhost:3000`.

---

## 🐳 Running via Docker Compose

To deploy the entire production stack (PostgreSQL 16, Spring Boot API, Next.js Web App):

```bash
# Build and run containers
docker-compose up --build
```

- **Frontend Dashboard**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:8080`
- **PostgreSQL Database**: `localhost:5432`

---

## 🧪 Automated Testing & Verification

The backend includes comprehensive unit and integration test suites:

```bash
cd backend

# Run all test suites
./mvnw test "-Dspring.profiles.active=test"
```

### Verified Test Suites:
- `AuthControllerIntegrationTest`: Authentication, JWT issuance, HttpOnly cookie lifecycle.
- `OrderApiIntegrationTest`: Order creation with server-side pricing and idempotent replay verification.
- `OrderStateMachineTest`: State transition validation and invalid transition rejection.
- `OrderCalculationTest`: Exact currency calculations with zero floating-point drift.
- `InventoryServiceTest`: Concurrent inventory adjustments and low-stock triggers.
- `JwtServiceTest`: Token signature verification, claim extraction, and expiration enforcement.

### Frontend Production Build Verification:
```bash
cd frontend

# Verify TypeScript compilation and static page generation
npm run build
```
Generates 17 production pages across `/`, `/login`, `/register`, `/dashboard`, `/dashboard/orders`, `/dashboard/retailers`, `/dashboard/products`, `/dashboard/inventory`, `/dashboard/visits`, `/dashboard/territories`, `/dashboard/distributors`, `/dashboard/recommendations`, `/dashboard/users`, and `/dashboard/settings`.

---

## 📋 REST API Reference

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/api/v1/auth/login` | `POST` | Public | Authenticates credentials and sets secure JWT cookie |
| `/api/v1/auth/register` | `POST` | Public | Registers a new enterprise organization and admin |
| `/api/v1/auth/me` | `GET` | Authenticated | Fetches current user profile and organization metadata |
| `/api/v1/analytics/dashboard` | `GET` | Authenticated | Live KPIs, revenue totals, top SKUs, and sales trend |
| `/api/v1/orders` | `GET` | Authenticated | Paginated sales orders with status/distributor filtering |
| `/api/v1/orders` | `POST` | Admin / Sales Rep | Creates order with server pricing and inventory deduction |
| `/api/v1/orders/{id}/status` | `PATCH` | Authenticated | Advances order state machine (Confirmed, Shipped, etc.) |
| `/api/v1/retailers` | `GET` / `POST` | Authenticated | Retail store directory & new store creation |
| `/api/v1/retailers/{id}/assign/{userId}` | `POST` | Admin | Assigns field sales representative to store |
| `/api/v1/products` | `GET` / `POST` | Authenticated | Master SKU catalog management |
| `/api/v1/inventory` | `GET` | Authenticated | Stock levels with low-stock filter |
| `/api/v1/inventory/adjust` | `POST` | Admin / Distributor | Adjusts warehouse inventory stock with audit record |
| `/api/v1/inventory/movements` | `GET` | Authenticated | Immutable inventory movement audit ledger |
| `/api/v1/visits/check-in` | `POST` | Admin / Sales Rep | Records store visit with geocoded GPS coordinates |
| `/api/v1/visits/{id}/complete` | `POST` | Admin / Sales Rep | Records visit outcome and notes |
| `/api/v1/recommendations` | `GET` | Authenticated | Active AI sales & stock recommendations |
| `/api/v1/recommendations/refresh` | `POST` | Authenticated | Triggers rule evaluation to regenerate insights |
| `/api/v1/users` | `GET` / `POST` | Admin | Team management and role assignment |
| `/api/v1/organizations/current` | `GET` / `PUT` | Authenticated / Admin | Organization profile settings |
| `/api/v1/audit-logs` | `GET` | Admin | Security and mutation audit logs |

---

## 📄 License & Maintainer

Developed for the **RetailFlow AI** platform. Released under the MIT License.
#   R e t a i l f l o w  
 