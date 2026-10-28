'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Zap,
  MapPin,
  Boxes,
  ShoppingCart,
  Users,
  CheckCircle2,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [loadingRole, setLoadingRole] = React.useState<string | null>(null);

  const handleQuickLogin = async (email: string, role: string) => {
    try {
      setLoadingRole(role);
      await login(email, 'Password123!');
      router.push('/dashboard');
    } catch (err) {
      console.error('Quick login error:', err);
      router.push('/login');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-brand-600/20 via-brand-900/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[400px] -left-48 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[600px] -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation */}
      <header className="border-b border-surface-border/40 backdrop-blur-md bg-surface/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/25 ring-1 ring-brand-400/40">
              <BarChart3 className="text-white w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                RetailFlow<span className="text-brand-400">.AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                v2.4 Enterprise
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                id="header-dashboard-link"
                href="/dashboard"
                className="btn-primary flex items-center gap-2 text-sm shadow-brand-500/20"
              >
                <span>Dashboard ({user.fullName})</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  id="header-login-link"
                  href="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  id="header-register-link"
                  href="/register"
                  className="btn-primary text-sm flex items-center gap-2 shadow-brand-500/20"
                >
                  <span>Get Started</span>
                  <ArrowRight size={15} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-card/80 border border-brand-500/30 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
          <span>Next-Generation Intelligent Retail Distribution Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
          Unify Retail, Supply &amp; Field Sales with{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-400">
            AI-Driven Agility
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
          Orchestrate multi-tier retail networks, live inventory deduction with optimistic locking, GPS-verified store visits, and algorithmic reorder predictions in a unified enterprise architecture.
        </p>

        {/* Quick Demo Credential Launcher */}
        <div className="max-w-3xl mx-auto glass-card p-6 border-brand-500/30 shadow-2xl shadow-brand-950/50 mb-16">
          <div className="flex items-center justify-between mb-4 border-b border-surface-border/60 pb-3">
            <div className="text-left">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Instant Demo Sandbox Access
              </h2>
              <p className="text-xs text-slate-400">
                Click any role to test full workflows with pre-seeded enterprise telemetry:
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ● API Online
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              id="demo-login-admin"
              onClick={() => handleQuickLogin('admin@retailflow.com', 'ADMIN')}
              disabled={loadingRole !== null}
              className="flex flex-col items-start p-3.5 rounded-xl bg-surface-card/90 hover:bg-surface-elevated border border-surface-border hover:border-brand-500/50 transition-all text-left group"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-white group-hover:text-brand-300">HQ Admin</span>
                <span className="badge-brand text-[10px] px-1.5 py-0.2">Full Access</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">admin@retailflow.com</span>
              <span className="text-[10px] text-slate-500 mt-2">
                {loadingRole === 'ADMIN' ? 'Authenticating...' : 'Manage org, products, inventory & users →'}
              </span>
            </button>

            <button
              id="demo-login-sales-rep"
              onClick={() => handleQuickLogin('sales.rep@retailflow.com', 'SALES_REP')}
              disabled={loadingRole !== null}
              className="flex flex-col items-start p-3.5 rounded-xl bg-surface-card/90 hover:bg-surface-elevated border border-surface-border hover:border-brand-500/50 transition-all text-left group"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-white group-hover:text-brand-300">Sales Rep</span>
                <span className="badge-info text-[10px] px-1.5 py-0.2">Field Rep</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">sales.rep@retailflow.com</span>
              <span className="text-[10px] text-slate-500 mt-2">
                {loadingRole === 'SALES_REP' ? 'Authenticating...' : 'Store check-ins, create orders & visits →'}
              </span>
            </button>

            <button
              id="demo-login-distributor"
              onClick={() => handleQuickLogin('distributor@retailflow.com', 'DISTRIBUTOR')}
              disabled={loadingRole !== null}
              className="flex flex-col items-start p-3.5 rounded-xl bg-surface-card/90 hover:bg-surface-elevated border border-surface-border hover:border-brand-500/50 transition-all text-left group"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-white group-hover:text-brand-300">Distributor</span>
                <span className="badge-warning text-[10px] px-1.5 py-0.2">Logistics</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">distributor@retailflow.com</span>
              <span className="text-[10px] text-slate-500 mt-2">
                {loadingRole === 'DISTRIBUTOR' ? 'Authenticating...' : 'Warehouse inventory, stock & dispatch →'}
              </span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto text-left">
          <div className="glass-card p-6 border-surface-border/50 hover:border-brand-500/40 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Predictive AI Insights</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Algorithmic detection of low-stock risks, declining store velocity, and frequent product bundles with actionable one-click resolutions.
            </p>
          </div>

          <div className="glass-card p-6 border-surface-border/50 hover:border-brand-500/40 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Optimistic Lock Inventory</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Race-condition-proof warehouse inventory management with versioned JPA locking, full movement audit trails, and automatic order deductions.
            </p>
          </div>

          <div className="glass-card p-6 border-surface-border/50 hover:border-brand-500/40 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">GPS-Verified Field Visits</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Track sales reps in real time with geocoded store check-ins, visit notes, historical outcomes, and retailer assignment routing.
            </p>
          </div>

          <div className="glass-card p-6 border-surface-border/50 hover:border-brand-500/40 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Idempotent Order Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Finite state machine order flow (Created → Confirmed → Processing → Shipped → Delivered) with client-side idempotency keys preventing duplicates.
            </p>
          </div>

          <div className="glass-card p-6 border-surface-border/50 hover:border-brand-500/40 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Enterprise Multi-Tenancy</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Strict organization-level data isolation enforced at service and repository layers, backed by Spring Security and JWT HttpOnly cookies.
            </p>
          </div>

          <div className="glass-card p-6 border-surface-border/50 hover:border-brand-500/40 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Full Telemetry &amp; Auditing</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Spring Boot Actuator health metrics, Flyway migration versioning, and immutable audit logs capturing every critical business event.
            </p>
          </div>
        </div>

        {/* Live System Metrics Bar */}
        <div className="mt-16 glass-card p-6 max-w-4xl mx-auto border-surface-border/40 flex flex-wrap items-center justify-around gap-6 text-center">
          <div>
            <p className="text-3xl font-extrabold text-white">100%</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Audit Traceability</p>
          </div>
          <div className="w-px h-10 bg-surface-border/60 hidden sm:block" />
          <div>
            <p className="text-3xl font-extrabold text-brand-400">&lt; 15ms</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Pricing &amp; State Transition</p>
          </div>
          <div className="w-px h-10 bg-surface-border/60 hidden sm:block" />
          <div>
            <p className="text-3xl font-extrabold text-emerald-400">0 Over-Allocation</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Optimistic Concurrency</p>
          </div>
          <div className="w-px h-10 bg-surface-border/60 hidden sm:block" />
          <div>
            <p className="text-3xl font-extrabold text-purple-400">Strict Org ID</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Tenant Data Boundary</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border/40 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 RetailFlow AI. High-Performance Retail Sales &amp; Distribution Platform.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-slate-400">Spring Boot 3.2 • Java 17 • Next.js 14 • PostgreSQL • TailwindCSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
