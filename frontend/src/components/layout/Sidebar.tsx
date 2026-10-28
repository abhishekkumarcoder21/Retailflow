'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Store, MapPin, Truck,
  BarChart3, Lightbulb, FileText, Settings, LogOut, Menu, X,
  ChevronRight, Boxes, Bell,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Orders', href: '/dashboard/orders', icon: <ShoppingCart size={18} /> },
  { label: 'Retailers', href: '/dashboard/retailers', icon: <Store size={18} /> },
  { label: 'Products', href: '/dashboard/products', icon: <Package size={18} />, roles: ['ADMIN'] },
  { label: 'Inventory', href: '/dashboard/inventory', icon: <Boxes size={18} /> },
  { label: 'Visits', href: '/dashboard/visits', icon: <MapPin size={18} />, roles: ['ADMIN', 'SALES_REP'] },
  { label: 'Territories', href: '/dashboard/territories', icon: <MapPin size={18} />, roles: ['ADMIN'] },
  { label: 'Distributors', href: '/dashboard/distributors', icon: <Truck size={18} />, roles: ['ADMIN'] },
  { label: 'Insights', href: '/dashboard/recommendations', icon: <Lightbulb size={18} /> },
  { label: 'Users', href: '/dashboard/users', icon: <Users size={18} />, roles: ['ADMIN'] },
  { label: 'Settings', href: '/dashboard/settings', icon: <Settings size={18} />, roles: ['ADMIN'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = navItems.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-surface-card/50 backdrop-blur-xl border-r border-surface-border/50
        flex flex-col z-40 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[260px]'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-border/50">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <BarChart3 size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white tracking-tight">RetailFlow</h1>
            <p className="text-[10px] text-brand-400 font-medium">AI Platform</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-500 hover:text-slate-300 transition-colors p-1"
        >
          {collapsed ? <ChevronRight size={16} /> : <X size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {filteredNav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-200
              ${isActive(item.href)
                ? 'bg-brand-600/15 text-brand-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-surface-border/50 p-3">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-slate-500 hover:text-red-400 transition-colors p-1"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
