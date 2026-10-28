export type Role = 'ADMIN' | 'SALES_REP' | 'DISTRIBUTOR';

export interface User {
  id: number;
  organizationId: number;
  organizationName?: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
  lastLoginAt?: string;
  createdAt: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  businessType?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface Territory {
  id: number;
  organizationId: number;
  name: string;
  description?: string;
  region?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface Distributor {
  id: number;
  organizationId: number;
  userId?: number;
  userEmail?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  territoryId?: number;
  territoryName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface Retailer {
  id: number;
  organizationId: number;
  businessName: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  territoryId?: number;
  territoryName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  assignedSalesRepIds?: number[];
  assignedSalesRepNames?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  organizationId: number;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  basePrice: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: number;
  organizationId: number;
  productId: number;
  productName: string;
  productSku: string;
  productCategory?: string;
  distributorId?: number;
  distributorName?: string;
  quantity: number;
  lowStockThreshold: number;
  lowStock: boolean;
  version: number;
  updatedAt: string;
}

export interface InventoryMovement {
  id: number;
  organizationId: number;
  inventoryId: number;
  productId: number;
  productName: string;
  productSku: string;
  movementType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'ORDER_RESERVE' | 'ORDER_RELEASE' | 'ORDER_DEDUCT';
  previousQuantity: number;
  quantityChange: number;
  resultingQuantity: number;
  reason?: string;
  referenceType?: string;
  referenceId?: number;
  actorId?: number;
  actorName?: string;
  createdAt: string;
}

export type OrderStatus = 'CREATED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'REJECTED' | 'CANCELLED';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  organizationId: number;
  orderNumber: string;
  retailerId: number;
  retailerName: string;
  salesRepId: number;
  salesRepName: string;
  distributorId?: number;
  distributorName?: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  rejectionReason?: string;
  version: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export type VisitStatus = 'PLANNED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';

export interface Visit {
  id: number;
  organizationId: number;
  retailerId: number;
  retailerName: string;
  userId: number;
  userName: string;
  status: VisitStatus;
  checkInTime?: string;
  checkOutTime?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  id: number;
  organizationId: number;
  type: 'LOW_STOCK' | 'DECLINING_ORDERS' | 'UNVISITED_RETAILER' | 'REORDER_SUGGESTION' | 'FREQUENTLY_BOUGHT_TOGETHER';
  title: string;
  description: string;
  entityType?: string;
  entityId?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'DISMISSED' | 'COMPLETED';
  suggestedAction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TopProductMetric {
  productId: number;
  productName: string;
  productSku: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface DailySalesMetric {
  date: string;
  orderCount: number;
  revenue: number;
}

export interface DashboardAnalytics {
  totalOrders: number;
  totalRevenue: number;
  deliveredRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  activeRetailers: number;
  totalProducts: number;
  lowStockCount: number;
  ordersByStatus: Record<string, number>;
  topSellingProducts: TopProductMetric[];
  recentSalesTrend: DailySalesMetric[];
}

export interface AuditLog {
  id: number;
  organizationId: number;
  userId?: number;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
  correlationId?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
