'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { PageHeader, StatCard, StatusBadge } from '@/components/ui';
import { analyticsApi, recommendationsApi, ordersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  DollarSign,
  ShoppingCart,
  Store,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Package,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { DashboardAnalytics, Order, Recommendation } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [analyticsRes, recRes, ordersRes] = await Promise.allSettled([
          analyticsApi.dashboard(),
          recommendationsApi.list(),
          ordersApi.list({ size: '5', sort: 'createdAt,desc' }),
        ]);

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
          setAnalytics(analyticsRes.value);
        }
        if (recRes.status === 'fulfilled' && Array.isArray(recRes.value)) {
          setRecommendations(recRes.value);
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value?.content) {
          setRecentOrders(ordersRes.value.content);
        }
      } catch (err) {
        console.error('Error fetching dashboard telemetry:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const highPriorityRecommendations = recommendations.filter(
    (r) => r.priority === 'CRITICAL' || r.priority === 'HIGH'
  );

  return (
    <DashboardShell>
      {/* Header */}
      <PageHeader
        title="Distribution Command Center"
        subtitle={`Live operational telemetry for ${user?.organizationName || 'Enterprise Tenant'}`}
        actions={
          <div className="flex items-center gap-3">
            <Link
              id="dashboard-new-order-btn"
              href="/dashboard/orders"
              className="btn-primary text-xs flex items-center gap-1.5 shadow-brand-500/20"
            >
              <ShoppingCart size={14} />
              <span>Create Order</span>
            </Link>
            <Link
              id="dashboard-record-visit-btn"
              href="/dashboard/visits"
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Calendar size={14} />
              <span>Record Visit</span>
            </Link>
          </div>
        }
      />

      {/* Primary KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Gross Revenue"
          value={formatCurrency(analytics?.totalRevenue)}
          trend={`Delivered: ${formatCurrency(analytics?.deliveredRevenue)}`}
          icon={<DollarSign size={24} />}
          color="brand"
        />

        <StatCard
          title="Total Orders Processed"
          value={analytics?.totalOrders ?? 0}
          trend={`${analytics?.pendingOrders ?? 0} pending fulfillment`}
          icon={<ShoppingCart size={24} />}
          color="blue"
        />

        <StatCard
          title="Active Retail Stores"
          value={analytics?.activeRetailers ?? 0}
          trend={`${analytics?.totalProducts ?? 0} catalog products`}
          icon={<Store size={24} />}
          color="green"
        />

        <StatCard
          title="Low Stock Alerts"
          value={analytics?.lowStockCount ?? 0}
          trend={
            (analytics?.lowStockCount ?? 0) > 0
              ? 'Urgent restocking needed'
              : 'Inventory healthy'
          }
          icon={<AlertTriangle size={24} />}
          color={(analytics?.lowStockCount ?? 0) > 0 ? 'red' : 'green'}
        />
      </div>

      {/* AI Recommendations Alert Callout */}
      {highPriorityRecommendations.length > 0 && (
        <div className="glass-card p-5 mb-6 border-brand-500/40 bg-gradient-to-r from-brand-950/40 via-surface-card to-surface-card shadow-lg shadow-brand-950/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center flex-shrink-0 text-brand-300">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">AI Distribution Insights Active</h2>
                  <span className="badge-danger text-[10px] px-2 py-0.2">
                    {highPriorityRecommendations.length} Action Items
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  {highPriorityRecommendations[0].title}: {highPriorityRecommendations[0].description}
                </p>
              </div>
            </div>
            <Link
              id="dashboard-view-recommendations-btn"
              href="/dashboard/recommendations"
              className="btn-primary text-xs flex items-center gap-1.5 whitespace-nowrap self-end sm:self-center"
            >
              <span>Review Insights</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Middle Grid: Trend Chart & Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sales Trend Visualizer */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-400" />
                Sales Velocity &amp; Daily Revenue
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Aggregated recent order revenue trend</p>
            </div>
            <span className="text-xs font-semibold text-brand-300 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
              Live Aggregations
            </span>
          </div>

          {/* Bar / Sparkline Visualization */}
          {analytics?.recentSalesTrend && analytics.recentSalesTrend.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-end gap-3 h-48 pt-6 pb-2 border-b border-surface-border/50">
                {analytics.recentSalesTrend.map((day, idx) => {
                  const maxRev = Math.max(...analytics.recentSalesTrend.map((d) => Number(d.revenue) || 1));
                  const heightPercent = Math.max(12, Math.round(((Number(day.revenue) || 0) / maxRev) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatCurrency(Number(day.revenue))}
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-brand-600 to-indigo-400 rounded-t-md group-hover:from-brand-500 group-hover:to-indigo-300 transition-all duration-200"
                      />
                      <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                        {day.date?.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Daily sales performance</span>
                <span>Values include confirmed &amp; delivered orders</span>
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs">
              <Clock size={24} className="mb-2 opacity-50" />
              <span>Awaiting multi-day transaction volume</span>
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers size={16} className="text-brand-400" />
                Pipeline by Status
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {analytics?.totalOrders ?? 0} Total
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Real-time order state machine status count</p>

            <div className="space-y-2.5">
              {[
                { key: 'CREATED', label: 'Created / Drafting', color: 'badge-neutral' },
                { key: 'CONFIRMED', label: 'Confirmed', color: 'badge-info' },
                { key: 'PROCESSING', label: 'Processing & Pick', color: 'badge-warning' },
                { key: 'SHIPPED', label: 'In Transit / Shipped', color: 'badge-brand' },
                { key: 'DELIVERED', label: 'Delivered', color: 'badge-success' },
              ].map((s) => {
                const count = analytics?.ordersByStatus?.[s.key] ?? 0;
                const total = analytics?.totalOrders || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={s.key} className="p-2.5 rounded-lg bg-surface/60 border border-surface-border/40">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-medium">{s.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{count}</span>
                        <span className="text-[10px] text-slate-500">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-surface-card h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="bg-brand-500 h-full rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            id="orders-pipeline-view-all-link"
            href="/dashboard/orders"
            className="mt-4 text-center py-2 text-xs text-brand-300 hover:text-white font-semibold transition-colors block border-t border-surface-border/40 pt-3"
          >
            Manage All Orders &amp; Fulfillment →
          </Link>
        </div>
      </div>

      {/* Bottom Grid: Top Selling Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Package size={16} className="text-brand-400" />
                Top Velocity SKUs
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Ranked by overall order volume &amp; turnover</p>
            </div>
            <Link
              id="view-all-products-link"
              href="/dashboard/products"
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold"
            >
              <span>Catalog</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {analytics?.topSellingProducts && analytics.topSellingProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="text-left py-2.5">Product</th>
                    <th className="text-left py-2.5">SKU</th>
                    <th className="text-right py-2.5">Units</th>
                    <th className="text-right py-2.5">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/30">
                  {analytics.topSellingProducts.map((p, idx) => (
                    <tr key={idx} className="text-xs hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 font-medium text-slate-200">{p.productName}</td>
                      <td className="py-3 font-mono text-slate-400">{p.productSku}</td>
                      <td className="py-3 text-right font-semibold text-white">{p.quantitySold}</td>
                      <td className="py-3 text-right font-semibold text-emerald-400 font-mono">
                        {formatCurrency(Number(p.totalRevenue))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">No product sales recorded yet</div>
          )}
        </div>

        {/* Recent Orders Live Table */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingCart size={16} className="text-brand-400" />
                Recent Orders Feed
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest transactional submissions</p>
            </div>
            <Link
              id="view-all-orders-link"
              href="/dashboard/orders"
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold"
            >
              <span>All Orders</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="text-left py-2.5">Order #</th>
                    <th className="text-left py-2.5">Retailer</th>
                    <th className="text-center py-2.5">Status</th>
                    <th className="text-right py-2.5">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/30">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="text-xs hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 font-mono font-medium text-brand-300">
                        <Link href={`/dashboard/orders?id=${o.id}`} className="hover:underline">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 text-slate-200">{o.retailerName}</td>
                      <td className="py-3 text-center">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-3 text-right font-semibold text-white font-mono">
                        {formatCurrency(o.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">No orders recorded yet</div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
