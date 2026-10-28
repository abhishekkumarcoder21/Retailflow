'use client';

import React from 'react';

// -------------- StatusBadge --------------
const statusColors: Record<string, string> = {
  ACTIVE: 'badge-success',
  INACTIVE: 'badge-neutral',
  SUSPENDED: 'badge-danger',
  CREATED: 'badge-neutral',
  CONFIRMED: 'badge-info',
  PROCESSING: 'badge-warning',
  SHIPPED: 'badge-brand',
  DELIVERED: 'badge-success',
  REJECTED: 'badge-danger',
  CANCELLED: 'badge-danger',
  PLANNED: 'badge-neutral',
  CHECKED_IN: 'badge-info',
  COMPLETED: 'badge-success',
  LOW_STOCK: 'badge-danger',
  DECLINING_ORDERS: 'badge-warning',
  UNVISITED_RETAILER: 'badge-warning',
  REORDER_SUGGESTION: 'badge-info',
  FREQUENTLY_BOUGHT_TOGETHER: 'badge-brand',
  DISMISSED: 'badge-neutral',
  LOW: 'badge-neutral',
  MEDIUM: 'badge-info',
  HIGH: 'badge-warning',
  CRITICAL: 'badge-danger',
};

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const cls = statusColors[status] || 'badge-neutral';
  return (
    <span className={`${cls} ${className}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// -------------- DataTable --------------
interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends { id?: number }>({
  columns, data, loading, emptyMessage = 'No data found', onRowClick
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="glass-card overflow-hidden">
        <div className="p-8 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border/50">
              {columns.map(col => (
                <th key={col.key} className={`text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider ${col.className || ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-slate-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, i) => (
                <tr
                  key={item.id || i}
                  onClick={() => onRowClick?.(item)}
                  className={`table-row ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map(col => (
                    <td key={col.key} className={`px-5 py-3.5 text-sm text-slate-300 ${col.className || ''}`}>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------- Modal --------------
export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg';
}) {
  if (!open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative ${widths[size]} w-full mx-4 bg-surface-card border border-surface-border rounded-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border/50">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">
            ×
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// -------------- Pagination --------------
export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onChange(page - 1)} disabled={page === 0} className="btn-secondary text-xs px-3 py-1.5">
        Previous
      </button>
      <span className="text-sm text-slate-400">
        Page {page + 1} of {totalPages}
      </span>
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1} className="btn-secondary text-xs px-3 py-1.5">
        Next
      </button>
    </div>
  );
}

// -------------- StatCard --------------
export function StatCard({ title, value, icon, trend, color = 'brand' }: {
  title: string; value: string | number; icon: React.ReactNode; trend?: string; color?: string;
}) {
  const gradients: Record<string, string> = {
    brand: 'from-brand-500/20 to-brand-600/5',
    green: 'from-emerald-500/20 to-emerald-600/5',
    amber: 'from-amber-500/20 to-amber-600/5',
    red: 'from-red-500/20 to-red-600/5',
    blue: 'from-blue-500/20 to-blue-600/5',
  };

  const iconColors: Record<string, string> = {
    brand: 'text-brand-400',
    green: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  };

  return (
    <div className={`stat-card bg-gradient-to-br ${gradients[color] || gradients.brand}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
        </div>
        <div className={`${iconColors[color] || iconColors.brand} opacity-70`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// -------------- EmptyState --------------
export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="glass-card p-12 text-center">
      <div className="text-slate-600 mb-4 flex justify-center">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
}

// -------------- PageHeader --------------
export function PageHeader({ title, subtitle, actions }: {
  title: string; subtitle?: string; actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
