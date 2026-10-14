"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  History as HistoryIcon,
  Mail,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Search,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Zap,
  Filter,
  UserCheck,
  UserPlus,
} from "lucide-react";

interface HistoryItem {
  id: string;
  kind: "SINGLE" | "BULK";
  title: string;
  status: string;
  mode: string;
  score: number | null;
  createdAt: string;
  summary: string;
  details?: any;
  contactId?: string | null;
  contactName?: string | null;
  hasContact?: boolean;
}

export default function VerificationHistoryPage() {
  const [filterType, setFilterType] = useState<"all" | "single" | "bulk">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [stats, setStats] = useState({ totalSingle: 0, totalBulk: 0, totalAll: 0 });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const fetchHistory = useCallback(
    async (currentPage = 1, currentFilter = filterType, search = searchQuery) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: "15",
          type: currentFilter,
        });
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(
          `/api/dashboard/email-verification/history?${params.toString()}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setItems(json.data.items || []);
            setPagination(json.data.pagination);
            setStats(json.data.stats);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [filterType, searchQuery]
  );

  useEffect(() => {
    fetchHistory(page, filterType, searchQuery);
  }, [fetchHistory, page, filterType]);

  const handleDeleteItem = async (item: HistoryItem) => {
    const isSingle = item.kind === "SINGLE";
    const confirmMsg = isSingle
      ? `Delete single verification record for "${item.title}"? This will clean up the database.`
      : `Delete bulk job "${item.title}" and its associated verification records? This will clean up the database.`;

    if (!window.confirm(confirmMsg)) return;

    setDeletingId(item.id);
    try {
      const endpoint = isSingle
        ? `/api/dashboard/email-verification/results/${item.id}`
        : `/api/dashboard/email-verification/jobs/${item.id}?action=delete`;

      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete verification record");
      }

      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setStats((prev) => ({
        ...prev,
        totalAll: Math.max(0, prev.totalAll - 1),
        totalSingle: isSingle ? Math.max(0, prev.totalSingle - 1) : prev.totalSingle,
        totalBulk: !isSingle ? Math.max(0, prev.totalBulk - 1) : prev.totalBulk,
      }));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      setNotice(`Successfully cleaned up ${isSingle ? "single verification" : "bulk job"} "${item.title}".`);
      setTimeout(() => setNotice(null), 3500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSingleToContacts = async (resultId: string, email: string, status: string) => {
    try {
      const res = await fetch("/api/dashboard/email-verification/results/add-to-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultIds: [resultId] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add to contacts");
      setNotice(`Added "${email}" to workspace Contacts.`);
      setTimeout(() => setNotice(null), 3500);
      fetchHistory(page, filterType, searchQuery);
    } catch (err: any) {
      alert(err.message || "Failed to add contact");
    }
  };

  const handleAddBulkToContacts = async (jobId: string, title: string) => {
    try {
      const res = await fetch("/api/dashboard/email-verification/results/add-to-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleanedOnly: true,
          cleaningRules: {
            excludeInvalid: true,
            excludeRisky: true,
            excludeDisposable: true,
            removeDuplicates: true,
          },
          filters: { jobId },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add contacts");
      setNotice(data.message || `Added eligible verified contacts from "${title}".`);
      setTimeout(() => setNotice(null), 4000);
      fetchHistory(page, filterType, searchQuery);
    } catch (err: any) {
      alert(err.message || "Failed to add bulk contacts");
    }
  };

  const getStatusBadge = (status: string, kind: "SINGLE" | "BULK") => {
    if (kind === "SINGLE") {
      switch (status) {
        case "VALID":
          return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "INVALID":
          return "bg-rose-50 text-rose-700 border-rose-200";
        case "RISKY":
          return "bg-amber-50 text-amber-700 border-amber-200";
        default:
          return "bg-slate-100 text-slate-700 border-slate-200";
      }
    } else {
      switch (status) {
        case "COMPLETED":
          return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "PROCESSING":
          return "bg-blue-50 text-blue-700 border-blue-200";
        case "FAILED":
          return "bg-rose-50 text-rose-700 border-rose-200";
        case "CANCELLED":
          return "bg-slate-100 text-slate-700 border-slate-200";
        default:
          return "bg-amber-50 text-amber-700 border-amber-200";
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/dashboard/email-verification"
          className="hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Overview
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Unified History</span>
      </div>

      {/* 2. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-indigo-600" />
              Verification History & Audit Log
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Live DB Synced
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Unified audit history of single email checks and bulk list verifications. Review quality scores, provider results, or clean up database records.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/email-verification/single"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
          >
            <Mail className="h-3.5 w-3.5 text-indigo-600" />
            <span>Single Verify</span>
          </Link>
          <Link
            href="/dashboard/email-verification/bulk"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Bulk Verify</span>
          </Link>
        </div>
      </div>

      {/* 3. Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">All Logged Verifications</span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalAll}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Total audit entries stored</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Single Verifications</span>
            <Mail className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{stats.totalSingle}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Individual mailbox audits</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Bulk Verification Jobs</span>
            <FileSpreadsheet className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalBulk}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">CSV, XLSX & TXT batch runs</p>
        </div>
      </div>

      {/* 4. Filter Bar & Search */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 w-fit">
            <button
              onClick={() => {
                setFilterType("all");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>All History</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/60 text-slate-700">
                {stats.totalAll}
              </span>
            </button>
            <button
              onClick={() => {
                setFilterType("single");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === "single"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Mail className="h-3 w-3 text-indigo-500" />
              <span>Single</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/60 text-slate-700">
                {stats.totalSingle}
              </span>
            </button>
            <button
              onClick={() => {
                setFilterType("bulk");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === "bulk"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="h-3 w-3 text-blue-500" />
              <span>Bulk Jobs</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/60 text-slate-700">
                {stats.totalBulk}
              </span>
            </button>
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search email or list filename..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  startTransition(() => {
                    fetchHistory(1, filterType, e.target.value);
                  });
                }}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 w-60 sm:w-72"
              />
            </div>
            <button
              onClick={() => fetchHistory(page, filterType, searchQuery)}
              disabled={loading}
              title="Refresh History"
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Notice alert */}
        {notice && (
          <div className="mx-5 my-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{notice}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold px-1 text-sm cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* 5. Items Table */}
        {items.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <HistoryIcon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-slate-800">
                No verification history found
              </h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? "No records match your search criteria. Try a different search."
                  : "All single and bulk email verification runs will be recorded here for audits."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Target / Item</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Summary & Audit Info</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isSingle = item.kind === "SINGLE";
                  return (
                    <tr key={`${item.kind}-${item.id}`} className="hover:bg-slate-50/70 transition-colors">
                      {/* Kind Badge */}
                      <td className="px-5 py-3">
                        {isSingle ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Mail className="h-2.5 w-2.5" />
                            <span>SINGLE</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <FileSpreadsheet className="h-2.5 w-2.5" />
                            <span>BULK</span>
                          </span>
                        )}
                      </td>

                      {/* Title & Mode */}
                      <td className="px-5 py-3 font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 max-w-xs truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {isSingle ? `Mode: ${item.mode}` : `Type: ${item.details?.sourceType || "CSV"}`}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                            item.status,
                            item.kind
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Summary */}
                      <td className="px-5 py-3 text-slate-600">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-800">{item.summary}</span>
                          {isSingle && item.score !== null && (
                            <span className="text-[10px] text-slate-500">
                              Deliverability Confidence: {item.score}/100
                            </span>
                          )}
                          {!isSingle && item.details && (
                            <span className="text-[10px] text-slate-500">
                              Valid: {item.details.validCount} • Invalid: {item.details.invalidCount} • Risky: {item.details.riskyCount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isSingle ? (
                            <>
                              {item.contactId ? (
                                <Link
                                  href={`/dashboard/contacts/${item.contactId}`}
                                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1"
                                  title="View Contact Profile"
                                >
                                  <UserCheck className="h-3 w-3" />
                                  <span>Contact</span>
                                </Link>
                              ) : (
                                <button
                                  onClick={() => handleAddSingleToContacts(item.id, item.title, item.status)}
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                                  title="Add to Workspace Contacts"
                                >
                                  <UserPlus className="h-3 w-3" />
                                  <span>Add</span>
                                </button>
                              )}
                              <Link
                                href={`/dashboard/email-verification/results?search=${encodeURIComponent(
                                  item.title
                                )}`}
                                className="text-xs text-slate-500 hover:text-slate-800"
                                title="Open in Results"
                              >
                                Result
                              </Link>
                              <Link
                                href={`/dashboard/email-verification/single?email=${encodeURIComponent(
                                  item.title
                                )}`}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                              >
                                Re-verify
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link
                                href={`/dashboard/email-verification/results?jobId=${item.id}`}
                                className="text-xs text-slate-500 hover:text-slate-800"
                                title="View itemized results"
                              >
                                Results
                              </Link>
                              <button
                                onClick={() => handleAddBulkToContacts(item.id, item.title)}
                                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                                title="Add valid contacts to workspace"
                              >
                                <UserPlus className="h-3 w-3" />
                                <span>Contacts</span>
                              </button>
                              <Link
                                href={`/dashboard/email-verification/jobs/${item.id}`}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Job</span>
                              </Link>
                            </>
                          )}
                          <span className="text-slate-200">|</span>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            disabled={deletingId === item.id}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer flex items-center gap-1 disabled:opacity-40"
                            title="Delete and clean up record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Pagination Bar */}
        {pagination.total > pagination.limit && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
