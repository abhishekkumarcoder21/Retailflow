'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { PageHeader, StatusBadge, Modal, Pagination } from '@/components/ui';
import { productsApi } from '@/lib/api';
import { Product } from '@/types';
import {
  Package,
  Plus,
  Search,
  Tag,
  DollarSign,
  Edit2,
  Trash2,
  AlertCircle,
  Boxes,
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Beverages',
    unit: 'case',
    basePrice: 0,
    status: 'ACTIVE',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        size: '12',
        sort: 'name,asc',
      };
      if (selectedCategory) params.category = selectedCategory;

      const res = await productsApi.list(params);
      if (res && res.content) {
        setProducts(res.content);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const catRes = await productsApi.categories();
        if (Array.isArray(catRes)) {
          setCategories(catRes);
        }
      } catch (err) {
        console.error('Error loading product categories:', err);
      }
    }
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      category: categories[0] || 'Beverages',
      unit: 'case',
      basePrice: 19.99,
      status: 'ACTIVE',
      description: '',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      sku: prod.sku,
      name: prod.name,
      category: prod.category || 'Beverages',
      unit: prod.unit || 'unit',
      basePrice: prod.basePrice,
      status: prod.status || 'ACTIVE',
      description: prod.description || '',
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
        basePrice: Number(formData.basePrice),
      };

      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
      } else {
        await productsApi.create(payload);
      }

      setModalOpen(false);
      loadProducts();
    } catch (err: any) {
      setError(err?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsApi.delete(id);
      loadProducts();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete product');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  });

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Product Catalog &amp; Master SKUs"
        subtitle="Manage stock-keeping units, wholesale pricing tiers, and categorization"
        actions={
          <button
            id="products-add-btn"
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 text-sm shadow-brand-500/20"
          >
            <Plus size={16} />
            <span>Add Product SKU</span>
          </button>
        }
      />

      {/* Filter and search bar */}
      <div className="glass-card p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            id="cat-filter-all"
            onClick={() => {
              setSelectedCategory('');
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === ''
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                : 'bg-surface/50 text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              id={`cat-filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                  : 'bg-surface/50 text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="products-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU or product title..."
            className="input-field pl-10 text-xs py-2"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-surface/40">
                <th className="text-left px-5 py-3.5">SKU Code</th>
                <th className="text-left px-5 py-3.5">Product Name</th>
                <th className="text-left px-5 py-3.5">Category</th>
                <th className="text-center px-5 py-3.5">Packaging Unit</th>
                <th className="text-right px-5 py-3.5">Base Price</th>
                <th className="text-center px-5 py-3.5">Status</th>
                <th className="text-right px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/30">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="skeleton h-6 w-full rounded" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                    No products found in this category.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-medium text-brand-300 text-xs">
                      {prod.sku}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-bold text-white">{prod.name}</div>
                      {prod.description && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {prod.description}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-surface/60 border border-surface-border/60 text-slate-300 text-[11px]">
                        {prod.category || 'General'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-center text-slate-400 font-mono">
                      {prod.unit}
                    </td>
                    <td className="px-5 py-4 text-xs text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(prod.basePrice)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={prod.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`edit-product-${prod.id}`}
                          onClick={() => openEditModal(prod)}
                          title="Edit SKU"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          id={`delete-product-${prod.id}`}
                          onClick={() => handleDelete(prod.id)}
                          title="Delete SKU"
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

      {/* Modal: Create / Edit Product */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Product SKU' : 'Register New Product SKU'}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                SKU Identifier *
              </label>
              <input
                id="product-sku-input"
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. BEV-001"
                className="input-field text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Category *
              </label>
              <input
                id="product-category-input"
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Beverages, Snacks, Dairy..."
                className="input-field text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Product Title *
              </label>
              <input
                id="product-name-input"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sparkling Spring Water 500ml (24-Pack)"
                className="input-field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Packaging Unit (e.g. case, box, kg)
              </label>
              <input
                id="product-unit-input"
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="case"
                className="input-field text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Wholesale Base Price (USD) *
              </label>
              <input
                id="product-price-input"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                className="input-field text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Description / Specifications
              </label>
              <textarea
                id="product-desc-input"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed packaging, volume, and storage requirements..."
                className="input-field text-xs"
              />
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
              id="product-submit-btn"
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs"
            >
              {submitting ? 'Saving...' : editingProduct ? 'Update SKU' : 'Save SKU'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
