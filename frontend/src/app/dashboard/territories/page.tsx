'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { PageHeader, StatusBadge, Modal, Pagination } from '@/components/ui';
import { territoriesApi } from '@/lib/api';
import { Territory } from '@/types';
import { MapPin, Plus, Search, Edit2, Trash2, AlertCircle, Globe } from 'lucide-react';

export default function TerritoriesPage() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    region: 'North America / Central',
    description: '',
    status: 'ACTIVE',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTerritories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await territoriesApi.list({
        page: page.toString(),
        size: '10',
        sort: 'name,asc',
      });
      if (res?.content) {
        setTerritories(res.content);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load territories:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadTerritories();
  }, [loadTerritories]);

  const openCreateModal = () => {
    setEditingTerritory(null);
    setFormData({
      name: '',
      region: 'North America / Central',
      description: '',
      status: 'ACTIVE',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (t: Territory) => {
    setEditingTerritory(t);
    setFormData({
      name: t.name,
      region: t.region || '',
      description: t.description || '',
      status: t.status || 'ACTIVE',
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (editingTerritory) {
        await territoriesApi.update(editingTerritory.id, formData);
      } else {
        await territoriesApi.create(formData);
      }

      setModalOpen(false);
      loadTerritories();
    } catch (err: any) {
      setError(err?.message || 'Failed to save territory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this territory?')) return;
    try {
      await territoriesApi.delete(id);
      loadTerritories();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete territory');
    }
  };

  const filteredTerritories = territories.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.region?.toLowerCase().includes(q);
  });

  return (
    <DashboardShell>
      <PageHeader
        title="Territory Zones &amp; Coverage"
        subtitle="Organize geographical distribution boundaries, sales routing, and store clustering"
        actions={
          <button
            id="add-territory-btn"
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 text-sm shadow-brand-500/20"
          >
            <Plus size={16} />
            <span>Create Territory</span>
          </button>
        }
      />

      <div className="glass-card p-4 mb-6 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="territory-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search territory name or region..."
            className="input-field pl-10 text-xs py-2"
          />
        </div>
      </div>

      {/* Grid of Territory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-40 animate-pulse">
              <div className="skeleton h-5 w-1/2 mb-3" />
              <div className="skeleton h-4 w-3/4 mb-4" />
              <div className="skeleton h-8 w-full" />
            </div>
          ))
        ) : filteredTerritories.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center text-slate-500 text-sm">
            No territories defined yet.
          </div>
        ) : (
          filteredTerritories.map((t) => (
            <div
              key={t.id}
              className="glass-card p-5 hover:border-brand-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <Globe size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">{t.name}</h2>
                      <p className="text-[11px] text-brand-300 font-medium">
                        {t.region || 'General Region'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>

                <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                  {t.description || 'No description provided for this territory zone.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-surface-border/40">
                <button
                  id={`edit-territory-${t.id}`}
                  onClick={() => openEditModal(t)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
                  title="Edit Territory"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  id={`delete-territory-${t.id}`}
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-surface-elevated transition-colors"
                  title="Delete Territory"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Modal: Create/Edit Territory */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTerritory ? 'Edit Territory Zone' : 'Create Territory Zone'}
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
              Territory Name *
            </label>
            <input
              id="territory-name-input"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Austin Metro North"
              className="input-field text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Geographic Region / State
            </label>
            <input
              id="territory-region-input"
              type="text"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              placeholder="e.g. Central Texas / Travis County"
              className="input-field text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Coverage Description
            </label>
            <textarea
              id="territory-desc-input"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Retail stores, commercial corridors, and delivery routing guidelines..."
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
              id="territory-submit-btn"
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs"
            >
              {submitting ? 'Saving...' : editingTerritory ? 'Update Territory' : 'Create Territory'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
