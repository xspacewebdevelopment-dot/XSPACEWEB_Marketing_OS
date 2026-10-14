"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Upload,
  Download,
  Copy,
  Check,
  Eye,
  Trash2,
  ShieldBan,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ExternalLink,
} from "lucide-react";
import { SuppressionKPIs } from "./components/SuppressionKPIs";
import { SuppressionFilterBar } from "./components/SuppressionFilterBar";
import { AddSuppressionModal } from "./components/AddSuppressionModal";
import { BulkImportModal } from "./components/BulkImportModal";
import { RemoveSuppressionModal } from "./components/RemoveSuppressionModal";
import { SuppressionDetailsDrawer } from "./components/SuppressionDetailsDrawer";
import type {
  SuppressionStats,
  SuppressionReason,
  SuppressionSource,
  SuppressionStatus,
} from "@/lib/types/suppression";
import { REASON_LABELS, SOURCE_LABELS } from "@/lib/types/suppression";

export default function SuppressionListPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [stats, setStats] = useState<SuppressionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [reason, setReason] = useState<SuppressionReason | "ALL">("ALL");
  const [source, setSource] = useState<SuppressionSource | "ALL">("ALL");
  const [status, setStatus] = useState<SuppressionStatus | "ALL">("ACTIVE");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedEntryForDetails, setSelectedEntryForDetails] = useState<any | null>(null);
  const [selectedEntryForRemove, setSelectedEntryForRemove] = useState<any | null>(null);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/dashboard/email-verification/suppression/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load suppression stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Table Entries
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (reason !== "ALL") params.set("reason", reason);
      if (source !== "ALL") params.set("source", source);
      if (status !== "ALL") params.set("status", status);

      const res = await fetch(`/api/dashboard/email-verification/suppression?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load suppression entries");
      }

      setEntries(data.entries || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to fetch entries");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, reason, source, status]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleCopy = (id: string, email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/dashboard/email-verification/suppression/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search: debouncedSearch || undefined,
          reason: reason !== "ALL" ? reason : undefined,
          source: source !== "ALL" ? source : undefined,
          status: status !== "ALL" ? status : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to export suppressions");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `suppression_list_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || "Export failed");
    }
  };

  const hasActiveFilters =
    Boolean(debouncedSearch) || reason !== "ALL" || source !== "ALL" || status !== "ACTIVE";

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setReason("ALL");
    setSource("ALL");
    setStatus("ACTIVE");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/dashboard/email-verification"
          className="hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Email Verification
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Suppression List</span>
      </div>

      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Suppression List
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Sender Guard
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Guaranteed exclusion repository. Any address registered here is strictly blocked from marketing campaign dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsBulkOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-xs font-semibold text-purple-700 shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-purple-600" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Suppression</span>
          </button>
        </div>
      </div>

      {/* Real Database KPI Summary Cards */}
      <SuppressionKPIs stats={stats} loading={statsLoading} />

      {/* Filter and Search Bar */}
      <SuppressionFilterBar
        search={search}
        onSearchChange={setSearch}
        reason={reason}
        onReasonChange={(r) => { setReason(r); setPage(1); }}
        source={source}
        onSourceChange={(s) => { setSource(s); setPage(1); }}
        status={status}
        onStatusChange={(st) => { setStatus(st); setPage(1); }}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Paginated Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading suppression records from PostgreSQL...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs space-y-2">
            <p className="font-semibold">Failed to load records</p>
            <p className="text-slate-500">{error}</p>
            <button
              onClick={fetchEntries}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
            >
              Retry
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <ShieldBan className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">
                {hasActiveFilters ? "No matching suppression records" : "Suppression list is empty"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Try resetting your search query or adjusting your filters."
                  : "You haven't added any suppressed email addresses yet. Add addresses manually or upload a bulk exclusion file."}
              </p>
            </div>
            {hasActiveFilters ? (
              <button
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Email</span>
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
                  <tr>
                    <th className="px-5 py-3">Email Address</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Added Date</th>
                    <th className="px-4 py-3">Added By</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry) => {
                    const isActive = entry.status === "ACTIVE";
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div>
                              {entry.contactName && (
                                <Link
                                  href={`/dashboard/contacts/${entry.contactId}`}
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                >
                                  {entry.contactName}
                                </Link>
                              )}
                              <span className="font-semibold text-slate-900 font-mono text-[11px]">
                                {entry.email || entry.normalizedEmail}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopy(entry.id, entry.email || entry.normalizedEmail)}
                              title="Copy email"
                              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                            >
                              {copiedId === entry.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {entry.notes && (
                            <p className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                              Note: {entry.notes}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded-md font-medium text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                            {REASON_LABELS[entry.reason] || entry.reason}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-600">
                          {SOURCE_LABELS[entry.source] || entry.source}
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                          {entry.addedByUserEmail || "System"}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                              isActive
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {entry.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {entry.contactId && (
                              <Link
                                href={`/dashboard/contacts/${entry.contactId}`}
                                className="p-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                                title="View Contact Profile"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            )}

                            <button
                              onClick={() => setSelectedEntryForDetails(entry)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                              title="View Details & Audit Log"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {isActive && (
                              <button
                                onClick={() => setSelectedEntryForRemove(entry)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-500 hover:text-amber-700 transition-colors"
                                title="Remove from Suppression List"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Toolbar */}
            <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Showing</span>
                <span className="font-semibold text-slate-800">
                  {entries.length > 0 ? (page - 1) * limit + 1 : 0} -{" "}
                  {Math.min(page * limit, totalRecords)}
                </span>
                <span>of</span>
                <span className="font-semibold text-slate-800">{totalRecords.toLocaleString()}</span>
                <span>records</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span>Rows:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-semibold text-slate-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialogs */}
      <AddSuppressionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          fetchStats();
          fetchEntries();
        }}
      />

      <BulkImportModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={() => {
          fetchStats();
          fetchEntries();
        }}
      />

      <RemoveSuppressionModal
        isOpen={!!selectedEntryForRemove}
        entry={selectedEntryForRemove}
        onClose={() => setSelectedEntryForRemove(null)}
        onSuccess={() => {
          fetchStats();
          fetchEntries();
        }}
      />

      <SuppressionDetailsDrawer
        isOpen={!!selectedEntryForDetails}
        entry={selectedEntryForDetails}
        onClose={() => setSelectedEntryForDetails(null)}
      />
    </div>
  );
}
