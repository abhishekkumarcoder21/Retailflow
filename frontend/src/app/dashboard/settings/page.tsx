'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { PageHeader, StatusBadge, Pagination } from '@/components/ui';
import { organizationsApi, auditLogsApi } from '@/lib/api';
import { Organization, AuditLog } from '@/types';
import {
  Settings,
  Building,
  ShieldCheck,
  FileText,
  Server,
  Database,
  CheckCircle2,
  AlertCircle,
  Save,
  Activity,
} from 'lucide-react';

export default function SettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logPage, setLogPage] = useState(0);
  const [totalLogPages, setTotalLogPages] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    businessType: '',
    address: '',
    phone: '',
    email: '',
  });

  const [savingOrg, setSavingOrg] = useState(false);
  const [orgSuccess, setOrgSuccess] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrg() {
      try {
        setLoadingOrg(true);
        const res = await organizationsApi.current();
        if (res) {
          setOrg(res);
          setFormData({
            name: res.name || '',
            businessType: res.businessType || '',
            address: res.address || '',
            phone: res.phone || '',
            email: res.email || '',
          });
        }
      } catch (err) {
        console.error('Failed to load organization profile:', err);
      } finally {
        setLoadingOrg(false);
      }
    }
    loadOrg();
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const res = await auditLogsApi.list({
        page: logPage.toString(),
        size: '10',
        sort: 'createdAt,desc',
      });
      if (res?.content) {
        setAuditLogs(res.content);
        setTotalLogPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, [logPage]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingOrg(true);
      setOrgSuccess(null);
      setOrgError(null);

      const updated = await organizationsApi.update(formData);
      setOrg(updated);
      setOrgSuccess('Organization configuration saved successfully.');
      setTimeout(() => setOrgSuccess(null), 3500);
    } catch (err: any) {
      setOrgError(err?.message || 'Failed to update organization profile');
    } finally {
      setSavingOrg(false);
    }
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Organization Settings &amp; Platform Health"
        subtitle="Tenant identity parameters, telemetry health, and immutable audit logs"
      />

      {/* Grid: Org Info & System Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Organization Profile Card */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4 border-b border-surface-border/50 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building size={16} className="text-brand-400" />
              Tenant Identity &amp; Profile
            </h2>
            {org?.status && <StatusBadge status={org.status} />}
          </div>

          {orgSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 size={15} />
              <span>{orgSuccess}</span>
            </div>
          )}

          {orgError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle size={15} />
              <span>{orgError}</span>
            </div>
          )}

          {loadingOrg ? (
            <div className="space-y-3 py-4">
              <div className="skeleton h-8 w-full" />
              <div className="skeleton h-8 w-full" />
              <div className="skeleton h-8 w-full" />
            </div>
          ) : (
            <form onSubmit={handleOrgSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Organization Name
                  </label>
                  <input
                    id="settings-org-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Tenant Slug (System Key)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={org?.slug || ''}
                    className="input-field text-xs font-mono opacity-60 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Business / Industry Sector
                  </label>
                  <input
                    id="settings-org-type"
                    type="text"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Corporate Email
                  </label>
                  <input
                    id="settings-org-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Support Hotline Phone
                  </label>
                  <input
                    id="settings-org-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Headquarters Address
                  </label>
                  <input
                    id="settings-org-address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-surface-border/50">
                <button
                  id="settings-save-org-btn"
                  type="submit"
                  disabled={savingOrg}
                  className="btn-primary text-xs flex items-center gap-1.5 shadow-brand-500/20"
                >
                  <Save size={14} />
                  <span>{savingOrg ? 'Saving Changes...' : 'Save Organization Profile'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* System Diagnostics & Telemetry */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-surface-border/50 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" />
                System Telemetry
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ● UP &amp; HEALTHY
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-surface/70 border border-surface-border/50 flex items-center justify-between">
                <span className="text-slate-400">Spring Boot Core</span>
                <span className="text-white font-mono font-semibold">v3.2.12 (Java 17)</span>
              </div>

              <div className="p-3 rounded-lg bg-surface/70 border border-surface-border/50 flex items-center justify-between">
                <span className="text-slate-400">Persistence Engine</span>
                <span className="text-white font-mono font-semibold">PostgreSQL / Flyway v1</span>
              </div>

              <div className="p-3 rounded-lg bg-surface/70 border border-surface-border/50 flex items-center justify-between">
                <span className="text-slate-400">Security Architecture</span>
                <span className="text-white font-mono font-semibold">JWT HttpOnly + Lax</span>
              </div>

              <div className="p-3 rounded-lg bg-surface/70 border border-surface-border/50 flex items-center justify-between">
                <span className="text-slate-400">Concurrency Control</span>
                <span className="text-emerald-400 font-mono font-semibold">Optimistic Lock (JPA)</span>
              </div>

              <div className="p-3 rounded-lg bg-surface/70 border border-surface-border/50 flex items-center justify-between">
                <span className="text-slate-400">Tenant Isolation</span>
                <span className="text-brand-300 font-mono font-semibold">
                  org_id Discriminator
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-surface-border/40 text-[11px] text-slate-500 text-center">
            Actuator endpoints active at <code className="text-slate-400">/actuator/health</code>
          </div>
        </div>
      </div>

      {/* Immutable Audit Trail Section */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-surface-border/50 flex items-center justify-between bg-surface/40">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText size={16} className="text-brand-400" />
              Security &amp; Operational Audit Trail
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable ledger tracking logins, state mutations, orders, and stock movements
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-surface/80 px-2.5 py-1 rounded border border-surface-border/60">
            Admin Audited
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-surface/30">
                <th className="text-left px-5 py-3">Timestamp</th>
                <th className="text-left px-5 py-3">Action</th>
                <th className="text-left px-5 py-3">Entity Type</th>
                <th className="text-center px-5 py-3">Entity ID</th>
                <th className="text-left px-5 py-3">Actor</th>
                <th className="text-left px-5 py-3">Details / Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/30">
              {loadingLogs ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-3.5">
                      <div className="skeleton h-5 w-full rounded" />
                    </td>
                  </tr>
                ))
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 text-xs">
                    No audit records logged yet. Operations will stream into this audit ledger automatically.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="text-xs hover:bg-surface-elevated/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-slate-400 whitespace-nowrap">
                      {log.createdAt?.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="px-5 py-3 font-semibold text-white">
                      <span className="px-2 py-0.5 rounded bg-surface/80 border border-surface-border/60 text-[11px] font-mono text-brand-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{log.entityType}</td>
                    <td className="px-5 py-3 font-mono text-center text-slate-400">
                      {log.entityId || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-200">{log.userName || 'System'}</td>
                    <td className="px-5 py-3 text-slate-400 max-w-md truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={logPage} totalPages={totalLogPages} onChange={setLogPage} />
    </DashboardShell>
  );
}
