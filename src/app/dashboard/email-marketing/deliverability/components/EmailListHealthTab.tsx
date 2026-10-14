"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Users,
  Search,
  CheckCircle2,
  Filter,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldBan,
  AlertOctagon,
  RefreshCw,
} from "lucide-react";

interface ListHealthTabProps {
  stats: {
    contactsCount: number;
    totalVerified: number;
    validCount: number;
    invalidCount: number;
    catchAllCount: number;
    disposableCount: number;
    roleCount: number;
    unknownCount: number;
    suppressionCount: number;
    listHealthPercentage: number | null;
  };
  onRefreshOverview: () => void;
}

export function EmailListHealthTab({ stats, onRefreshOverview }: ListHealthTabProps) {
  const [filter, setFilter] = useState<string>("RISKY"); // RISKY, INVALID, UNKNOWN, SUPPRESSED, ALL
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Selection state
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [suppressReason, setSuppressReason] = useState<"INVALID" | "RISKY" | "DISPOSABLE" | "MANUAL">("INVALID");
  const [isSuppressing, setIsSuppressing] = useState(false);
  const [suppressNotice, setSuppressNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("filter", filter);
      params.set("page", String(page));
      params.set("limit", "20");
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/dashboard/email-marketing/deliverability/list-health?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.success) {
        setItems(json.data || []);
        setPagination(json.pagination || { total: 0, totalPages: 1 });
        setSelectedEmails([]);
      }
    } catch (err) {
      console.error("Failed to load list health data:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, page, search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const toggleSelect = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const selectAllCurrentPage = () => {
    if (selectedEmails.length === items.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(items.map((i) => i.email || i.normalizedEmail));
    }
  };

  const handleOpenSuppressModal = (reason: "INVALID" | "RISKY" | "DISPOSABLE" | "MANUAL") => {
    setSuppressReason(reason);
    setConfirmText("");
    setSuppressNotice(null);
    setConfirmModalOpen(true);
  };

  const handleConfirmSuppress = async () => {
    if (confirmText.trim().toUpperCase() !== "CONFIRM" && confirmText.trim().toUpperCase() !== "SUPPRESS") {
      setSuppressNotice({
        type: "error",
        text: "Please type 'CONFIRM' or 'SUPPRESS' to verify your intent.",
      });
      return;
    }

    try {
      setIsSuppressing(true);
      setSuppressNotice(null);

      const res = await fetch("/api/dashboard/email-marketing/deliverability/list-health/suppress-risky", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: selectedEmails,
          reason: suppressReason,
          confirmationText: confirmText,
          notes: `Suppressed via Deliverability List Health review (${selectedEmails.length} addresses)`,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setConfirmModalOpen(false);
        setSelectedEmails([]);
        onRefreshOverview();
        fetchContacts();
      } else {
        setSuppressNotice({
          type: "error",
          text: json.error || "Failed to suppress selected contacts.",
        });
      }
    } catch {
      setSuppressNotice({
        type: "error",
        text: "Network error during suppression.",
      });
    } finally {
      setIsSuppressing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* List Quality Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Valid */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valid Mailboxes</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900 mt-2 block tracking-tight">{stats.validCount}</span>
            <span className="text-[10px] text-emerald-700 font-medium">High deliverability</span>
          </div>
        </div>

        {/* Catch-All */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Catch-All</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900 mt-2 block tracking-tight">{stats.catchAllCount}</span>
            <span className="text-[10px] text-amber-700 font-medium">Uncertain status</span>
          </div>
        </div>

        {/* Invalid */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-rose-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Invalid</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <XCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900 mt-2 block tracking-tight">{stats.invalidCount}</span>
            <span className="text-[10px] text-rose-700 font-medium">Hard bounce risk</span>
          </div>
        </div>

        {/* Disposable */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-orange-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Disposable</span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
              <AlertOctagon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900 mt-2 block tracking-tight">{stats.disposableCount}</span>
            <span className="text-[10px] text-orange-700 font-medium">Temporary mail</span>
          </div>
        </div>

        {/* Unknown */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unknown</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
              <HelpCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900 mt-2 block tracking-tight">{stats.unknownCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Timeout / DNS fail</span>
          </div>
        </div>

        {/* Active Suppressions */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-purple-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suppressed</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
              <ShieldBan className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900 mt-2 block tracking-tight">{stats.suppressionCount}</span>
            <span className="text-[10px] text-purple-700 font-medium">Protected from sends</span>
          </div>
        </div>
      </div>

      {/* Reoon Transparency Alert */}
      <div className="p-4 rounded-2xl border border-blue-200/80 bg-blue-50/50 text-slate-700 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="text-xs space-y-0.5">
          <p className="font-bold text-slate-900">Genuine Reoon Verification Insights</p>
          <p className="text-slate-600 leading-relaxed">
            NexaReach presents actual Reoon verification attributes. Catch-all and unknown addresses are <strong>never</strong> reinterpreted as guaranteed deliverable. Sending to unverified catch-alls increases bounce exposure.
          </p>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "RISKY", label: "Risky / Catch-All", count: stats.catchAllCount + stats.disposableCount + stats.roleCount },
            { key: "INVALID", label: "Invalid", count: stats.invalidCount },
            { key: "UNKNOWN", label: "Unknown", count: stats.unknownCount },
            { key: "SUPPRESSED", label: "Suppressed", count: stats.suppressionCount },
            { key: "ALL", label: "All Verified", count: stats.totalVerified },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === tab.key
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filter === tab.key ? "bg-white/20 text-white" : "bg-white text-slate-700 border border-slate-200 shadow-2xs"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {selectedEmails.length > 0 && filter !== "SUPPRESSED" && (
            <button
              onClick={() => handleOpenSuppressModal(filter === "INVALID" ? "INVALID" : "RISKY")}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-500 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
            >
              Suppress Selected ({selectedEmails.length})
            </button>
          )}

          <Link
            href="/dashboard/email-verification"
            className="p-1.5 rounded-xl bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
            title="Open Email Verification Center"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Risky Contacts Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                {filter !== "SUPPRESSED" && (
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selectedEmails.length === items.length}
                      onChange={selectAllCurrentPage}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                )}
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Classification & Reason</th>
                <th className="py-2.5 px-3">Contact Association</th>
                <th className="py-2.5 px-3">Suppression State</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading contact deliverability records...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-500/60" />
                    <p className="font-bold text-slate-800">No matching contacts found</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {filter === "INVALID"
                        ? "Great news: Zero invalid mailboxes detected in this view."
                        : "No contacts match the current deliverability filter."}
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const email = item.email || item.normalizedEmail;
                  const isSelected = selectedEmails.includes(email);
                  const isSuppressed = item.isSuppressed || filter === "SUPPRESSED";

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? "bg-blue-50/40" : ""
                      }`}
                    >
                      {filter !== "SUPPRESSED" && (
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(email)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {email}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            item.status === "VALID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : item.status === "INVALID"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : item.status === "SUPPRESSED"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px]">
                        <div className="flex items-center gap-1 flex-wrap">
                          {item.isCatchAll && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[10px]">
                              Catch-All
                            </span>
                          )}
                          {item.isDisposable && (
                            <span className="px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 font-semibold text-[10px]">
                              Disposable
                            </span>
                          )}
                          {item.isRoleBased && (
                            <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-[10px]">
                              Role Account
                            </span>
                          )}
                          <span className="text-slate-500 truncate max-w-[200px]" title={item.reason || item.providerSubstatus || "Verified"}>
                            {item.reason || item.providerSubstatus || "Standard mailbox"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-500">
                        {item.contact ? (
                          <span className="font-medium text-slate-700">
                            {item.contact.firstName || ""} {item.contact.lastName || ""}
                            {item.contact.company ? ` (${item.contact.company})` : ""}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Direct verification</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {isSuppressed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-purple-700 font-bold">
                            <ShieldBan className="h-3.5 w-3.5" /> Suppressed
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Active</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isSuppressed ? (
                          <button
                            onClick={() => {
                              setSelectedEmails([email]);
                              handleOpenSuppressModal(item.status === "INVALID" ? "INVALID" : "RISKY");
                            }}
                            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                          >
                            Suppress
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page <strong className="text-slate-700">{page}</strong> of <strong className="text-slate-700">{pagination.totalPages}</strong> ({pagination.total} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Explicit Confirmation Modal for Safety */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Explicit Suppression Confirmation</h3>
                <p className="text-xs text-slate-500">Required safety guard for bulk operations</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to suppress <strong>{selectedEmails.length}</strong> email address(es). Once suppressed, NexaReach will automatically block outbound campaigns and sequences to these recipients to protect your domain reputation.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 max-h-24 overflow-y-auto font-mono space-y-0.5">
              {selectedEmails.slice(0, 10).map((e, idx) => (
                <div key={idx} className="truncate">• {e}</div>
              ))}
              {selectedEmails.length > 10 && (
                <div className="text-slate-400">...and {selectedEmails.length - 10} more</div>
              )}
            </div>

            {suppressNotice && (
              <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium">
                {suppressNotice.text}
              </p>
            )}

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Type <span className="text-rose-600 font-mono font-bold">CONFIRM</span> to proceed:
              </label>
              <input
                type="text"
                placeholder="CONFIRM"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 font-mono focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuppress}
                disabled={isSuppressing || confirmText.trim().toUpperCase() !== "CONFIRM"}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 shadow-xs cursor-pointer"
              >
                {isSuppressing ? "Suppressing..." : "Confirm Suppression"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
