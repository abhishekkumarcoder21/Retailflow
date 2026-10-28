'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { PageHeader, StatusBadge, Modal, Pagination } from '@/components/ui';
import { retailersApi, territoriesApi, usersApi } from '@/lib/api';
import { Retailer, Territory, User } from '@/types';
import {
  Store,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Edit2,
  Trash2,
  UserPlus,
  UserCheck,
  AlertCircle,
  Building,
} from 'lucide-react';

export default function RetailersPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [salesReps, setSalesReps] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerritory, setSelectedTerritory] = useState<string>('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRetailer, setEditingRetailer] = useState<Retailer | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRetailerForAssign, setSelectedRetailerForAssign] = useState<Retailer | null>(null);
  const [selectedRepId, setSelectedRepId] = useState<number | ''>('');

  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    territoryId: '',
    status: 'ACTIVE',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRetailers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        size: '12',
        sort: 'businessName,asc',
      };
      if (selectedTerritory) params.territoryId = selectedTerritory;

      const res = await retailersApi.list(params);
      if (res && res.content) {
        setRetailers(res.content);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching retailers:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedTerritory]);

  useEffect(() => {
    loadRetailers();
  }, [loadRetailers]);

  useEffect(() => {
    async function loadAuxData() {
      try {
        const [terrRes, usersRes] = await Promise.all([
          territoriesApi.list({ size: '100' }),
          usersApi.list({ size: '100' }),
        ]);
        if (terrRes?.content) setTerritories(terrRes.content);
        if (usersRes?.content) {
          setSalesReps(usersRes.content.filter((u: User) => u.role === 'SALES_REP' || u.role === 'ADMIN'));
        }
      } catch (err) {
        console.error('Error loading aux options:', err);
      }
    }
    loadAuxData();
  }, []);

  const openCreateModal = () => {
    setEditingRetailer(null);
    setFormData({
      businessName: '',
      ownerName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      territoryId: territories[0]?.id ? String(territories[0].id) : '',
      status: 'ACTIVE',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (ret: Retailer) => {
    setEditingRetailer(ret);
    setFormData({
      businessName: ret.businessName || '',
      ownerName: ret.ownerName || '',
      phone: ret.phone || '',
      email: ret.email || '',
      address: ret.address || '',
      city: ret.city || '',
      state: ret.state || '',
      postalCode: ret.postalCode || '',
      territoryId: ret.territoryId ? String(ret.territoryId) : '',
      status: ret.status || 'ACTIVE',
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        territoryId: formData.territoryId ? Number(formData.territoryId) : undefined,
      };

      if (editingRetailer) {
        await retailersApi.update(editingRetailer.id, payload);
      } else {
        await retailersApi.create(payload);
      }

      setModalOpen(false);
      loadRetailers();
    } catch (err: any) {
      setError(err?.message || 'Failed to save retailer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate or remove this retailer?')) return;
    try {
      await retailersApi.delete(id);
      loadRetailers();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete retailer');
    }
  };

  const openAssignModal = (ret: Retailer) => {
    setSelectedRetailerForAssign(ret);
    setSelectedRepId(salesReps[0]?.id || '');
    setAssignModalOpen(true);
  };

  const handleAssignSalesRep = async () => {
    if (!selectedRetailerForAssign || !selectedRepId) return;
    try {
      await retailersApi.assign(selectedRetailerForAssign.id, Number(selectedRepId));
      setAssignModalOpen(false);
      loadRetailers();
    } catch (err: any) {
      alert(err?.message || 'Failed to assign sales rep');
    }
  };

  const handleUnassignSalesRep = async (retailerId: number, userId: number) => {
    try {
      await retailersApi.unassign(retailerId, userId);
      loadRetailers();
    } catch (err: any) {
      alert(err?.message || 'Failed to unassign sales rep');
    }
  };

  const filteredRetailers = retailers.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.businessName?.toLowerCase().includes(q) ||
      r.ownerName?.toLowerCase().includes(q) ||
      r.city?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardShell>
      <PageHeader
        title="Retail Stores Directory"
        subtitle="Manage licensed store accounts, territory allocations, and field rep assignments"
        actions={
          <button
            id="retailers-add-btn"
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 text-sm shadow-brand-500/20"
          >
            <Plus size={16} />
            <span>Add Retail Store</span>
          </button>
        }
      />

      {/* Filters and search */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            id="retailers-territory-filter"
            value={selectedTerritory}
            onChange={(e) => {
              setSelectedTerritory(e.target.value);
              setPage(0);
            }}
            className="select-field text-xs py-2 w-48"
          >
            <option value="">All Territories</option>
            {territories.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="retailers-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search store name, city, owner..."
            className="input-field pl-10 text-xs py-2"
          />
        </div>
      </div>

      {/* Grid of Retailers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-44 animate-pulse">
              <div className="skeleton h-5 w-3/4 mb-3" />
              <div className="skeleton h-4 w-1/2 mb-4" />
              <div className="skeleton h-10 w-full" />
            </div>
          ))
        ) : filteredRetailers.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center text-slate-500 text-sm">
            No retail stores found matching criteria.
          </div>
        ) : (
          filteredRetailers.map((ret) => (
            <div
              key={ret.id}
              className="glass-card p-5 hover:border-brand-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                      <Store size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white leading-tight">
                        {ret.businessName}
                      </h2>
                      <p className="text-[11px] text-slate-400">Owner: {ret.ownerName || 'N/A'}</p>
                    </div>
                  </div>
                  <StatusBadge status={ret.status} />
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-brand-400 flex-shrink-0" />
                    <span className="truncate">
                      {ret.city || 'Unknown City'}
                      {ret.state ? `, ${ret.state}` : ''} •{' '}
                      <span className="text-brand-300 font-medium">
                        {ret.territoryName || 'No Territory'}
                      </span>
                    </span>
                  </div>

                  {ret.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400 flex-shrink-0" />
                      <span>{ret.phone}</span>
                    </div>
                  )}

                  {ret.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{ret.email}</span>
                    </div>
                  )}
                </div>

                {/* Assigned Sales Reps */}
                <div className="mt-4 pt-3 border-t border-surface-border/50">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-slate-400 uppercase font-semibold">Assigned Reps</span>
                    <button
                      id={`assign-rep-btn-${ret.id}`}
                      onClick={() => openAssignModal(ret)}
                      className="text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
                    >
                      <UserPlus size={12} />
                      <span>Assign</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ret.assignedSalesRepNames && ret.assignedSalesRepNames.length > 0 ? (
                      ret.assignedSalesRepNames.map((name, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-brand-500/10 text-brand-300 border border-brand-500/20"
                        >
                          <UserCheck size={11} />
                          <span>{name}</span>
                          {ret.assignedSalesRepIds && (
                            <button
                              type="button"
                              onClick={() => handleUnassignSalesRep(ret.id, ret.assignedSalesRepIds![i])}
                              className="text-slate-400 hover:text-red-400 ml-0.5"
                              title="Unassign"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No sales rep assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-surface-border/40">
                <button
                  id={`edit-retailer-${ret.id}`}
                  onClick={() => openEditModal(ret)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
                  title="Edit Store"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  id={`delete-retailer-${ret.id}`}
                  onClick={() => handleDelete(ret.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-surface-elevated transition-colors"
                  title="Delete Store"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Modal: Create / Edit Store */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRetailer ? 'Edit Retail Store' : 'Add New Retail Store'}
        size="md"
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Business Name *
              </label>
              <input
                id="retailer-name-input"
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Metro Mart Downtown"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Store Owner / Manager
              </label>
              <input
                id="retailer-owner-input"
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="e.g. David Vance"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Territory *
              </label>
              <select
                id="retailer-territory-select"
                value={formData.territoryId}
                onChange={(e) => setFormData({ ...formData, territoryId: e.target.value })}
                className="select-field text-xs"
              >
                <option value="">Select Territory</option>
                {territories.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                id="retailer-phone-input"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 234-5678"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="retailer-email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@metromart.com"
                className="input-field text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Physical Address
              </label>
              <input
                id="retailer-address-input"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="104 Elm Street, Suite 400"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                City
              </label>
              <input
                id="retailer-city-input"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Austin"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                State &amp; Postal Code
              </label>
              <div className="flex gap-2">
                <input
                  id="retailer-state-input"
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="TX"
                  className="input-field text-xs w-20"
                />
                <input
                  id="retailer-zip-input"
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="78701"
                  className="input-field text-xs flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-border/50">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              id="retailer-submit-btn"
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs"
            >
              {submitting ? 'Saving...' : editingRetailer ? 'Update Store' : 'Create Store'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Sales Rep */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Sales Rep to ${selectedRetailerForAssign?.businessName}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Designate a field representative responsible for scheduled check-ins, store visits, and replenishments.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Select Field Sales Rep
            </label>
            <select
              id="assign-rep-select"
              value={selectedRepId}
              onChange={(e) => setSelectedRepId(Number(e.target.value))}
              className="select-field text-xs"
            >
              {salesReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.fullName} ({rep.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-border/50">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              id="confirm-assign-rep-btn"
              type="button"
              onClick={handleAssignSalesRep}
              className="btn-primary text-xs"
            >
              Confirm Assignment
            </button>
          </div>
        </div>
      </Modal>
    </DashboardShell>
  );
}
