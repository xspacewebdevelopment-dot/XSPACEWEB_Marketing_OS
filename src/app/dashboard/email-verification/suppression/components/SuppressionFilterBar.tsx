"use client";

import { Search, X, Filter } from "lucide-react";
import type { SuppressionReason, SuppressionSource, SuppressionStatus } from "@/lib/types/suppression";

interface SuppressionFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  reason: SuppressionReason | "ALL";
  onReasonChange: (val: SuppressionReason | "ALL") => void;
  source: SuppressionSource | "ALL";
  onSourceChange: (val: SuppressionSource | "ALL") => void;
  status: SuppressionStatus | "ALL";
  onStatusChange: (val: SuppressionStatus | "ALL") => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function SuppressionFilterBar({
  search,
  onSearchChange,
  reason,
  onReasonChange,
  source,
  onSourceChange,
  status,
  onStatusChange,
  onReset,
  hasActiveFilters,
}: SuppressionFilterBarProps) {
  return (
    <div className="p-3 sm:p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by email address or notes..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Reason selector */}
        <div className="flex items-center gap-2">
          <select
            value={reason}
            onChange={(e) => onReasonChange(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ALL">All Reasons</option>
            <option value="MANUAL_BLOCK">Manual Block</option>
            <option value="DO_NOT_CONTACT">Do Not Contact</option>
            <option value="UNSUBSCRIBED">Unsubscribed</option>
            <option value="HARD_BOUNCE">Hard Bounce</option>
            <option value="SPAM_COMPLAINT">Spam Complaint</option>
            <option value="SYSTEM_EXCLUSION">System Exclusion</option>
          </select>

          {/* Source selector */}
          <select
            value={source}
            onChange={(e) => onSourceChange(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ALL">All Sources</option>
            <option value="MANUAL">Manual</option>
            <option value="IMPORT">Bulk Import</option>
            <option value="BOUNCE">Automated Bounce</option>
            <option value="COMPLAINT">Spam Complaint</option>
            <option value="UNSUBSCRIBE">Unsubscribe</option>
            <option value="SYSTEM">System</option>
          </select>

          {/* Status selector */}
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ACTIVE">Active Only</option>
            <option value="REMOVED">Removed Only</option>
            <option value="ALL">All Statuses</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
