-- V1__initial_schema.sql
-- RetailFlow AI - Initial Database Schema
-- Creates: organizations, users, roles, territories, retailers, distributors, products, inventory

-- ============================================
-- ORGANIZATIONS
-- ============================================
CREATE TABLE organizations (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    business_type   VARCHAR(100),
    address         TEXT,
    phone           VARCHAR(50),
    email           VARCHAR(255),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(50),
    role            VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN', 'SALES_REP', 'DISTRIBUTOR')),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, email)
);

CREATE INDEX idx_users_org_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================
-- TERRITORIES
-- ============================================
CREATE TABLE territories (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    region          VARCHAR(255),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

CREATE INDEX idx_territories_org_id ON territories(organization_id);
CREATE INDEX idx_territories_status ON territories(status);

-- ============================================
-- TERRITORY ASSIGNMENTS (sales rep to territory)
-- ============================================
CREATE TABLE territory_assignments (
    id              BIGSERIAL PRIMARY KEY,
    territory_id    BIGINT NOT NULL REFERENCES territories(id),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    assigned_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (territory_id, user_id)
);

CREATE INDEX idx_territory_assignments_user ON territory_assignments(user_id);

-- ============================================
-- DISTRIBUTORS
-- ============================================
CREATE TABLE distributors (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    user_id         BIGINT REFERENCES users(id),
    name            VARCHAR(255) NOT NULL,
    contact_person  VARCHAR(255),
    phone           VARCHAR(50),
    email           VARCHAR(255),
    address         TEXT,
    territory_id    BIGINT REFERENCES territories(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_distributors_org_id ON distributors(organization_id);
CREATE INDEX idx_distributors_user_id ON distributors(user_id);
CREATE INDEX idx_distributors_territory ON distributors(territory_id);
CREATE INDEX idx_distributors_status ON distributors(status);

-- ============================================
-- RETAILERS
-- ============================================
CREATE TABLE retailers (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    business_name   VARCHAR(255) NOT NULL,
    owner_name      VARCHAR(255),
    phone           VARCHAR(50),
    email           VARCHAR(255),
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    postal_code     VARCHAR(20),
    territory_id    BIGINT REFERENCES territories(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_retailers_org_id ON retailers(organization_id);
CREATE INDEX idx_retailers_territory ON retailers(territory_id);
CREATE INDEX idx_retailers_status ON retailers(status);
CREATE INDEX idx_retailers_business_name ON retailers(business_name);

-- ============================================
-- RETAILER ASSIGNMENTS (sales rep to retailer)
-- ============================================
CREATE TABLE retailer_assignments (
    id              BIGSERIAL PRIMARY KEY,
    retailer_id     BIGINT NOT NULL REFERENCES retailers(id),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    assigned_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (retailer_id, user_id)
);

CREATE INDEX idx_retailer_assignments_user ON retailer_assignments(user_id);
CREATE INDEX idx_retailer_assignments_retailer ON retailer_assignments(retailer_id);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    sku             VARCHAR(100) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    category        VARCHAR(100),
    unit            VARCHAR(50) NOT NULL DEFAULT 'PIECE',
    base_price      NUMERIC(12,2) NOT NULL CHECK (base_price > 0),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, sku)
);

CREATE INDEX idx_products_org_id ON products(organization_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);

-- ============================================
-- INVENTORY
-- ============================================
CREATE TABLE inventory (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    product_id      BIGINT NOT NULL REFERENCES products(id),
    distributor_id  BIGINT REFERENCES distributors(id),
    quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    version         INTEGER NOT NULL DEFAULT 0,
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, distributor_id)
);

CREATE INDEX idx_inventory_org_id ON inventory(organization_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_distributor ON inventory(distributor_id);

-- ============================================
-- INVENTORY MOVEMENTS
-- ============================================
CREATE TABLE inventory_movements (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    inventory_id    BIGINT NOT NULL REFERENCES inventory(id),
    product_id      BIGINT NOT NULL REFERENCES products(id),
    movement_type   VARCHAR(30) NOT NULL CHECK (movement_type IN ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'ORDER_RESERVE', 'ORDER_RELEASE', 'ORDER_DEDUCT')),
    previous_quantity INTEGER NOT NULL,
    quantity_change INTEGER NOT NULL,
    resulting_quantity INTEGER NOT NULL,
    reason          TEXT,
    reference_type  VARCHAR(50),
    reference_id    BIGINT,
    actor_id        BIGINT REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_movements_org_id ON inventory_movements(organization_id);
CREATE INDEX idx_inv_movements_inventory ON inventory_movements(inventory_id);
CREATE INDEX idx_inv_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inv_movements_created ON inventory_movements(created_at);

-- ============================================
-- VISITS
-- ============================================
CREATE TABLE visits (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    retailer_id     BIGINT NOT NULL REFERENCES retailers(id),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    status          VARCHAR(30) NOT NULL DEFAULT 'CHECKED_IN' CHECK (status IN ('PLANNED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED')),
    check_in_time   TIMESTAMP,
    check_out_time  TIMESTAMP,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    notes           TEXT,
    outcome         VARCHAR(50),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visits_org_id ON visits(organization_id);
CREATE INDEX idx_visits_retailer ON visits(retailer_id);
CREATE INDEX idx_visits_user ON visits(user_id);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_check_in ON visits(check_in_time);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    order_number    VARCHAR(50) NOT NULL,
    retailer_id     BIGINT NOT NULL REFERENCES retailers(id),
    sales_rep_id    BIGINT NOT NULL REFERENCES users(id),
    distributor_id  BIGINT REFERENCES distributors(id),
    status          VARCHAR(30) NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'REJECTED', 'CANCELLED')),
    subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
    notes           TEXT,
    rejection_reason TEXT,
    version         INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, order_number)
);

