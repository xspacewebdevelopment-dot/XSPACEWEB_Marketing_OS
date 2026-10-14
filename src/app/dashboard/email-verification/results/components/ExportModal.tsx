"use client";

import { useState } from "react";
import { X, Download, FileSpreadsheet, CheckCircle2, ShieldCheck, Filter } from "lucide-react";
import type { CleaningRules } from "@/lib/types/verification-results";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  totalRecordsCount: number;
  activeFilters: any;
}

export function ExportModal({
  isOpen,
  onClose,
  selectedIds,
  totalRecordsCount,
  activeFilters,
}: ExportModalProps) {
  const [exportType, setExportType] = useState<
    "cleaned" | "valid_only" | "filtered" | "selected" | "invalid" | "risky" | "unknown"
  >(selectedIds.length > 0 ? "selected" : "cleaned");
  const [format, setFormat] = useState<"csv" | "xlsx">("csv");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/email-verification/results/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          exportType,
          selectedIds: exportType === "selected" ? selectedIds : undefined,
          filters: activeFilters,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate export");
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `nexareach_export_${exportType}.${format}`;
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
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to download export file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Export Verification Data</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-xs">
            {/* Export Scope / Type Selection */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Export Category</label>
              <div className="space-y-1.5">
                {[
                  {
                    id: "cleaned",
                    label: "Cleaned List (Recommended)",
                    desc: "Removes duplicates, invalid, risky, disposable and unknown addresses.",
                  },
                  {
                    id: "valid_only",
                    label: "Valid Only",
                    desc: "All confirmed deliverable mailboxes.",
                  },
                  {
                    id: "filtered",
                    label: "All Current Matching Results",
                    desc: `All ${totalRecordsCount} records matching your active filters.`,
                  },
                  ...(selectedIds.length > 0
                    ? [
                        {
                          id: "selected",
                          label: `Selected Records Only (${selectedIds.length})`,
                          desc: "Exports specifically checked table rows.",
                        },
                      ]
                    : []),
                  {
                    id: "invalid",
                    label: "Invalid Mailboxes Separately",
                    desc: "Bounced and undeliverable addresses for suppression audit.",
                  },
                  {
                    id: "risky",
                    label: "Risky Mailboxes Separately",
                    desc: "Catch-all and disposable mailboxes.",
                  },
                  {
                    id: "unknown",
                    label: "Unknown Results Separately",
                    desc: "Unresponsive servers for retry analysis.",
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                      exportType === item.id
                        ? "border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportType"
                      value={item.id}
                      checked={exportType === item.id}
                      onChange={() => setExportType(item.id as any)}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 block">{item.label}</span>
                      <span className="text-[11px] text-slate-500">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">File Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat("csv")}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    format === "csv"
                      ? "border-indigo-500 bg-indigo-50/40 text-indigo-900 font-semibold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="block font-bold">CSV</span>
                  <span className="text-[10px] text-slate-500">Comma-separated values</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("xlsx")}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    format === "xlsx"
                      ? "border-emerald-500 bg-emerald-50/40 text-emerald-900 font-semibold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="block font-bold">XLSX</span>
                  <span className="text-[10px] text-slate-500">Microsoft Excel Spreadsheet</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{loading ? "Generating..." : "Download File"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
