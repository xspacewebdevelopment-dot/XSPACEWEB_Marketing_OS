"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Download,
  RefreshCw,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  Eye,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ListFilter,
  FileSpreadsheet,
  Mail,
  Coins,
  ShieldCheck,
  X,
  UserPlus,
  Layers,
  ExternalLink,
} from "lucide-react";
import { ResultsKPIs } from "./components/ResultsKPIs";
import { ResultsFilterBar } from "./components/ResultsFilterBar";
import { ResultDetailsDrawer } from "./components/ResultDetailsDrawer";
import { ListCleaningModal } from "./components/ListCleaningModal";
import { ExportModal } from "./components/ExportModal";
import { ReverifyModal } from "./components/ReverifyModal";
import type { CleaningRules } from "@/lib/types/verification-results";

export default function VerificationResultsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // URL-derived state
  const pageParam = parseInt(searchParams.get("page") || "1", 10) || 1;
  const limitParam = parseInt(searchParams.get("limit") || "25", 10) || 25;
  const sortByParam = searchParams.get("sortBy") || "verifiedAt";
  const sortOrderParam = searchParams.get("sortOrder") || "desc";
  const searchParam = searchParams.get("search") || "";
  const statusParam = searchParams.get("status") || "";
  const sourceParam = searchParams.get("source") || "";
  const jobIdParam = searchParams.get("jobId") || "";
  const domainParam = searchParams.get("domain") || "";
  const catchAllParam = searchParams.get("isCatchAll");
  const disposableParam = searchParams.get("isDisposable");
  const roleBasedParam = searchParams.get("isRoleBased");
  const deliverableParam = searchParams.get("isDeliverable");
  const dateFromParam = searchParams.get("dateFrom") || "";
  const dateToParam = searchParams.get("dateTo") || "";

  // Local component states
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState<any>({
    totalVerified: 0,
    validCount: 0,
    invalidCount: 0,
    riskyCount: 0,
    unknownCount: 0,
    validityRate: 0,
    singleCount: 0,
    bulkCount: 0,
    uniqueEmailsCount: 0,
    latestVerifiedAt: null,
    availableJobs: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAllMatching, setSelectAllMatching] = useState(false);

  // Modals & Panels
  const [drawerResult, setDrawerResult] = useState<any | null>(null);
  const [cleaningModalOpen, setCleaningModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [reverifyModalOpen, setReverifyModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lists & Contacts Integration
  const [lists, setLists] = useState<any[]>([]);
  const [addToListModalOpen, setAddToListModalOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/lists")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.lists) setLists(d.lists);
      })
      .catch(console.error);
  }, []);

  // Helper to sync state changes into URL search params
  const updateQueryParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  // Fetch paginated results and summary aggregations
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryString = searchParams.toString();
      const [resultsRes, summaryRes] = await Promise.all([
        fetch(`/api/dashboard/email-verification/results?${queryString}`, { cache: "no-store" }),
        fetch(`/api/dashboard/email-verification/results/summary?${queryString}`, { cache: "no-store" }),
      ]);

      if (!resultsRes.ok || !summaryRes.ok) {
        throw new Error("Failed to load verification records from server");
      }

      const resultsJson = await resultsRes.json();
      const summaryJson = await summaryRes.json();

      if (resultsJson.success && summaryJson.success) {
        setItems(resultsJson.data.items || []);
        setPagination(resultsJson.data.pagination);
        setSummary(summaryJson.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error retrieving verification records");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Selection handlers
  const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = items.map((i) => i.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIdSet = new Set(items.map((i) => i.id));
      setSelectedIds(selectedIds.filter((id) => !pageIdSet.has(id)));
      setSelectAllMatching(false);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    setSelectAllMatching(false);
  };

  const isCurrentPageFullySelected =
    items.length > 0 && items.every((i) => selectedIds.includes(i.id));

  // Sorting helper
  const handleSort = (field: string) => {
    if (sortByParam === field) {
      updateQueryParams({
        sortBy: field,
        sortOrder: sortOrderParam === "asc" ? "desc" : "asc",
      });
    } else {
      updateQueryParams({
        sortBy: field,
        sortOrder: "desc",
      });
    }
  };

  const getSortIcon = (field: string) => {
    if (sortByParam !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400" />;
    }
    return sortOrderParam === "asc" ? (
      <ArrowUp className="h-3 w-3 text-indigo-600 font-bold" />
    ) : (
      <ArrowDown className="h-3 w-3 text-indigo-600 font-bold" />
    );
  };

  // Row Quick Actions
  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddToContacts = async (id: string) => {
    try {
      const res = await fetch("/api/dashboard/email-verification/results/add-to-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultIds: [id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add contact");
      setNotice("Contact successfully saved to your workspace Contacts list.");
      setTimeout(() => setNotice(null), 4000);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving contact");
    }
  };

  const handleBulkAddToContacts = async (rules?: CleaningRules) => {
    try {
      const res = await fetch("/api/dashboard/email-verification/results/add-to-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultIds: selectedIds.length > 0 ? selectedIds : undefined,
          cleanedOnly: !!rules,
          cleaningRules: rules,
          filters: {
            search: searchParam || undefined,
            status: statusParam || undefined,
            source: sourceParam || undefined,
            jobId: jobIdParam || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add contacts");
      setNotice(data.message || "Eligible contacts successfully added.");
      setTimeout(() => setNotice(null), 4000);
      setCleaningModalOpen(false);
      handleClearSelection();
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving contacts");
    }
  };

  const handleBulkAddToList = async () => {
    if (!selectedListId) return;
    try {
      const res = await fetch("/api/dashboard/email-verification/results/add-to-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultIds: selectedIds.length > 0 ? selectedIds : undefined,
          listId: selectedListId,
          filters: {
            search: searchParam || undefined,
            status: statusParam || undefined,
            source: sourceParam || undefined,
            jobId: jobIdParam || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add contacts to list");
      setNotice(data.message || "Selected records added to contacts and assigned to list.");
      setTimeout(() => setNotice(null), 4000);
      setAddToListModalOpen(false);
      handleClearSelection();
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error adding to list");
    }
  };

  const isFiltered =
    !!searchParam ||
    !!statusParam ||
    !!sourceParam ||
    !!jobIdParam ||
    !!domainParam ||
    catchAllParam !== null ||
    disposableParam !== null ||
    roleBasedParam !== null ||
    deliverableParam !== null ||
    !!dateFromParam ||
    !!dateToParam;

  const handleClearAllFilters = () => {
    updateQueryParams({
      search: null,
      status: null,
      source: null,
      jobId: null,
      domain: null,
      isCatchAll: null,
      isDisposable: null,
      isRoleBased: null,
      isDeliverable: null,
      dateFrom: null,
      dateTo: null,
      page: "1",
    });
  };

  const statusConfig = {
    VALID: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "Valid",
    },
    INVALID: {
      badge: "bg-rose-50 text-rose-700 border-rose-200",
      label: "Invalid",
    },
    RISKY: {
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Risky",
    },
    UNKNOWN: {
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      label: "Unknown",
    },
  };

  return (
    <div className="space-y-6 pb-20">
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
        <span className="text-slate-900 font-medium">Verification Results & Cleaning</span>
      </div>

      {/* 2. Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Email Verification Results
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Audited Records
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Inspect verified contacts, isolate deliverable addresses, clean lists server-side, and export clean data without touching consent.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setCleaningModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>List Cleaning Engine</span>
          </button>

          <button
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            title="Refresh results"
            className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notice Alert */}
      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
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

      {/* 3. Real-Time KPI Cards (TASK 1) */}
      <ResultsKPIs summary={summary} isFiltered={isFiltered} />

      {/* 4. Advanced Search & Filter Toolbar (TASK 3) */}
      <ResultsFilterBar
        search={searchParam}
        onSearchChange={(val) => updateQueryParams({ search: val, page: "1" })}
        status={statusParam}
        onStatusChange={(val) => updateQueryParams({ status: val, page: "1" })}
        source={sourceParam}
        onSourceChange={(val) => updateQueryParams({ source: val, page: "1" })}
        jobId={jobIdParam}
        onJobIdChange={(val) => updateQueryParams({ jobId: val, page: "1" })}
        domain={domainParam}
        onDomainChange={(val) => updateQueryParams({ domain: val, page: "1" })}
        isCatchAll={
          catchAllParam === "true" ? true : catchAllParam === "false" ? false : undefined
        }
        onCatchAllChange={(val) =>
          updateQueryParams({ isCatchAll: val !== undefined ? String(val) : null, page: "1" })
        }
        isDisposable={
          disposableParam === "true" ? true : disposableParam === "false" ? false : undefined
        }
        onDisposableChange={(val) =>
          updateQueryParams({ isDisposable: val !== undefined ? String(val) : null, page: "1" })
        }
        isRoleBased={
          roleBasedParam === "true" ? true : roleBasedParam === "false" ? false : undefined
        }
        onRoleBasedChange={(val) =>
          updateQueryParams({ isRoleBased: val !== undefined ? String(val) : null, page: "1" })
        }
        isDeliverable={
          deliverableParam === "true" ? true : deliverableParam === "false" ? false : undefined
        }
        onDeliverableChange={(val) =>
          updateQueryParams({ isDeliverable: val !== undefined ? String(val) : null, page: "1" })
        }
        dateFrom={dateFromParam}
        onDateFromChange={(val) => updateQueryParams({ dateFrom: val, page: "1" })}
        dateTo={dateToParam}
        onDateToChange={(val) => updateQueryParams({ dateTo: val, page: "1" })}
        onClearFilters={handleClearAllFilters}
        isFiltered={isFiltered}
        totalFilteredCount={pagination.total}
        availableJobs={summary.availableJobs || []}
      />

      {/* 5. Results Table Container (TASK 2) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Selection Header Banner */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2 font-medium">
              <span>{selectedIds.length} item(s) selected on this page.</span>
              {pagination.total > items.length && !selectAllMatching && (
                <button
                  onClick={() => setSelectAllMatching(true)}
                  className="font-bold underline text-indigo-700 hover:text-indigo-900 cursor-pointer"
                >
                  Select all {pagination.total} matching records across all pages
                </button>
              )}
              {selectAllMatching && (
                <span className="font-bold text-indigo-700">
                  All {pagination.total} matching records selected.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAddToContacts()}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Selected to Contacts
              </button>
              <button
                onClick={() => setAddToListModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
              >
                <Layers className="w-3.5 h-3.5" />
                Add Selected to List
              </button>
              <button
                onClick={handleClearSelection}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer ml-1"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && items.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Loading verification records from database...
            </p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-12 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800">Failed to load records</h3>
              <p className="text-[11px] text-slate-500">{error}</p>
            </div>
            <button
              onClick={fetchData}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <ListFilter className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-slate-800">
                {isFiltered ? "No matching verification records" : "No verification records yet"}
              </h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                {isFiltered
                  ? "Try resetting your search query or loosening filter rules to view records."
                  : "Run Single Verification or upload Bulk contact lists to audit and populate results."}
              </p>
            </div>
            {isFiltered && (
              <button
                onClick={handleClearAllFilters}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-slate-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* Real Data Table */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={isCurrentPageFullySelected}
                      onChange={handleSelectAllOnPage}
                      className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Email Address</span>
                      {getSortIcon("email")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th className="px-4 py-3">Provider Status</th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("overallScore")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Risk / Quality</span>
                      {getSortIcon("overallScore")}
                    </div>
                  </th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Batch / Job</th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("verifiedAt")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Verified Date</span>
                      {getSortIcon("verifiedAt")}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isChecked = selectedIds.includes(item.id);
                  const statusInfo =
                    statusConfig[item.status as keyof typeof statusConfig] ||
                    statusConfig.UNKNOWN;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isChecked ? "bg-indigo-50/30" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(item.id)}
                          className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Email Address */}
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 max-w-xs truncate">
                            {item.email}
                          </span>
                          <button
                            onClick={() => handleCopyEmail(item.email, item.id)}
                            title="Copy email address"
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            {copiedId === item.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          {(item.hasContact || item.contact?.id) && (
                            <Link
                              href={`/dashboard/contacts/${item.contact.id}`}
                              className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-0.5 shrink-0"
                              title="Contact exists in audience"
                            >
                              <UserCheck className="w-2.5 h-2.5" />
                              Contact
                            </Link>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.badge}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Provider Status */}
                      <td className="px-4 py-3 text-slate-600">
                        <span className="capitalize">{item.providerStatus || "—"}</span>
                        {item.providerSubstatus && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                            {item.providerSubstatus}
                          </span>
                        )}
                      </td>

                      {/* Quality Score */}
                      <td className="px-4 py-3 text-slate-700">
                        {item.overallScore !== null && item.overallScore !== undefined ? (
                          <div className="flex items-center gap-1 font-semibold">
                            <span>{item.overallScore}</span>
                            <span className="text-slate-400 text-[10px]">/100</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3">
                        {item.source === "SINGLE" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Mail className="h-2.5 w-2.5" />
                            <span>Single</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            <FileSpreadsheet className="h-2.5 w-2.5" />
                            <span>Bulk</span>
                          </span>
                        )}
                      </td>

                      {/* Origin Job */}
                      <td className="px-4 py-3 text-slate-500 max-w-[140px] truncate">
                        {item.job ? (
                          <Link
                            href={`/dashboard/email-verification/jobs/${item.job.id}`}
                            className="text-blue-600 hover:underline truncate block"
                            title={item.job.filename}
                          >
                            {item.job.filename}
                          </Link>
                        ) : (
                          <span>Single Verification</span>
                        )}
                      </td>

                      {/* Verified Date */}
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(item.verifiedAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDrawerResult(item)}
                            className="p-1 text-slate-500 hover:text-indigo-600 transition-colors"
                            title="View Signal Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {item.hasContact || item.contact?.id ? (
                            <Link
                              href={`/dashboard/contacts/${item.contact.id}`}
                              className="p-1 text-slate-500 hover:text-indigo-600 transition-colors"
                              title="View Contact Profile"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-indigo-600" />
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleAddToContacts(item.id)}
                              className="p-1 text-slate-500 hover:text-emerald-600 transition-colors"
                              title="Add to Workspace Contacts"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <Link
                            href={`/dashboard/email-verification/single?email=${encodeURIComponent(
                              item.email
                            )}`}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold"
                            title="Re-verify individual mailbox"
                          >
                            Re-verify
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 bg-white">
          <div className="flex items-center gap-3">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total
              results)
            </span>
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                value={limitParam}
                onChange={(e) => updateQueryParams({ limit: e.target.value, page: "1" })}
                className="px-2 py-1 rounded border border-slate-200 text-xs text-slate-700 bg-white cursor-pointer"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              onClick={() => updateQueryParams({ page: String(Math.max(1, pagination.page - 1)) })}
              disabled={pagination.page <= 1}
              className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                updateQueryParams({
                  page: String(Math.min(pagination.totalPages, pagination.page + 1)),
                })
              }
              disabled={pagination.page >= pagination.totalPages}
              className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Floating Bulk Actions Bar (TASK 7) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 text-xs animate-slide-up border border-slate-800">
          <span className="font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>{selectedIds.length} Selected</span>
          </span>

          <div className="h-4 w-px bg-slate-700" />

          <button
            onClick={() => setExportModalOpen(true)}
            className="hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Selected</span>
          </button>

          <button
            onClick={() => handleBulkAddToContacts()}
            className="hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Add to Contacts</span>
          </button>

          <button
            onClick={() => setReverifyModalOpen(true)}
            className="hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Re-verify</span>
          </button>

          <button
            onClick={handleClearSelection}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 7. Slide-over Details Drawer (TASK 4) */}
      <ResultDetailsDrawer
        result={drawerResult}
        onClose={() => setDrawerResult(null)}
        onReverify={(email) =>
          router.push(`/dashboard/email-verification/single?email=${encodeURIComponent(email)}`)
        }
        onAddToContacts={(id) => handleAddToContacts(id)}
      />

      {/* 8. List Cleaning Engine Modal (TASK 5) */}
      <ListCleaningModal
        isOpen={cleaningModalOpen}
        onClose={() => setCleaningModalOpen(false)}
        activeFilters={{
          search: searchParam || undefined,
          status: statusParam || undefined,
          source: sourceParam || undefined,
          jobId: jobIdParam || undefined,
          domain: domainParam || undefined,
          isCatchAll:
            catchAllParam === "true" ? true : catchAllParam === "false" ? false : undefined,
          isDisposable:
            disposableParam === "true" ? true : disposableParam === "false" ? false : undefined,
          isRoleBased:
            roleBasedParam === "true" ? true : roleBasedParam === "false" ? false : undefined,
          isDeliverable:
            deliverableParam === "true" ? true : deliverableParam === "false" ? false : undefined,
        }}
        selectedIds={selectedIds}
        totalRecordsCount={pagination.total}
        onSaveToContacts={(rules) => handleBulkAddToContacts(rules)}
      />

      {/* 9. Export Modal (TASK 6) */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        selectedIds={selectedIds}
        totalRecordsCount={pagination.total}
        activeFilters={{
          search: searchParam || undefined,
          status: statusParam || undefined,
          source: sourceParam || undefined,
          jobId: jobIdParam || undefined,
          domain: domainParam || undefined,
        }}
      />

      {/* 10. Re-verify Confirmation Modal (TASK 7) */}
      <ReverifyModal
        isOpen={reverifyModalOpen}
        onClose={() => setReverifyModalOpen(false)}
        selectedIds={selectedIds}
        onSuccess={(msg) => {
          setNotice(msg);
          handleClearSelection();
          fetchData();
        }}
      />

      {/* Add Selected to List Modal */}
      {addToListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Selected to List</h3>
                  <p className="text-xs text-slate-500">
                    Assign {selectedIds.length} verified contact{selectedIds.length > 1 ? "s" : ""} to a list
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddToListModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination List
                </label>
                {lists.length === 0 ? (
                  <p className="text-xs text-slate-500 p-3 bg-slate-50 rounded-xl">
                    No lists available yet. Create a list under Lists & Segments first.
                  </p>
                ) : (
                  <select
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Contact List --</option>
                    {lists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.contactCount} contacts)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <p className="text-[11px] text-slate-500">
                Selected records will be saved into Contacts (with Pending consent) and enrolled in the specified list.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAddToListModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedListId}
                onClick={handleBulkAddToList}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm disabled:opacity-50"
              >
                Confirm & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
