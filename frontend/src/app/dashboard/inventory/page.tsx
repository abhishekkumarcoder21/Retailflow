'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { PageHeader, StatusBadge, Modal, Pagination } from '@/components/ui';
import { inventoryApi, productsApi, distributorsApi } from '@/lib/api';
import { Inventory, InventoryMovement, Product, Distributor } from '@/types';
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Truck,
} from 'lucide-react';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'levels' | 'movements'>('levels');
  const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
  const [movementsList, setMovementsList] = useState<InventoryMovement[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Adjust stock modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedDistributorId, setSelectedDistributorId] = useState<number | ''>('');
  const [movementType, setMovementType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'>('STOCK_IN');
  const [quantityChange, setQuantityChange] = useState<number>(50);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(20);
  const [reason, setReason] = useState<string>('Warehouse restock shipment received');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'levels') {
        const res = await inventoryApi.list({
          page: page.toString(),
          size: '12',
          lowStockOnly: lowStockOnly.toString(),
        });
        if (res?.content) {
          setInventoryList(res.content);
          setTotalPages(res.totalPages || 1);
        }
      } else {
        const res = await inventoryApi.movements({
          page: page.toString(),
          size: '12',
          sort: 'createdAt,desc',
        });
        if (res?.content) {
          setMovementsList(res.content);
          setTotalPages(res.totalPages || 1);
        }
      }

      // Check low stock alerts
      const alerts = await inventoryApi.lowStock();
      if (Array.isArray(alerts)) {
        setLowStockAlerts(alerts);
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, lowStockOnly]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    async function loadAux() {
      try {
        const [prodRes, distRes] = await Promise.all([
          productsApi.active(),
          distributorsApi.list({ size: '100' }),
        ]);
        if (Array.isArray(prodRes)) {
          setProducts(prodRes);
          if (prodRes.length > 0) setSelectedProductId(prodRes[0].id);
        }
        if (distRes?.content) {
          setDistributors(distRes.content);
        }
      } catch (err) {
        console.error('Aux loading error:', err);
      }
    }
    loadAux();
  }, []);

  const openAdjustModal = (inv?: Inventory) => {
    setAdjustError(null);
    if (inv) {
      setSelectedProductId(inv.productId);
      setSelectedDistributorId(inv.distributorId || '');
      setLowStockThreshold(inv.lowStockThreshold || 20);
    } else if (products.length > 0) {
      setSelectedProductId(products[0].id);
    }
    setMovementType('STOCK_IN');
    setQuantityChange(50);
    setReason('Inbound inventory shipment');
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    try {
      setAdjustSubmitting(true);
      setAdjustError(null);

      // If STOCK_OUT, ensure quantityChange is positive as entered, service handles math
      const qty = Math.abs(quantityChange);

      await inventoryApi.adjust({
        productId: Number(selectedProductId),
        distributorId: selectedDistributorId ? Number(selectedDistributorId) : undefined,
        quantityChange: qty,
        movementType,
        reason: reason || undefined,
        lowStockThreshold: Number(lowStockThreshold),
      });

      setAdjustModalOpen(false);
      loadData();
    } catch (err: any) {
      setAdjustError(err?.message || 'Inventory adjustment failed');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const filteredInventory = inventoryList.filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.productName?.toLowerCase().includes(q) ||
      inv.productSku?.toLowerCase().includes(q) ||
      inv.distributorName?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardShell>
      <PageHeader
        title="Inventory &amp; Stock Ledger"
        subtitle="Optimistic locking warehouse allocations with immutable movement audit trails"
        actions={
          <button
            id="adjust-inventory-btn"
            onClick={() => openAdjustModal()}
            className="btn-primary flex items-center gap-2 text-sm shadow-brand-500/20"
          >
            <Plus size={16} />
            <span>Adjust Stock Level</span>
          </button>
        }
      />

      {/* Low Stock Urgent Warning Banner */}
      {lowStockAlerts.length > 0 && (
        <div className="glass-card p-4 mb-6 border-red-500/40 bg-gradient-to-r from-red-950/40 via-surface-card to-surface-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Low Stock Warning: {lowStockAlerts.length} SKU(s) below threshold
              </p>
              <p className="text-[11px] text-slate-300">
                Replenishment required: {lowStockAlerts.map((a) => a.productName).join(', ')}
              </p>
            </div>
          </div>
          <button
            id="filter-low-stock-btn"
            onClick={() => {
              setLowStockOnly(!lowStockOnly);
              setPage(0);
            }}
            className="btn-secondary text-xs"
          >
            {lowStockOnly ? 'Show All Stock' : 'Filter Low Stock'}
          </button>
        </div>
      )}

      {/* Tabs and Search Bar */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Navigation tabs */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="tab-stock-levels"
            onClick={() => {
              setActiveTab('levels');
              setPage(0);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'levels'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                : 'bg-surface/50 text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
            }`}
          >
            <Boxes size={14} />
            <span>Current Stock Levels</span>
          </button>

          <button
            id="tab-movement-history"
            onClick={() => {
              setActiveTab('movements');
              setPage(0);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'movements'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                : 'bg-surface/50 text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
            }`}
          >
            <History size={14} />
            <span>Movements Ledger</span>
          </button>
        </div>

        {activeTab === 'levels' && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="inventory-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU or product..."
              className="input-field pl-10 text-xs py-2"
            />
          </div>
        )}
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'levels' ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-surface/40">
                  <th className="text-left px-5 py-3.5">Product SKU</th>
                  <th className="text-left px-5 py-3.5">Product Name</th>
                  <th className="text-left px-5 py-3.5">Warehouse / Distributor</th>
                  <th className="text-right px-5 py-3.5">Available Qty</th>
                  <th className="text-right px-5 py-3.5">Threshold</th>
                  <th className="text-center px-5 py-3.5">Stock Status</th>
                  <th className="text-right px-5 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/30">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-5 py-4">
                        <div className="skeleton h-6 w-full rounded" />
                      </td>
                    </tr>
                  ))
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                      No inventory records found. Click &quot;Adjust Stock Level&quot; to seed warehouse quantities.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-elevated/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-medium text-brand-300 text-xs">
                        {inv.productSku}
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-white">
                        {inv.productName}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {inv.distributorName || 'Central Org Hub'}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono font-bold text-right text-white">
                        {inv.quantity}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-right text-slate-400">
                        {inv.lowStockThreshold}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`badge ${
                            inv.lowStock ? 'badge-danger' : 'badge-success'
                          }`}
                        >
                          {inv.lowStock ? 'LOW STOCK' : 'IN STOCK'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          id={`quick-adjust-btn-${inv.id}`}
                          onClick={() => openAdjustModal(inv)}
                          className="btn-secondary text-xs px-2.5 py-1"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Movements Ledger Table */
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-surface/40">
                  <th className="text-left px-5 py-3.5">Timestamp</th>
                  <th className="text-left px-5 py-3.5">SKU &amp; Product</th>
                  <th className="text-left px-5 py-3.5">Movement Type</th>
                  <th className="text-right px-5 py-3.5">Quantity Change</th>
                  <th className="text-right px-5 py-3.5">Resulting Stock</th>
                  <th className="text-left px-5 py-3.5">Reason / Ref</th>
                  <th className="text-right px-5 py-3.5">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/30">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-5 py-4">
                        <div className="skeleton h-6 w-full rounded" />
                      </td>
                    </tr>
                  ))
                ) : movementsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                      No stock movement ledger transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  movementsList.map((m) => {
                    const isPositive = m.quantityChange > 0;
                    return (
                      <tr key={m.id} className="hover:bg-surface-elevated/30 transition-colors">
                        <td className="px-5 py-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                          {m.createdAt?.slice(0, 16).replace('T', ' ')}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <span className="font-mono text-brand-300 font-semibold">{m.productSku}</span>
                          <span className="text-slate-300 ml-2">{m.productName}</span>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={m.movementType} />
                        </td>
                        <td className="px-5 py-4 text-xs font-mono font-bold text-right">
                          <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                            {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-right text-white font-semibold">
                          {m.resultingQuantity}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400">
                          {m.reason || 'Manual Adjustment'}
                        </td>
                        <td className="px-5 py-4 text-xs text-right text-slate-300">
                          {m.actorName || 'System'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Modal: Adjust Stock */}
      <Modal
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Adjust Warehouse Inventory Stock"
      >
        {adjustError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle size={15} />
            <span>{adjustError}</span>
          </div>
        )}

        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Product SKU *
            </label>
            <select
              id="adjust-product-select"
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              className="select-field text-xs"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Distributor / Warehouse Node
            </label>
            <select
              id="adjust-distributor-select"
              value={selectedDistributorId}
              onChange={(e) =>
                setSelectedDistributorId(e.target.value ? Number(e.target.value) : '')
              }
              className="select-field text-xs"
            >
              <option value="">Central Org Inventory</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Movement Type *
              </label>
              <select
                id="adjust-type-select"
                value={movementType}
                onChange={(e) => setMovementType(e.target.value as any)}
                className="select-field text-xs"
              >
                <option value="STOCK_IN">STOCK_IN (Inbound restock)</option>
                <option value="STOCK_OUT">STOCK_OUT (Disposal / Shrinkage)</option>
                <option value="ADJUSTMENT">ADJUSTMENT (Cycle audit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Quantity Units *
              </label>
              <input
                id="adjust-quantity-input"
                type="number"
                min="1"
                required
                value={quantityChange}
                onChange={(e) => setQuantityChange(Math.max(1, Number(e.target.value)))}
                className="input-field text-xs font-mono text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Low Stock Alert Threshold
            </label>
            <input
              id="adjust-threshold-input"
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              className="input-field text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Audit Reason / Reference Code
            </label>
            <input
              id="adjust-reason-input"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. PO-84920 Restock receipt from manufacturer"
              className="input-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-border/50">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              id="confirm-adjust-btn"
              type="submit"
              disabled={adjustSubmitting}
              className="btn-primary text-xs"
            >
              {adjustSubmitting ? 'Recording Adjustment...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
