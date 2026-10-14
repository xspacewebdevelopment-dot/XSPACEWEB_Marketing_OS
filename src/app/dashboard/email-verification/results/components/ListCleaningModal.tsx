"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Download,
  UserCheck,
  RefreshCw,
  Sliders,
  Layers,
  ArrowRight,
} from "lucide-react";
import { CleaningRules, DEFAULT_CLEANING_RULES } from "@/lib/types/verification-results";
import { formatNumber } from "@/lib/utils";

interface ListCleaningModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: any;
  selectedIds?: string[];
  totalRecordsCount: number;
  onSaveToContacts: (rules: CleaningRules) => void;
}

export function ListCleaningModal({
  isOpen,
  onClose,
  activeFilters,
  selectedIds,
  totalRecordsCount,
  onSaveToContacts,
}: ListCleaningModalProps) {
  const [rules, setRules] = useState<CleaningRules>(DEFAULT_CLEANING_RULES);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<"csv" | "xlsx" | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  const calculateCleaning = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/email-verification/results/clean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleaningRules: rules,
          filters: activeFilters,
          selectedIds: selectedIds && selectedIds.length > 0 ? selectedIds : undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setMetrics(json.data.metrics);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [rules, activeFilters, selectedIds]);

  useEffect(() => {
    if (isOpen) {
      calculateCleaning();
    }
  }, [isOpen, calculateCleaning]);

  const toggleRule = (key: keyof CleaningRules) => {
    setRules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDownload = async (format: "csv" | "xlsx") => {
    try {
      setDownloading(format);
      const res = await fetch("/api/dashboard/email-verification/results/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          exportType: "cleaned",
          cleaningRules: rules,
          filters: activeFilters,
          selectedIds: selectedIds && selectedIds.length > 0 ? selectedIds : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Export generation failed");
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `nexareach_cleaned_emails.${format}`;
      if (contentDisposition && contentDisposition.includes("filename=")) {
        filename = contentDisposition
          .split("filename=")[1]
          .replace(/["']/g, "")
          .trim();
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to download export");
    } finally {
      setDownloading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  List Cleaning Engine
                </h2>
                <p className="text-xs text-slate-500">
                  Exclude high-risk, undeliverable and duplicate contacts to maximize deliverability
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Real-time Recalculated Metric Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-[11px] font-medium text-slate-500 block">Original Records</span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">
                  {metrics ? formatNumber(metrics.totalOriginal) : formatNumber(totalRecordsCount)}
                </span>
                <span className="text-[10px] text-slate-500">Target dataset</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-rose-50/40">
                <span className="text-[11px] font-medium text-rose-700 block">Excluded Records</span>
                <span className="text-xl font-bold text-rose-600 mt-0.5 block">
                  {metrics ? formatNumber(metrics.totalExcluded) : "—"}
                </span>
                <span className="text-[10px] text-rose-600/80">Filtered out</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-emerald-50/40">
                <span className="text-[11px] font-medium text-emerald-700 block">Eligible Clean List</span>
                <span className="text-xl font-bold text-emerald-600 mt-0.5 block">
                  {metrics ? formatNumber(metrics.eligibleCount) : "—"}
                </span>
                <span className="text-[10px] text-emerald-600/80">Deliverable mailboxes</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-indigo-50/40">
                <span className="text-[11px] font-medium text-indigo-700 block">Cleaning Ratio</span>
                <span className="text-xl font-bold text-indigo-600 mt-0.5 block">
                  {metrics ? `${metrics.cleaningPercentage}%` : "—"}
                </span>
                <span className="text-[10px] text-indigo-600/80">Reduction factor</span>
              </div>
            </div>

            {/* Interactive Rules Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Configurable Cleaning Rules</span>
                </h3>
                {loading && (
                  <span className="text-xs text-indigo-600 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Recalculating...</span>
                  </span>
                )}
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {/* 1. Exclude Invalid */}
                <label className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer bg-white">
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold text-slate-900 block">
                      Exclude Invalid & Inactive Mailboxes
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Removes addresses that fail SMTP handshake, nonexistent mailboxes, or disabled accounts.
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {metrics && (
                      <span className="text-[11px] text-rose-600 font-semibold">
                        -{metrics.excludedInvalid}
                      </span>
                    )}
                    <input
                      type="checkbox"
                      checked={!!rules.excludeInvalid}
                      onChange={() => toggleRule("excludeInvalid")}
                      className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </label>

                {/* 2. Remove Duplicates */}
                <label className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer bg-white">
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold text-slate-900 block">
                      Remove Duplicate Addresses
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Retains only the newest verified record for each normalized email address.
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {metrics && (
                      <span className="text-[11px] text-amber-600 font-semibold">
                        -{metrics.duplicateCount}
                      </span>
                    )}
                    <input
                      type="checkbox"
                      checked={!!rules.removeDuplicates}
                      onChange={() => toggleRule("removeDuplicates")}
                      className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </label>

                {/* 3. Exclude Suppressed Contacts */}
                <label className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer bg-white">
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold text-slate-900 block">
                      Exclude Suppressed Contacts
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Filters out addresses present in the workspace suppression list.
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {metrics && (
                      <span className="text-[11px] text-rose-600 font-semibold">
                        -{metrics.excludedSuppressed}
                      </span>
                    )}
                    <input
                      type="checkbox"
                      checked={!!rules.excludeSuppressed}
                      onChange={() => toggleRule("excludeSuppressed")}
                      className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </label>

                {/* 4. Exclude Disposable Mail */}
                <label className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer bg-white">
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold text-slate-900 block">
                      Exclude Disposable & Temporary Domains
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Eliminates temporary inbox services (Mailinator, 10MinuteMail, TempMail).
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {metrics && (
                      <span className="text-[11px] text-amber-600 font-semibold">
                        -{metrics.excludedDisposable}
                      </span>
                    )}
                    <input
                      type="checkbox"
                      checked={!!rules.excludeDisposable}
                      onChange={() => toggleRule("excludeDisposable")}
                      className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </label>

                {/* 5. Exclude Catch-All */}
                <label className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer bg-white">
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold text-slate-900 block">
                      Exclude Catch-All Servers
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Avoids domains configured to accept all incoming mail without verifying individual mailbox existence.
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {metrics && (
                      <span className="text-[11px] text-amber-600 font-semibold">
                        -{metrics.excludedCatchAll}
                      </span>
                    )}
                    <input
                      type="checkbox"
                      checked={!!rules.excludeCatchAll}
                      onChange={() => toggleRule("excludeCatchAll")}
                      className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </label>

                {/* 6. Exclude Role-Based Accounts */}
                <label className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer bg-white">
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold text-slate-900 block">
                      Exclude Role-Based Addresses
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Excludes department inboxes such as info@, sales@, billing@, support@.
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {metrics && (
                      <span className="text-[11px] text-amber-600 font-semibold">
                        -{metrics.excludedRoleBased}
                      </span>
                    )}
                    <input
                      type="checkbox"
                      checked={!!rules.excludeRoleBased}
                      onChange={() => toggleRule("excludeRoleBased")}
                      className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </label>

                {/* 7. Exclude Unknown */}
                <label className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer bg-white">
                  <div className="space-y-0.5 pr-4">
                    <span className="font-semibold text-slate-900 block">
                      Exclude Unknown Server Responses
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Omits addresses whose MX servers timed out or returned inconclusive status.
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {metrics && (
                      <span className="text-[11px] text-slate-600 font-semibold">
                        -{metrics.excludedUnknown}
                      </span>
                    )}
                    <input
                      type="checkbox"
                      checked={!!rules.excludeUnknown}
                      onChange={() => toggleRule("excludeUnknown")}
                      className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              onClick={() => onSaveToContacts(rules)}
              disabled={loading || (metrics && metrics.eligibleCount === 0)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <UserCheck className="h-4 w-4 text-blue-600" />
              <span>Save Cleaned List to Contacts</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload("csv")}
                disabled={loading || downloading !== null || (metrics && metrics.eligibleCount === 0)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{downloading === "csv" ? "Exporting..." : "Download Clean CSV"}</span>
              </button>

              <button
                onClick={() => handleDownload("xlsx")}
                disabled={loading || downloading !== null || (metrics && metrics.eligibleCount === 0)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{downloading === "xlsx" ? "Exporting..." : "Download Clean XLSX"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
