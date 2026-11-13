"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  Search,
  Download,
  RotateCw,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PhoneOff,
  PhoneMissed,
  Info,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
} from "lucide-react";

export default function VoiceReportsPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [reports, setReports] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Call jobs table state
  const [callJobs, setCallJobs] = useState<any[]>([]);
  const [jobStatusFilter, setJobStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalJobs, setTotalJobs] = useState(0);
  const [isJobsLoading, setIsJobsLoading] = useState(false);

  // Load summary reports data
  const fetchReports = useCallback(async (selectedRange: string, refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/dashboard/voice-campaigns/reports?range=${selectedRange}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load voice reports");
      }
      setReports(data.reports);
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load call jobs list
  const fetchCallJobs = useCallback(async () => {
    setIsJobsLoading(true);
    try {
      const params = new URLSearchParams();
      if (jobStatusFilter !== "ALL") params.set("status", jobStatusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/dashboard/voice-campaigns/jobs?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCallJobs(data.jobs || []);
        if (data.pagination) {
          setTotalJobs(data.pagination.total);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsJobsLoading(false);
    }
  }, [jobStatusFilter, searchQuery, page, limit]);

  useEffect(() => {
    fetchReports(range);
  }, [range, fetchReports]);

  useEffect(() => {
    fetchCallJobs();
  }, [fetchCallJobs]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </span>
        );
      case "QUEUED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Queued
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
            Pending
          </span>
        );
      case "BUSY":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Busy
          </span>
        );
      case "NO_ANSWER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            No Answer
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Failed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
            Cancelled
          </span>
        );
      default:
        return <span className="text-[10px] text-slate-600">{status}</span>;
    }
  };

  const metrics = reports?.metrics || {
    totalCampaigns: 0,
    draftCampaigns: 0,
    scheduledCampaigns: 0,
    completedCalls: 0,
    failedCalls: 0,
    busyCalls: 0,
    noAnswerCalls: 0,
    cancelledCalls: 0,
    totalEligibleRecipients: 0,
    totalExcludedRecipients: 0,
  };

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Voice Delivery Reports & Logs
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Workspace Scoped
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Audience delivery estimates, call job telemetry, and dry-run execution history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Export Button */}
          <a
            href="/api/dashboard/voice-campaigns/reports/export"
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-blue-600" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => fetchReports(range, true)}
            disabled={isRefreshing || isLoading}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
            title="Refresh Metrics"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Internal Disclaimer Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-3 shadow-2xs">
        <div className="p-2 rounded-lg bg-blue-100/60 text-blue-700 shrink-0 mt-0.5">
          <Info className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-900">
            Internal Workspace Telemetry & Dry-Run Logs
          </span>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Metrics and job tables display internal campaign creation, server-side audience qualification, and simulated call execution logs. Delivery percentages and call duration values reflect approved internal benchmarks and will transition to live carrier confirmation once an external voice provider is connected.
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          {[
            { key: "7d", label: "Last 7 Days" },
            { key: "30d", label: "Last 30 Days" },
            { key: "90d", label: "Last 90 Days" },
            { key: "all", label: "All Time" },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key as any)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                range === r.key
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Campaigns
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {isLoading ? "—" : metrics.totalCampaigns}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {metrics.draftCampaigns} drafts • {metrics.scheduledCampaigns} scheduled
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Eligible Audience
          </span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">
            {isLoading ? "—" : metrics.totalEligibleRecipients}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {metrics.totalExcludedRecipients} excluded contacts
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Dry-Run Calls Made
          </span>
          <span className="text-2xl font-bold text-indigo-700 mt-1 block">
            {isLoading ? "—" : metrics.completedCalls}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Internal test mode</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Failed / Unanswered
          </span>
          <span className="text-2xl font-bold text-rose-700 mt-1 block">
            {isLoading ? "—" : metrics.failedCalls + metrics.busyCalls + metrics.noAnswerCalls}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {metrics.busyCalls + metrics.noAnswerCalls} busy/no answer
          </span>
        </div>
      </div>

      {/* Recipient-Level Call Jobs History Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recipient-Level Call Jobs Log</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Granular audit log of recipient calls, idempotency tokens, and status outcomes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={jobStatusFilter}
              onChange={(e) => {
                setJobStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
            >
              <option value="ALL">All Outcomes</option>
              <option value="COMPLETED">Completed</option>
              <option value="QUEUED">Queued</option>
              <option value="PENDING">Pending</option>
              <option value="BUSY">Busy</option>
              <option value="NO_ANSWER">No Answer</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search phone or campaign..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 w-48 sm:w-56"
              />
            </div>
          </div>
        </div>

        {isJobsLoading && (
          <div className="p-10 text-center text-xs text-slate-400 animate-pulse">
            Loading call logs...
          </div>
        )}

        {!isJobsLoading && callJobs.length === 0 && (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <PhoneCall className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No call jobs recorded</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Call jobs are created when campaigns are scheduled or queued for execution.
            </p>
          </div>
        )}

        {!isJobsLoading && callJobs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Destination Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Attempts</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Created / Executed</th>
                  <th className="py-3 px-4">Diagnosis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {callJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {j.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {j.campaign?.name || "N/A"}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {j.destinationPhoneNorm || j.destinationPhone}
                    </td>
                    <td className="py-3 px-4">{getJobStatusBadge(j.status)}</td>
                    <td className="py-3 px-4 text-center font-mono">{j.attemptCount}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {j.callDurationSeconds ? `${j.callDurationSeconds}s` : "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{formatDate(j.createdAt)}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                      {j.failureReason || (j.isSimulated ? "Dry-run simulated" : "Provider event")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalJobs > limit && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Total jobs: <span className="font-semibold text-slate-800">{totalJobs}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded border border-slate-200 bg-white disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono px-2">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= totalJobs}
                className="p-1 rounded border border-slate-200 bg-white disabled:opacity-40"
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
