'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('admin@retailflow.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/25 ring-1 ring-brand-400/40 group-hover:scale-105 transition-transform">
              <BarChart3 className="text-white w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              RetailFlow<span className="text-brand-400">.AI</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">Enterprise Portal Authentication</h1>
          <p className="text-xs text-slate-400 mt-1">Sign in with your organization credentials</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 border-surface-border/70 shadow-2xl backdrop-blur-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-500/15 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs animate-shake">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@retailflow.com"
                  className="input-field pl-10 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-brand-400 font-medium">Demo: Password123!</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field pl-10 pr-10 text-sm"
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2 shadow-brand-600/30 font-semibold text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-6 pt-5 border-t border-surface-border/50">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Select Demo Account to Auto-Fill:
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                id="autofill-admin"
                onClick={() => fillCredentials('admin@retailflow.com')}
                className={`text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                  email === 'admin@retailflow.com'
                    ? 'bg-brand-600/20 border-brand-500/50 text-brand-200'
                    : 'bg-surface/50 border-surface-border/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>
                  <strong className="text-white">Admin:</strong> admin@retailflow.com
                </span>
                {email === 'admin@retailflow.com' && <CheckCircle2 size={14} className="text-brand-400" />}
              </button>

              <button
                type="button"
                id="autofill-sales-rep"
                onClick={() => fillCredentials('sales.rep@retailflow.com')}
                className={`text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                  email === 'sales.rep@retailflow.com'
                    ? 'bg-brand-600/20 border-brand-500/50 text-brand-200'
                    : 'bg-surface/50 border-surface-border/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>
                  <strong className="text-white">Sales Rep:</strong> sales.rep@retailflow.com
                </span>
                {email === 'sales.rep@retailflow.com' && <CheckCircle2 size={14} className="text-brand-400" />}
              </button>

              <button
                type="button"
                id="autofill-distributor"
                onClick={() => fillCredentials('distributor@retailflow.com')}
                className={`text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                  email === 'distributor@retailflow.com'
                    ? 'bg-brand-600/20 border-brand-500/50 text-brand-200'
                    : 'bg-surface/50 border-surface-border/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>
                  <strong className="text-white">Distributor:</strong> distributor@retailflow.com
                </span>
                {email === 'distributor@retailflow.com' && <CheckCircle2 size={14} className="text-brand-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link to Register */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Need to deploy for a new enterprise organization?{' '}
            <Link id="register-redirect-link" href="/register" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4">
              Register Organization
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
