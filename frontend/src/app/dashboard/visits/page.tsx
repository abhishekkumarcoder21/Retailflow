'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { PageHeader, StatusBadge, Modal, Pagination } from '@/components/ui';
import { visitsApi, retailersApi } from '@/lib/api';
import { Visit, Retailer, VisitStatus } from '@/types';
import {
  MapPin,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Compass,
  AlertCircle,
  Store,
  Navigation,
  FileText,
} from 'lucide-react';

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modals
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedVisitForComplete, setSelectedVisitForComplete] = useState<Visit | null>(null);

  // Check-In Form State
  const [selectedRetailerId, setSelectedRetailerId] = useState<number | ''>('');
  const [latitude, setLatitude] = useState<number>(30.2672);
  const [longitude, setLongitude] = useState<number>(-97.7431);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Complete Form State
  const [outcome, setOutcome] = useState('Order Taken');
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeSubmitting, setCompleteSubmitting] = useState(false);

  const loadVisits = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: page.toString(),
        size: '10',
        sort: 'createdAt,desc',
      };
      if (selectedStatus) params.status = selectedStatus;

      const res = await visitsApi.list(params);
      if (res?.content) {
        setVisits(res.content);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load visits:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  useEffect(() => {
    async function loadRetailersList() {
      try {
        const res = await retailersApi.list({ size: '100' });
        if (res?.content) {
          setRetailers(res.content);
          if (res.content.length > 0) setSelectedRetailerId(res.content[0].id);
        }
      } catch (err) {
        console.error('Error loading retailers:', err);
      }
    }
    loadRetailersList();
  }, []);

  const acquireGps = () => {
    if ('geolocation' in navigator) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(6)));
          setLongitude(Number(pos.coords.longitude.toFixed(6)));
          setGpsLoading(false);
        },
        (err) => {
          console.warn('Geolocation denied or unavailable, using simulated GPS coordinates', err);
          // Default Austin downtown coordinates
          setLatitude(30.2672);
          setLongitude(-97.7431);
          setGpsLoading(false);
        },
        { timeout: 5000 }
      );
    }
  };

  const openCheckInModal = () => {
    setActionError(null);
    setCheckInNotes('');
    acquireGps();
    setCheckInModalOpen(true);
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRetailerId) return;

    try {
      setCheckInSubmitting(true);
      setActionError(null);

      await visitsApi.checkIn({
        retailerId: Number(selectedRetailerId),
        latitude,
        longitude,
        notes: checkInNotes || undefined,
      });

      setCheckInModalOpen(false);
      loadVisits();
    } catch (err: any) {
      setActionError(err?.message || 'Check-in failed');
    } finally {
      setCheckInSubmitting(false);
    }
  };

  const openCompleteModal = (visit: Visit) => {
    setSelectedVisitForComplete(visit);
    setOutcome('Order Placed Successfully');
    setCompleteNotes('');
    setActionError(null);
    setCompleteModalOpen(true);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitForComplete) return;

    try {
      setCompleteSubmitting(true);
      setActionError(null);

      await visitsApi.complete(selectedVisitForComplete.id, {
        outcome,
        notes: completeNotes || undefined,
      });

      setCompleteModalOpen(false);
      setSelectedVisitForComplete(null);
      loadVisits();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to complete visit');
    } finally {
      setCompleteSubmitting(false);
    }
  };

  const handleCancelVisit = async (id: number) => {
    if (!confirm('Cancel this scheduled field visit?')) return;
    try {
      await visitsApi.cancel(id);
      loadVisits();
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel visit');
    }
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Field Visits &amp; Geocoded Audits"
        subtitle="GPS-authenticated field sales visits, store check-ins, and visit completion logs"
        actions={
          <button
            id="start-checkin-btn"
            onClick={openCheckInModal}
            className="btn-primary flex items-center gap-2 text-sm shadow-brand-500/20"
          >
            <Compass size={16} />
            <span>Record Store Check-In</span>
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="glass-card p-4 mb-6 flex items-center gap-2 overflow-x-auto">
        {[
          { label: 'All Visits', value: '' },
          { label: 'Checked In', value: 'CHECKED_IN' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Planned', value: 'PLANNED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ].map((f) => (
          <button
            key={f.value}
            id={`filter-visits-${f.value || 'all'}`}
            onClick={() => {
              setSelectedStatus(f.value);
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === f.value
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                : 'bg-surface/50 text-slate-400 hover:text-slate-200 hover:bg-surface-elevated'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Visits Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-surface/40">
                <th className="text-left px-5 py-3.5">Store / Retailer</th>
                <th className="text-left px-5 py-3.5">Field Rep</th>
                <th className="text-left px-5 py-3.5">Check-In Time</th>
                <th className="text-left px-5 py-3.5">GPS Verification</th>
                <th className="text-center px-5 py-3.5">Status</th>
                <th className="text-left px-5 py-3.5">Outcome / Notes</th>
                <th className="text-right px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/30">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="skeleton h-6 w-full rounded" />
                    </td>
                  </tr>
                ))
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                    No field sales visits recorded. Click &quot;Record Store Check-In&quot; to begin.
                  </td>
                </tr>
              ) : (
                visits.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-elevated/30 transition-colors">
                    <td className="px-5 py-4 text-xs font-bold text-white">
                      {v.retailerName}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-300">{v.userName}</td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-400">
                      {v.checkInTime ? v.checkInTime.slice(0, 16).replace('T', ' ') : 'Planned'}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono">
                      {v.latitude && v.longitude ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <Navigation size={12} />
                          <span>
                            {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-500">No GPS data</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-300 max-w-xs">
                      {v.outcome && (
                        <span className="font-semibold text-brand-300 mr-1">
                          [{v.outcome}]
                        </span>
                      )}
                      <span className="text-slate-400">{v.notes || '—'}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {v.status === 'CHECKED_IN' && (
                          <button
                            id={`complete-visit-${v.id}`}
                            onClick={() => openCompleteModal(v)}
                            title="Complete Visit"
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 transition-colors"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {(v.status === 'PLANNED' || v.status === 'CHECKED_IN') && (
                          <button
                            id={`cancel-visit-${v.id}`}
                            onClick={() => handleCancelVisit(v.id)}
                            title="Cancel Visit"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-surface-elevated transition-colors"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
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

      {/* Modal: Check-In */}
      <Modal
        open={checkInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        title="Record Retail Store Check-In"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle size={15} />
            <span>{actionError}</span>
          </div>
        )}

        <form onSubmit={handleCheckInSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Select Store / Retailer *
            </label>
            <select
              id="checkin-retailer-select"
              required
              value={selectedRetailerId}
              onChange={(e) => setSelectedRetailerId(Number(e.target.value))}
              className="select-field text-xs"
            >
              {retailers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.businessName} ({r.city || 'Central'})
                </option>
              ))}
            </select>
          </div>

          {/* GPS Coordinates preview */}
          <div className="p-3.5 rounded-xl bg-surface/70 border border-surface-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Navigation size={14} className="text-brand-400" />
                <span>Geocoded GPS Coordinates</span>
              </span>
              <button
                type="button"
                onClick={acquireGps}
                disabled={gpsLoading}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
              >
                {gpsLoading ? 'Acquiring...' : 'Refresh GPS'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-300">
              <div className="bg-surface-card p-2 rounded border border-surface-border/40">
                <span className="text-slate-500">Lat: </span>
                <span className="text-emerald-400">{latitude}</span>
              </div>
              <div className="bg-surface-card p-2 rounded border border-surface-border/40">
                <span className="text-slate-500">Lng: </span>
                <span className="text-emerald-400">{longitude}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Arrival Notes / Agenda
            </label>
            <textarea
              id="checkin-notes-input"
              rows={2}
              value={checkInNotes}
              onChange={(e) => setCheckInNotes(e.target.value)}
              placeholder="e.g. Arrived for bi-weekly shelf replenishment & promo audit"
              className="input-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-border/50">
            <button
              type="button"
              onClick={() => setCheckInModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              id="confirm-checkin-btn"
              type="submit"
              disabled={checkInSubmitting}
              className="btn-primary text-xs"
            >
              {checkInSubmitting ? 'Verifying & Checking In...' : 'Verify & Check In'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Complete Visit */}
      <Modal
        open={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title={`Complete Visit — ${selectedVisitForComplete?.retailerName}`}
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle size={15} />
            <span>{actionError}</span>
          </div>
        )}

        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Visit Outcome *
            </label>
            <select
              id="complete-outcome-select"
              required
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="select-field text-xs"
            >
              <option value="Order Taken">Order Taken &amp; Submitted</option>
              <option value="Shelf Restocked">Shelf Restocked / Inventory Verified</option>
              <option value="Product Demo Conducted">Product Demo / Samples Provided</option>
              <option value="Follow-up Scheduled">Follow-up Meeting Scheduled</option>
              <option value="Store Closed / Rescheduled">Store Closed / Rescheduled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Completion Summary &amp; Feedback
            </label>
            <textarea
              id="complete-notes-input"
              rows={3}
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
              placeholder="e.g. Store manager requested additional beverage cases for upcoming weekend festival..."
              className="input-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-border/50">
            <button
              type="button"
              onClick={() => setCompleteModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              id="confirm-complete-visit-btn"
              type="submit"
              disabled={completeSubmitting}
              className="btn-primary text-xs"
            >
              {completeSubmitting ? 'Recording Outcome...' : 'Complete Visit'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
