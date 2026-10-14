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
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Valid Mailboxes</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-emerald-400 mt-2">{stats.validCount}</span>
          <span className="text-[10px] text-slate-400 mt-0.5">High deliverability</span>
        </div>

        {/* Catch-All */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Catch-All</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-xl font-bold text-amber-400 mt-2">{stats.catchAllCount}</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Uncertain status</span>
        </div>

        {/* Invalid */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Invalid</span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <span className="text-xl font-bold text-rose-400 mt-2">{stats.invalidCount}</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Hard bounce risk</span>
        </div>

        {/* Disposable */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Disposable</span>
            <AlertOctagon className="h-4 w-4 text-orange-400" />
          </div>
          <span className="text-xl font-bold text-orange-400 mt-2">{stats.disposableCount}</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Temporary mail</span>
        </div>

        {/* Unknown */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Unknown</span>
            <HelpCircle className="h-4 w-4 text-slate-400" />
          </div>
          <span className="text-xl font-bold text-slate-300 mt-2">{stats.unknownCount}</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Timeout / DNS fail</span>
        </div>

        {/* Active Suppressions */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Suppressed</span>
            <ShieldBan className="h-4 w-4 text-purple-400" />
          </div>
          <span className="text-xl font-bold text-purple-400 mt-2">{stats.suppressionCount}</span>
          <span className="text-[10px] text-slate-400 mt-0.5">Protected from sends</span>
        </div>
      </div>

      {/* Reoon Transparency Alert */}
      <div className="p-4 rounded-xl border border-blue-900/40 bg-blue-950/20 text-slate-300 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-white">Genuine Reoon Verification Insights</p>
          <p className="text-slate-400 leading-relaxed">
            NexaReach presents actual Reoon verification attributes. Catch-all and unknown addresses are <strong>never</strong> reinterpreted as guaranteed deliverable. Sending to unverified catch-alls increases bounce exposure.
          </p>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filter === tab.key
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filter === tab.key ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"
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
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {selectedEmails.length > 0 && filter !== "SUPPRESSED" && (
            <button
              onClick={() => handleOpenSuppressModal(filter === "INVALID" ? "INVALID" : "RISKY")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition-colors whitespace-nowrap shadow-sm"
            >
              Suppress Selected ({selectedEmails.length})
            </button>
          )}

          <Link
            href="/dashboard/email-verification"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            title="Open Email Verification Center"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Risky Contacts Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                {filter !== "SUPPRESSED" && (
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selectedEmails.length === items.length}
                      onChange={selectAllCurrentPage}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
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
            <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Loading contact deliverability records...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-500/40" />
                    <p className="font-medium text-slate-300">No matching contacts found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
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
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? "bg-blue-950/20" : ""
                      }`}
                    >
                      {filter !== "SUPPRESSED" && (
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(email)}
                            className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                          />
                        </td>
                      )}
                      <td className="py-3 px-3 font-mono font-medium text-slate-200">
                        {email}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            item.status === "VALID"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : item.status === "INVALID"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : item.status === "SUPPRESSED"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px]">
                        <div className="flex items-center gap-1 flex-wrap">
                          {item.isCatchAll && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium">
                              Catch-All
                            </span>
                          )}
                          {item.isDisposable && (
                            <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-medium">
                              Disposable
                            </span>
                          )}
                          {item.isRoleBased && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                              Role Account
                            </span>
                          )}
                          <span className="text-slate-400 truncate max-w-[200px]" title={item.reason || item.providerSubstatus || "Verified"}>
                            {item.reason || item.providerSubstatus || "Standard mailbox"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-400">
                        {item.contact ? (
                          <span>
                            {item.contact.firstName || ""} {item.contact.lastName || ""}
                            {item.contact.company ? ` (${item.contact.company})` : ""}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Direct verification</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {isSuppressed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-purple-400 font-medium">
                            <ShieldBan className="h-3.5 w-3.5" /> Suppressed
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Active</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isSuppressed ? (
                          <button
                            onClick={() => {
                              setSelectedEmails([email]);
                              handleOpenSuppressModal(item.status === "INVALID" ? "INVALID" : "RISKY");
                            }}
                            className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                          >
                            Suppress
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500">Protected</span>
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
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing Page {page} of {pagination.totalPages} ({pagination.total} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Explicit Confirmation Modal for Safety */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="h-10 w-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Explicit Suppression Confirmation</h3>
                <p className="text-xs text-slate-400">Required safety guard for bulk operations</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to suppress <strong>{selectedEmails.length}</strong> email address(es). Once suppressed, NexaReach will automatically block outbound campaigns and sequences to these recipients to protect your domain reputation.
            </p>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 max-h-24 overflow-y-auto font-mono space-y-0.5">
              {selectedEmails.slice(0, 10).map((e, idx) => (
                <div key={idx} className="truncate">• {e}</div>
              ))}
              {selectedEmails.length > 10 && (
                <div className="text-slate-500">...and {selectedEmails.length - 10} more</div>
              )}
            </div>

            {suppressNotice && (
              <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900">
                {suppressNotice.text}
              </p>
            )}

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-200 block">
                Type <span className="text-rose-400 font-mono">CONFIRM</span> to proceed:
              </label>
              <input
                type="text"
                placeholder="CONFIRM"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-slate-950 border border-slate-800 text-white font-mono focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuppress}
                disabled={isSuppressing || confirmText.trim().toUpperCase() !== "CONFIRM"}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-40 shadow-sm"
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
