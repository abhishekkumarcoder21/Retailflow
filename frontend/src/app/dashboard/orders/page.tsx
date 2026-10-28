'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { PageHeader, StatusBadge, Modal, Pagination } from '@/components/ui';
import { ordersApi, retailersApi, productsApi, distributorsApi } from '@/lib/api';
import { Order, Retailer, Product, Distributor, OrderStatus } from '@/types';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  AlertCircle,
  Trash2,
  Check,
} from 'lucide-react';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Orders', value: '' },
  { label: 'Created', value: 'CREATED' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<OrderStatus>('CONFIRMED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // New Order Form State
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedRetailerId, setSelectedRetailerId] = useState<number | ''>('');
  const [selectedDistributorId, setSelectedDistributorId] = useState<number | ''>('');
  const [orderItems, setOrderItems] = useState<{ productId: number; quantity: number }[]>([
    { productId: 0, quantity: 1 },
  ]);
  const [orderNotes, setOrderNotes] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        size: '10',
        sort: 'createdAt,desc',
      };
      if (selectedStatus) params.status = selectedStatus;

      const res = await ordersApi.list(params);
      if (res && res.content) {
        setOrders(res.content);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Load auxiliary data for Create Order
  const openCreateModal = async () => {
    setActionError(null);
    setCreateModalOpen(true);
    try {
      const [retRes, distRes, prodRes] = await Promise.all([
        retailersApi.list({ size: '100' }),
        distributorsApi.list({ size: '100' }),
        productsApi.active(),
      ]);

      if (retRes?.content) {
        setRetailers(retRes.content);
        if (retRes.content.length > 0) setSelectedRetailerId(retRes.content[0].id);
      }
      if (distRes?.content) {
        setDistributors(distRes.content);
      }
      if (Array.isArray(prodRes)) {
        setProducts(prodRes);
        if (prodRes.length > 0) {
          setOrderItems([{ productId: prodRes[0].id, quantity: 1 }]);
        }
      }
    } catch (err) {
      console.error('Failed to load auxiliary options:', err);
    }
  };

  const handleAddItem = () => {
    if (products.length > 0) {
      setOrderItems([...orderItems, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: number) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const calculateEstimate = () => {
    return orderItems.reduce((sum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      return sum + (prod ? prod.basePrice * (item.quantity || 1) : 0);
    }, 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRetailerId) return;

    try {
      setCreateSubmitting(true);
      setActionError(null);

      const idempotencyKey = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        retailerId: selectedRetailerId,
        distributorId: selectedDistributorId || undefined,
        items: orderItems.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
        })),
        notes: orderNotes || undefined,
      };

      await ordersApi.create(payload, idempotencyKey);
      setCreateModalOpen(false);
      setOrderNotes('');
      loadOrders();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to create order');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openStatusTransition = (order: Order, nextStatus: OrderStatus) => {
    setSelectedOrder(order);
    setStatusTarget(nextStatus);
    setRejectionReason('');
    setActionError(null);
    setStatusModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;

    try {
      setStatusSubmitting(true);
      setActionError(null);

      await ordersApi.updateStatus(selectedOrder.id, {
        status: statusTarget,
        rejectionReason: statusTarget === 'REJECTED' ? rejectionReason : undefined,
      });

      setStatusModalOpen(false);
      setSelectedOrder(null);
      loadOrders();
    } catch (err: any) {
      setActionError(err?.message || 'Status transition failed');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.retailerName?.toLowerCase().includes(q) ||
      o.salesRepName?.toLowerCase().includes(q)
    );
  });

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Order Management &amp; Fulfillment"
        subtitle="End-to-end sales orders lifecycle with optimistic stock reconciliation"
        actions={
          <button
            id="orders-create-btn"
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 text-sm shadow-brand-500/20"
          >
            <Plus size={16} />
            <span>Create New Order</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              id={`filter-status-${f.value || 'all'}`}
              onClick={() => {
                setSelectedStatus(f.value);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStatus === f.value
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                  : 'bg-surface/50 text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="orders-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, store, rep..."
            className="input-field pl-10 text-xs py-2"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-surface/40">
                <th className="text-left px-5 py-3.5">Order Number</th>
                <th className="text-left px-5 py-3.5">Retailer</th>
                <th className="text-left px-5 py-3.5">Sales Rep</th>
                <th className="text-center px-5 py-3.5">Items</th>
                <th className="text-right px-5 py-3.5">Total Amount</th>
                <th className="text-center px-5 py-3.5">Status</th>
                <th className="text-right px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/30">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="skeleton h-6 w-full rounded" />
                    </td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-medium text-brand-300 text-xs">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-200">
                      {order.retailerName}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">{order.salesRepName}</td>
                    <td className="px-5 py-4 text-xs text-center text-slate-300 font-mono">
                      {order.items?.length || 0}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono font-bold text-white text-right">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`order-view-${order.id}`}
                          onClick={() => setSelectedOrder(order)}
                          title="View Order Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-card transition-colors"
                        >
                          <Eye size={15} />
                        </button>

                        {/* State machine transition quick actions */}
                        {order.status === 'CREATED' && (
                          <>
                            <button
                              id={`order-confirm-${order.id}`}
                              onClick={() => openStatusTransition(order, 'CONFIRMED')}
                              title="Confirm Order"
                              className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 transition-colors"
                            >
                              <CheckCircle size={15} />
                            </button>
                            <button
                              id={`order-reject-${order.id}`}
                              onClick={() => openStatusTransition(order, 'REJECTED')}
                              title="Reject Order"
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-colors"
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        )}

                        {order.status === 'CONFIRMED' && (
                          <button
                            id={`order-process-${order.id}`}
                            onClick={() => openStatusTransition(order, 'PROCESSING')}
                            title="Start Processing"
                            className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/15 transition-colors"
                          >
                            <Package size={15} />
                          </button>
                        )}

                        {order.status === 'PROCESSING' && (
                          <button
                            id={`order-ship-${order.id}`}
                            onClick={() => openStatusTransition(order, 'SHIPPED')}
                            title="Mark as Shipped"
                            className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/15 transition-colors"
                          >
                            <Truck size={15} />
                          </button>
                        )}

                        {order.status === 'SHIPPED' && (
                          <button
                            id={`order-deliver-${order.id}`}
                            onClick={() => openStatusTransition(order, 'DELIVERED')}
                            title="Confirm Delivery"
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 transition-colors"
                          >
                            <Check size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Modal: Create New Order */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Sales Order"
        size="lg"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle size={15} />
            <span>{actionError}</span>
          </div>
        )}

        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Select Retailer Store *
              </label>
              <select
                id="create-order-retailer"
                required
                value={selectedRetailerId}
                onChange={(e) => setSelectedRetailerId(Number(e.target.value))}
                className="select-field text-xs"
              >
                {retailers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.businessName} {r.city ? `(${r.city})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Distributor Warehouse (Optional)
              </label>
              <select
                id="create-order-distributor"
                value={selectedDistributorId}
                onChange={(e) =>
                  setSelectedDistributorId(e.target.value ? Number(e.target.value) : '')
                }
                className="select-field text-xs"
              >
                <option value="">Default Org Warehouse</option>
                {distributors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Order Items (SKU &amp; Quantity) *
              </label>
              <button
                type="button"
                id="add-order-item-btn"
                onClick={handleAddItem}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {orderItems.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId);
                const subtotal = prod ? prod.basePrice * (item.quantity || 1) : 0;

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface/70 border border-surface-border/60"
                  >
                    <div className="flex-1">
                      <select
                        id={`item-product-select-${idx}`}
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', Number(e.target.value))}
                        className="select-field text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — {formatCurrency(p.basePrice)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <input
                        id={`item-qty-input-${idx}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, 'quantity', Math.max(1, Number(e.target.value)))
                        }
                        placeholder="Qty"
                        className="input-field text-xs text-center"
                      />
                    </div>

                    <div className="w-24 text-right font-mono text-xs font-semibold text-emerald-400">
                      {formatCurrency(subtotal)}
                    </div>

                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between p-3 mt-3 rounded-lg bg-surface-card border border-surface-border/60 text-xs">
              <span className="text-slate-400">Estimated Subtotal (Server Calculated):</span>
              <span className="text-base font-bold text-white font-mono">
                {formatCurrency(calculateEstimate())}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Order Notes / Delivery Instructions
            </label>
            <textarea
              id="create-order-notes"
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g. Deliver before 11:00 AM at loading dock 2"
              className="input-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-border/50">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              id="submit-create-order-btn"
              type="submit"
              disabled={createSubmitting}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              {createSubmitting ? 'Deducting Stock & Creating...' : 'Submit Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Order Details */}
      <Modal
        open={Boolean(selectedOrder && !statusModalOpen)}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details — ${selectedOrder?.orderNumber}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-surface/60 border border-surface-border/50 text-xs">
              <div>
                <p className="text-slate-400">Retailer Store</p>
                <p className="font-semibold text-white mt-0.5">{selectedOrder.retailerName}</p>
              </div>
              <div>
                <p className="text-slate-400">Sales Representative</p>
                <p className="font-semibold text-white mt-0.5">{selectedOrder.salesRepName}</p>
              </div>
              <div>
                <p className="text-slate-400">Fulfillment Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>
              <div>
                <p className="text-slate-400">Total Amount</p>
                <p className="font-bold text-emerald-400 text-sm mt-0.5 font-mono">
                  {formatCurrency(selectedOrder.totalAmount)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Order Line Items
              </h3>
              <div className="overflow-x-auto border border-surface-border/50 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-surface/50 border-b border-surface-border/50 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="text-left px-4 py-2.5">Product</th>
                      <th className="text-left px-4 py-2.5">SKU</th>
                      <th className="text-right px-4 py-2.5">Quantity</th>
                      <th className="text-right px-4 py-2.5">Unit Price</th>
                      <th className="text-right px-4 py-2.5">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/30">
                    {selectedOrder.items?.map((it, idx) => (
                      <tr key={idx} className="hover:bg-surface-elevated/20">
                        <td className="px-4 py-2.5 text-slate-200">{it.productName}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-400">{it.productSku}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-white">
                          {it.quantity}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-300">
                          {formatCurrency(it.unitPrice)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-400">
                          {formatCurrency(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="p-3 rounded-lg bg-surface/50 border border-surface-border/40 text-xs">
                <span className="text-slate-400 font-semibold">Notes: </span>
                <span className="text-slate-300">{selectedOrder.notes}</span>
              </div>
            )}

            {selectedOrder.rejectionReason && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                <span className="font-semibold">Rejection Reason: </span>
                <span>{selectedOrder.rejectionReason}</span>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-surface-border/50">
              <button onClick={() => setSelectedOrder(null)} className="btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Transition Order Status */}
      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Confirm Order State Transition: ${statusTarget}`}
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle size={15} />
            <span>{actionError}</span>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            You are changing status of Order{' '}
            <strong className="text-white font-mono">{selectedOrder?.orderNumber}</strong> from{' '}
            <StatusBadge status={selectedOrder?.status || ''} /> to{' '}
            <StatusBadge status={statusTarget} />.
          </p>

          {statusTarget === 'REJECTED' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Rejection Reason *
              </label>
              <textarea
                id="rejection-reason-input"
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify reason for rejection (e.g. credit limit exceeded, store closed)..."
                className="input-field text-xs"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-border/50">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              id="confirm-status-transition-btn"
              onClick={handleStatusUpdate}
              disabled={statusSubmitting || (statusTarget === 'REJECTED' && !rejectionReason.trim())}
              className="btn-primary text-xs"
            >
              {statusSubmitting ? 'Transitioning...' : `Confirm → ${statusTarget}`}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