CREATE INDEX idx_orders_org_id ON orders(organization_id);
CREATE INDEX idx_orders_retailer ON orders(retailer_id);
CREATE INDEX idx_orders_sales_rep ON orders(sales_rep_id);
CREATE INDEX idx_orders_distributor ON orders(distributor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      BIGINT NOT NULL REFERENCES products(id),
    product_name    VARCHAR(255) NOT NULL,
    product_sku     VARCHAR(100) NOT NULL,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    subtotal        NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================
-- IDEMPOTENCY RECORDS
-- ============================================
CREATE TABLE idempotency_records (
    id              BIGSERIAL PRIMARY KEY,
    idempotency_key VARCHAR(255) NOT NULL,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    operation       VARCHAR(100) NOT NULL,
    request_hash    VARCHAR(64),
    response_status INTEGER,
    response_body   TEXT,
    reference_id    BIGINT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMP NOT NULL,
    UNIQUE (idempotency_key, organization_id, operation)
);

CREATE INDEX idx_idempotency_key ON idempotency_records(idempotency_key, organization_id);
CREATE INDEX idx_idempotency_expires ON idempotency_records(expires_at);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    user_id         BIGINT REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(100) NOT NULL,
    entity_id       BIGINT,
    details         TEXT,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================
-- RECOMMENDATIONS
-- ============================================
CREATE TABLE recommendations (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    type            VARCHAR(50) NOT NULL CHECK (type IN ('LOW_STOCK', 'DECLINING_ORDERS', 'UNVISITED_RETAILER', 'REORDER_SUGGESTION', 'FREQUENTLY_BOUGHT_TOGETHER')),
    title           VARCHAR(255) NOT NULL,
    description     TEXT NOT NULL,
    entity_type     VARCHAR(50),
    entity_id       BIGINT,
    priority        VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status          VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISMISSED', 'COMPLETED')),
    metrics         JSONB,
    suggested_action TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recommendations_org_id ON recommendations(organization_id);
CREATE INDEX idx_recommendations_type ON recommendations(type);
CREATE INDEX idx_recommendations_status ON recommendations(status);
CREATE INDEX idx_recommendations_priority ON recommendations(priority);
