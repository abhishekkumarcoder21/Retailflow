'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { PageHeader, StatusBadge, Modal, Pagination } from '@/components/ui';
import { distributorsApi, territoriesApi } from '@/lib/api';
import { Distributor, Territory } from '@/types';
import { Truck, Plus, Search, MapPin, Phone, Mail, Edit2, Trash2, AlertCircle } from 'lucide-react';

export default function DistributorsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    territoryId: '',
    status: 'ACTIVE',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDistributors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await distributorsApi.list({
        page: page.toString(),
        size: '10',
        sort: 'name,asc',
      });
      if (res?.content) {
        setDistributors(res.content);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load distributors:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadDistributors();
  }, [loadDistributors]);

  useEffect(() => {
    async function loadTerritoriesList() {
      try {
        const res = await territoriesApi.list({ size: '100' });
        if (res?.content) setTerritories(res.content);
      } catch (err) {
        console.error('Error loading territories:', err);
      }
    }
    loadTerritoriesList();
  }, []);

  const openCreateModal = () => {
    setEditingDistributor(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      territoryId: territories[0]?.id ? String(territories[0].id) : '',
      status: 'ACTIVE',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (d: Distributor) => {
    setEditingDistributor(d);
    setFormData({
      name: d.name,
      contactPerson: d.contactPerson || '',
      phone: d.phone || '',
      email: d.email || '',
      address: d.address || '',
      territoryId: d.territoryId ? String(d.territoryId) : '',
      status: d.status || 'ACTIVE',
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

      if (editingDistributor) {
        await distributorsApi.update(editingDistributor.id, payload);
      } else {
        await distributorsApi.create(payload);
      }

      setModalOpen(false);
      loadDistributors();
    } catch (err: any) {
      setError(err?.message || 'Failed to save distributor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate or remove this distributor?')) return;
    try {
      await distributorsApi.delete(id);
      loadDistributors();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete distributor');
    }
  };

  const filteredDistributors = distributors.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.contactPerson?.toLowerCase().includes(q) ||
      d.territoryName?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardShell>
      <PageHeader
        title="Wholesale Distributors &amp; 3PL Hubs"
        subtitle="Manage logistics partners, warehouse nodes, and regional fulfillment hubs"
        actions={
          <button
            id="add-distributor-btn"
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 text-sm shadow-brand-500/20"
          >
            <Plus size={16} />
            <span>Add Distributor</span>
          </button>
        }
      />

      <div className="glass-card p-4 mb-6 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="distributor-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search distributor or contact..."
            className="input-field pl-10 text-xs py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-44 animate-pulse">
              <div className="skeleton h-5 w-3/4 mb-3" />
              <div className="skeleton h-4 w-1/2 mb-4" />
              <div className="skeleton h-8 w-full" />
            </div>
          ))
        ) : filteredDistributors.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center text-slate-500 text-sm">
            No distributors registered.
          </div>
        ) : (
          filteredDistributors.map((d) => (
            <div
              key={d.id}
              className="glass-card p-5 hover:border-brand-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                      <Truck size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">{d.name}</h2>
                      <p className="text-[11px] text-slate-400">
                        Contact: {d.contactPerson || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-brand-400 flex-shrink-0" />
                    <span>Territory: {d.territoryName || 'All Territories'}</span>
                  </div>
                  {d.address && (
                    <div className="text-[11px] text-slate-400 pl-5 truncate">
                      {d.address}
                    </div>
                  )}
                  {d.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400 flex-shrink-0" />
                      <span>{d.phone}</span>
                    </div>
                  )}
                  {d.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{d.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-surface-border/40">
                <button
                  id={`edit-distributor-${d.id}`}
                  onClick={() => openEditModal(d)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
                  title="Edit Distributor"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  id={`delete-distributor-${d.id}`}
                  onClick={() => handleDelete(d.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-surface-elevated transition-colors"
                  title="Delete Distributor"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Modal: Create/Edit Distributor */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDistributor ? 'Edit Distributor Node' : 'Register Distributor Node'}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Distributor Company Name *
            </label>
            <input
              id="distributor-name-input"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Lone Star Logistics &amp; Distribution"
              className="input-field text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Contact Person
              </label>
              <input
                id="distributor-contact-input"
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Marcus Sterling"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Assigned Territory
              </label>
              <select
                id="distributor-territory-select"
                value={formData.territoryId}
                onChange={(e) => setFormData({ ...formData, territoryId: e.target.value })}
                className="select-field text-xs"
              >
                <option value="">All / Regional</option>
                {territories.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                id="distributor-phone-input"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 789-0123"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Dispatch Email
              </label>
              <input
                id="distributor-email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="orders@lonestarlogistics.com"
                className="input-field text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Warehouse Facility Address
            </label>
            <input
              id="distributor-address-input"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Building 4B, Industrial Park Blvd, Austin, TX"
              className="input-field text-xs"
            />
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
              id="distributor-submit-btn"
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs"
            >
              {submitting ? 'Saving...' : editingDistributor ? 'Update Node' : 'Register Node'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
