"use client";

import { useEffect, useState } from "react";
import { X, ShieldBan, ShieldCheck, Clock, User, FileText, History, Loader2 } from "lucide-react";
import { REASON_LABELS, SOURCE_LABELS } from "@/lib/types/suppression";

interface SuppressionDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entry: any | null;
}

export function SuppressionDetailsDrawer({
  isOpen,
  onClose,
  entry,
}: SuppressionDetailsDrawerProps) {
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !entry?.id) return;
    setLoading(true);
    fetch(`/api/dashboard/email-verification/suppression/${entry.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.auditHistory) {
          setAuditHistory(data.auditHistory);
        }
      })
      .catch((err) => console.error("Failed to fetch audit log:", err))
      .finally(() => setLoading(false));
  }, [isOpen, entry?.id]);

  if (!isOpen || !entry) return null;

  const isActive = entry.status === "ACTIVE";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
              isActive ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-slate-100 text-slate-500 border-slate-200"
            }`}>
              {isActive ? <ShieldBan className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Suppression Details</h3>
              <p className="text-[11px] text-slate-500">Audit trail and record metadata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Main Email Block */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                isActive
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-slate-100 text-slate-600 border-slate-300"
              }`}>
                {entry.status}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                ID: {entry.id.slice(0, 8)}...
              </span>
            </div>
            <div className="font-bold text-sm text-slate-900 break-all">
              {entry.email || entry.normalizedEmail}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Normalized: {entry.normalizedEmail}
            </div>
          </div>

          {/* Properties Table */}
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">Reason</span>
              <span className="font-semibold text-slate-800">
                {REASON_LABELS[entry.reason] || entry.reason}
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">Source</span>
              <span className="font-semibold text-slate-800">
                {SOURCE_LABELS[entry.source] || entry.source}
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">Added Date</span>
              <span className="font-medium text-slate-700">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500">Added By</span>
              <span className="font-medium text-slate-700">
                {entry.addedByUserEmail || "System"}
              </span>
            </div>
          </div>

          {/* Notes Block */}
          {entry.notes && (
            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-blue-900 text-[11px]">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Internal Audit Note</span>
              </div>
              <p className="text-blue-800 text-[11px] leading-relaxed italic">
                "{entry.notes}"
              </p>
            </div>
          )}

          {/* Removal Info (If Removed) */}
          {!isActive && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Suppression Lifted</span>
              </div>
              <div className="space-y-1 text-[11px] text-amber-800">
                <div>Removed At: <span className="font-medium">{entry.removedAt ? new Date(entry.removedAt).toLocaleString() : "N/A"}</span></div>
                <div>Removed By: <span className="font-medium">{entry.removedByUserEmail || "Team Member"}</span></div>
                <div>Justification: <span className="italic font-medium">"{entry.removalJustification}"</span></div>
              </div>
            </div>
          )}

          {/* Immutable Audit Timeline */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <History className="w-4 h-4 text-slate-500" />
              <span>Immutable Audit Trail</span>
            </div>

            {loading ? (
              <div className="py-6 flex items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading audit log...</span>
              </div>
            ) : auditHistory.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No additional audit events recorded.</p>
            ) : (
              <div className="relative pl-4 border-l border-slate-200 space-y-4">
                {auditHistory.map((item, idx) => (
                  <div key={idx} className="relative space-y-1">
                    <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">{item.action}</span>
                      <span className="text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      By {item.performedByUserEmail || "System"} • {item.justification || item.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
