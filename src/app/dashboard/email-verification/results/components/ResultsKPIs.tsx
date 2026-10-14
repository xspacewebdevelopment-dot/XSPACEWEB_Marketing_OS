"use client";

import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Percent,
  Mail,
  FileSpreadsheet,
  Users,
  Clock,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface SummaryData {
  totalVerified: number;
  validCount: number;
  invalidCount: number;
  riskyCount: number;
  unknownCount: number;
  validityRate: number;
  singleCount: number;
  bulkCount: number;
  uniqueEmailsCount: number;
  latestVerifiedAt: string | null;
}

export function ResultsKPIs({
  summary,
  isFiltered,
}: {
  summary: SummaryData;
  isFiltered: boolean;
}) {
  return (
    <div className="space-y-3">
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Verified */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Verified</span>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatNumber(summary.totalVerified)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {isFiltered ? "Matching current filter" : "Across all jobs & single"}
          </div>
        </div>

        {/* Valid Emails */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Valid Emails</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight">
            {formatNumber(summary.validCount)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Safe to deliver</div>
        </div>

        {/* Invalid Emails */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Invalid Emails</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 tracking-tight">
            {formatNumber(summary.invalidCount)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Bounces & rejected</div>
        </div>

        {/* Risky Emails */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Risky Emails</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 tracking-tight">
            {formatNumber(summary.riskyCount)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Catch-all & disposable</div>
        </div>

        {/* Unknown Emails */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Unknown</span>
            <HelpCircle className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-600 tracking-tight">
            {formatNumber(summary.unknownCount)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Unresponsive MX</div>
        </div>

        {/* Validity Rate */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Validity Rate</span>
            <Percent className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 tracking-tight">
            {summary.validityRate}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Quality score index</div>
        </div>
      </div>

      {/* Secondary Aggregation Ribbon */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-slate-500">Single Checks:</span>
            <span className="font-semibold text-slate-900">{formatNumber(summary.singleCount)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-slate-500">Bulk Records:</span>
            <span className="font-semibold text-slate-900">{formatNumber(summary.bulkCount)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-slate-500">Unique Mailboxes:</span>
            <span className="font-semibold text-slate-900">{formatNumber(summary.uniqueEmailsCount)}</span>
          </div>
        </div>

        {summary.latestVerifiedAt && (
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Latest: {new Date(summary.latestVerifiedAt).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
