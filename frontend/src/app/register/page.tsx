'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Building2, User, Mail, Lock, Phone, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    organizationName: '',
    organizationSlug: '',
    businessType: 'FMCG_DISTRIBUTION',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setFormData((prev) => ({
      ...prev,
      organizationName: name,
      organizationSlug: slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please review your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-brand-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
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
          <h1 className="text-xl font-bold text-white tracking-tight">Register New Enterprise Tenant</h1>
          <p className="text-xs text-slate-400 mt-1">Deploy an isolated tenant workspace with full distribution capabilities</p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 border-surface-border/70 shadow-2xl backdrop-blur-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-500/15 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Section */}
            <div>
              <h2 className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 size={15} />
                Organization Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-org-name" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Organization Name *
                  </label>
                  <input
                    id="reg-org-name"
                    type="text"
                    required
                    value={formData.organizationName}
                    onChange={handleOrgNameChange}
                    placeholder="e.g. Apex Consumer Brands"
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="reg-org-slug" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Tenant Slug Identifier *
                  </label>
                  <input
                    id="reg-org-slug"
                    type="text"
                    required
                    value={formData.organizationSlug}
                    onChange={(e) => setFormData({ ...formData, organizationSlug: e.target.value })}
                    placeholder="e.g. apex-consumer-brands"
                    className="input-field text-sm font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="reg-business-type" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Industry / Business Type
                  </label>
                  <select
                    id="reg-business-type"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="select-field text-sm"
                  >
                    <option value="FMCG_DISTRIBUTION">FMCG &amp; Packaged Goods Distribution</option>
                    <option value="BEVERAGES_AND_FOOD">Food &amp; Beverage Wholesale</option>
                    <option value="PHARMACEUTICALS">Pharmaceuticals &amp; Healthcare</option>
                    <option value="ELECTRONICS">Consumer Electronics &amp; Hardware</option>
                    <option value="APPAREL_RETAIL">Apparel &amp; Fashion Wholesale</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Administrator Section */}
            <div className="pt-4 border-t border-surface-border/50">
              <h2 className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User size={15} />
                Primary Administrator Account
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-first-name" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    First Name *
                  </label>
                  <input
                    id="reg-first-name"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Jane"
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="reg-last-name" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Last Name *
                  </label>
                  <input
                    id="reg-last-name"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Work Email *
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@apexbrands.com"
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    className="input-field text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Password * (Min 6 Characters)
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              id="register-submit-button"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 shadow-brand-600/30 font-semibold text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Provisioning Organization...</span>
                </>
              ) : (
                <>
                  <span>Deploy Enterprise Workspace</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing account link */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Already have an active organization account?{' '}
            <Link id="login-redirect-link" href="/login" className="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
