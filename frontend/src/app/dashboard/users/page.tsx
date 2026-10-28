'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { PageHeader, StatusBadge, Modal, Pagination } from '@/components/ui';
import { usersApi } from '@/lib/api';
import { User, Role } from '@/types';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Mail,
  Phone,
  Edit2,
  Trash2,
  AlertCircle,
  Key,
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'SALES_REP' as Role,
    password: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await usersApi.list({
        page: page.toString(),
        size: '10',
        sort: 'createdAt,desc',
      });
      if (res?.content) {
        setUsers(res.content);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'SALES_REP',
      password: 'Password123!',
      status: 'ACTIVE',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      password: '',
      status: u.status,
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (editingUser) {
        await usersApi.update(editingUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          role: formData.role,
          status: formData.status,
        });
      } else {
        await usersApi.create({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
          password: formData.password,
        });
      }

      setModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setError(err?.message || 'Failed to save team member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersApi.delete(id);
      loadUsers();
    } catch (err: any) {
      alert(err?.message || 'Failed to remove user');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !selectedRole || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardShell>
      <PageHeader
        title="Team Members &amp; RBAC Security"
        subtitle="Role-based access control governing HQ Admins, Field Sales Representatives, and Distributors"
        actions={
          <button
            id="add-user-btn"
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 text-sm shadow-brand-500/20"
          >
            <UserPlus size={16} />
            <span>Add Team Member</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['', 'ADMIN', 'SALES_REP', 'DISTRIBUTOR'].map((r) => (
            <button
              key={r}
              id={`filter-role-${r || 'all'}`}
              onClick={() => setSelectedRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedRole === r
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                  : 'bg-surface/50 text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
              }`}
            >
              {r ? r.replace('_', ' ') : 'All Roles'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="user-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member name or email..."
            className="input-field pl-10 text-xs py-2"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-surface/40">
                <th className="text-left px-5 py-3.5">User</th>
                <th className="text-left px-5 py-3.5">Contact Email</th>
                <th className="text-center px-5 py-3.5">Access Role</th>
                <th className="text-center px-5 py-3.5">Status</th>
                <th className="text-left px-5 py-3.5">Created Date</th>
                <th className="text-right px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/30">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-4">
                      <div className="skeleton h-6 w-full rounded" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 text-sm">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {u.firstName?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{u.fullName}</div>
                          {u.phone && (
                            <div className="text-[10px] text-slate-400">{u.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-300">{u.email}</td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`badge ${
                          u.role === 'ADMIN'
                            ? 'badge-brand'
                            : u.role === 'SALES_REP'
                            ? 'badge-info'
                            : 'badge-warning'
                        }`}
                      >
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-400">
                      {u.createdAt?.slice(0, 10)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`edit-user-${u.id}`}
                          onClick={() => openEditModal(u)}
                          title="Edit User"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          id={`delete-user-${u.id}`}
                          onClick={() => handleDelete(u.id)}
                          title="Delete User"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-surface-elevated transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
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

      {/* Modal: Create/Edit User */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit Team Member' : 'Provision Team Member Account'}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                First Name *
              </label>
              <input
                id="user-firstname-input"
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Marcus"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Last Name *
              </label>
              <input
                id="user-lastname-input"
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Vance"
                className="input-field text-xs"
              />
            </div>
          </div>

          {!editingUser && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Email Address *
              </label>
              <input
                id="user-email-input"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="m.vance@retailflow.com"
                className="input-field text-xs"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Platform Role *
              </label>
              <select
                id="user-role-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                className="select-field text-xs"
              >
                <option value="ADMIN">HQ Administrator</option>
                <option value="SALES_REP">Field Sales Representative</option>
                <option value="DISTRIBUTOR">Distributor / Warehouse</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                id="user-phone-input"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 987-6543"
                className="input-field text-xs"
              />
            </div>
          </div>

          {!editingUser && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Initial Temporary Password * (Min 6 Characters)
              </label>
              <input
                id="user-password-input"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field text-xs font-mono"
              />
            </div>
          )}

          {editingUser && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Account Status
              </label>
              <select
                id="user-status-select"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
                }
                className="select-field text-xs"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-border/50">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              id="user-submit-btn"
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs"
            >
              {submitting ? 'Saving...' : editingUser ? 'Update Member' : 'Provision Account'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
