'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { PageHeader, StatusBadge } from '@/components/ui';
import { recommendationsApi } from '@/lib/api';
import { Recommendation } from '@/types';
import {
  Sparkles,
  RefreshCw,
  CheckCircle,
  XCircle,
  Boxes,
  TrendingDown,
  MapPin,
  ShoppingCart,
  Lightbulb,
  ArrowRight,
  ShieldAlert,
  Clock,
} from 'lucide-react';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await recommendationsApi.list();
      if (Array.isArray(res)) {
        setRecommendations(res);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await recommendationsApi.refresh();
      if (Array.isArray(res)) {
        setRecommendations(res);
      }
      setNotification('Deterministic AI rules re-evaluated across orders, stock & visits.');
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to refresh recommendations');
    } finally {
      setRefreshing(false);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await recommendationsApi.complete(id);
      setRecommendations(recommendations.filter((r) => r.id !== id));
      setNotification('Recommendation marked as resolved & actioned.');
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to complete recommendation');
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await recommendationsApi.dismiss(id);
      setRecommendations(recommendations.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err?.message || 'Failed to dismiss recommendation');
    }
  };

  const filtered = recommendations.filter((r) => {
    if (!filterType) return true;
    return r.type === filterType;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return <Boxes className="text-red-400" size={18} />;
      case 'DECLINING_ORDERS':
        return <TrendingDown className="text-amber-400" size={18} />;
      case 'UNVISITED_RETAILER':
        return <MapPin className="text-purple-400" size={18} />;
      case 'REORDER_SUGGESTION':
      case 'FREQUENTLY_BOUGHT_TOGETHER':
        return <ShoppingCart className="text-brand-400" size={18} />;
      default:
        return <Sparkles className="text-brand-400" size={18} />;
    }
  };

  const getDeepLink = (r: Recommendation) => {
    switch (r.type) {
      case 'LOW_STOCK':
        return { label: 'Go to Inventory Ledger', href: '/dashboard/inventory' };
      case 'UNVISITED_RETAILER':
        return { label: 'Schedule Field Check-In', href: '/dashboard/visits' };
      case 'DECLINING_ORDERS':
      case 'REORDER_SUGGESTION':
      case 'FREQUENTLY_BOUGHT_TOGETHER':
        return { label: 'Create Replenishment Order', href: '/dashboard/orders' };
      default:
        return null;
    }
  };

  return (
    <DashboardShell>
      <PageHeader
        title="AI Operational Intelligence &amp; Actions"
        subtitle="Real-time heuristics detecting stock depletion, cold accounts, and reorder velocity"
        actions={
          <button
            id="refresh-ai-insights-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary flex items-center gap-2 text-sm shadow-brand-500/20"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Evaluating Rules...' : 'Run AI Evaluation'}</span>
          </button>
        }
      />

      {/* Notification Toast */}
      {notification && (
        <div className="glass-card p-3.5 mb-6 border-emerald-500/40 bg-emerald-950/30 flex items-center gap-2 text-xs text-emerald-300 animate-fade-in">
          <Sparkles size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="glass-card p-4 mb-6 flex items-center gap-2 overflow-x-auto">
        {[
          { label: 'All Action Items', value: '' },
          { label: 'Low Stock Alerts', value: 'LOW_STOCK' },
          { label: 'Declining Volume', value: 'DECLINING_ORDERS' },
          { label: 'Unvisited Stores', value: 'UNVISITED_RETAILER' },
          { label: 'Reorder Suggestions', value: 'REORDER_SUGGESTION' },
          { label: 'Frequently Bought Together', value: 'FREQUENTLY_BOUGHT_TOGETHER' },
        ].map((f) => (
          <button
            key={f.value}
            id={`filter-rec-${f.value || 'all'}`}
            onClick={() => setFilterType(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === f.value
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                : 'bg-surface/50 text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Recommendations Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-36 animate-pulse">
              <div className="skeleton h-5 w-1/3 mb-3" />
              <div className="skeleton h-4 w-3/4 mb-3" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} />
            </div>
            <h2 className="text-base font-bold text-white mb-1">
              All AI Insights Clear
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No anomalies detected. Inventory levels are above safety buffers and all retail accounts are actively serviced.
            </p>
          </div>
        ) : (
          filtered.map((rec) => {
            const deepLink = getDeepLink(rec);
            return (
              <div
                key={rec.id}
                className="glass-card p-5 hover:border-brand-500/50 transition-all border-surface-border/60"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-surface/80 border border-surface-border flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getIconForType(rec.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-sm font-bold text-white">{rec.title}</h2>
                        <StatusBadge status={rec.priority} />
                        <span className="text-[10px] uppercase font-mono text-slate-400 px-2 py-0.5 rounded bg-surface/80 border border-surface-border/50">
                          {rec.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                        {rec.description}
                      </p>

                      {rec.suggestedAction && (
                        <div className="mt-3 p-2.5 rounded-lg bg-surface/70 border border-surface-border/50 flex items-start gap-2 text-xs text-brand-200">
                          <Lightbulb size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Prescribed Action: </strong> {rec.suggestedAction}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-surface-border/40">
                    {deepLink && (
                      <Link
                        id={`rec-deeplink-${rec.id}`}
                        href={deepLink.href}
                        className="btn-primary text-xs flex items-center gap-1.5 whitespace-nowrap shadow-brand-500/15"
                      >
                        <span>{deepLink.label}</span>
                        <ArrowRight size={13} />
                      </Link>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        id={`rec-complete-${rec.id}`}
                        onClick={() => handleComplete(rec.id)}
                        className="btn-secondary text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                        title="Mark Complete"
                      >
                        <CheckCircle size={14} />
                        <span>Actioned</span>
                      </button>

                      <button
                        id={`rec-dismiss-${rec.id}`}
                        onClick={() => handleDismiss(rec.id)}
                        className="btn-ghost text-xs text-slate-400 hover:text-slate-200"
                        title="Dismiss"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardShell>
  );
}
