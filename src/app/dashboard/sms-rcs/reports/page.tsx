"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  Search,
  Send,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Info,
  Clock,
  Layers,
  Users,
  FileText,
  Radio,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import type { SmsReportsData, SmsReportDateRange } from "@/lib/services/sms-reports";

export default function SmsReportsPage() {
  const [range, setRange] = useState<SmsReportDateRange>("30d");
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState<SmsReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (selectedRange: SmsReportDateRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/sms-rcs/reports?range=${selectedRange}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load SMS & RCS reports");
      }
      setReports(data.reports);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while loading reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(range);
  }, [range, fetchReports]);

  // Filter recent campaigns client-side by search query
  const filteredRecentCampaigns = (reports?.recentCampaigns || []).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.senderId.toLowerCase().includes(q) ||
      c.protocol.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    );
  });

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
                SMS & RCS Reports & Delivery Intelligence
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Workspace Scoped
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Audience estimates, broadcast volume, channel metrics, and carrier audit logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchReports(range)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            href="/dashboard/sms-rcs/compose"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>New Broadcast</span>
          </Link>
        </div>
      </div>

      {/* Date Range & Timezone Explanatory Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            {(
              [
                { id: "7d", label: "Last 7 Days" },
                { id: "30d", label: "Last 30 Days" },
                { id: "90d", label: "Last 90 Days" },
                { id: "all", label: "All Time" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setRange(item.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  range === item.id
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-500 flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
            <Clock className="h-3 w-3 text-slate-400" />
            Filtered by record creation timestamp (UTC rolling window)
          </span>
        </div>

        <div className="text-[11px] text-slate-500 self-end md:self-center">
          {reports?.dateBoundary?.description && (
            <span className="font-medium text-slate-700">
              {reports.dateBoundary.description}
            </span>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 flex items-start justify-between gap-3 text-red-800">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold">Failed to load reports</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchReports(range)}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !reports && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      )}

      {/* Main Reports Content */}
      {reports && (
        <>
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Broadcasts */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Broadcasts
                </span>
                <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {reports.summary.totalCampaigns.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">records</span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                  {reports.summary.draftsCount} Drafts
                </span>
                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-medium">
                  {reports.summary.scheduledCount} Scheduled
                </span>
                <span
                  className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium"
                  title="Marked as dispatched in application, not carrier handset delivery proof"
                >
                  {reports.summary.sentCount} Dispatched
                </span>
                {reports.summary.archivedCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                    {reports.summary.archivedCount} Archived
                  </span>
                )}
              </div>
            </div>

            {/* 2. Channel Distribution */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Channel Protocols
                </span>
                <span className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Radio className="h-4 w-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {reports.summary.smsCount}
                  </span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    SMS
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">
                    {reports.summary.rcsCount}
                  </span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                    RCS
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${reports.channels.sms.percentage}%` }}
                    className="bg-blue-600 h-full transition-all"
                    title={`SMS: ${reports.channels.sms.percentage}%`}
                  />
                  <div
                    style={{ width: `${reports.channels.rcs.percentage}%` }}
                    className="bg-purple-600 h-full transition-all"
                    title={`RCS: ${reports.channels.rcs.percentage}%`}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                  <span>SMS {reports.channels.sms.percentage}%</span>
                  <span>RCS {reports.channels.rcs.percentage}%</span>
                </div>
              </div>
            </div>

            {/* 3. Pre-send Audience Estimate */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Est. Audience Target
                </span>
                <span className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {reports.summary.totalEstimatedRecipients.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">est. recipients</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="h-3 w-3 text-slate-400 shrink-0" />
                <span>Saved pre-send estimate (not carrier delivered count)</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Avg ~{reports.summary.avgEstimatedRecipientsPerCampaign.toLocaleString()} recipients/broadcast
              </div>
            </div>

            {/* 4. Pre-send Segment Estimate */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Est. Telecom Segments
                </span>
                <span className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Layers className="h-4 w-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {reports.summary.totalEstimatedSegments.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">est. segments</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="h-3 w-3 text-slate-400 shrink-0" />
                <span>Pre-send calculation (not carrier-billed usage)</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">
                  GSM-7: {reports.encoding.gsm7}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">
                  UCS-2: {reports.encoding.ucs2}
                </span>
                {reports.encoding.other > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">
                    Other: {reports.encoding.other}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Stats Row: Template Inventory & Operational Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Template Library Assets */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs lg:col-span-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Template Library Inventory
                    </h3>
                  </div>
                  <Link
                    href="/dashboard/sms-rcs/templates"
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-0.5"
                  >
                    <span>Manage</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Reusable templates stored in this workspace for rapid campaign drafting.
                </p>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-lg font-bold text-slate-900">
                      {reports.templates.total}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 uppercase">
                      Total
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                    <div className="text-lg font-bold text-blue-700">
                      {reports.templates.smsCount}
                    </div>
                    <div className="text-[10px] font-medium text-blue-600 uppercase">
                      SMS
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-100">
                    <div className="text-lg font-bold text-purple-700">
                      {reports.templates.rcsCount}
                    </div>
                    <div className="text-[10px] font-medium text-purple-600 uppercase">
                      RCS
                    </div>
                  </div>
                </div>

                {Object.keys(reports.templates.categoryBreakdown).length > 0 ? (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                      Categories
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(reports.templates.categoryBreakdown).map(
                        ([cat, count]) => (
                          <span
                            key={cat}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {cat}: {count}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    No templates saved yet.
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                Template categories are internal classifications and do not represent carrier registration status.
              </div>
            </div>

            {/* Audit & Compliance Transparency Notice */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-2xs lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Data Integrity & Carrier Delivery Disclaimer
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  NexaReach Marketing OS reports strictly display real stored database records scoped to this authenticated workspace. To uphold complete reporting honesty:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      Pre-Send Estimates vs. Delivery
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      Audience totals and segment counts shown above are saved estimates computed during composition. They are not fabricated as unique handsets or billed telco usage.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      Dispatched Status Meaning
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      Campaigns marked with <span className="text-emerald-300 font-medium">SENT</span> status indicate dispatches submitted inside the OS. They are not represented as carrier-verified handset delivery receipts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Workspace ID: {reports.workspaceId}</span>
                <span>Timezone: UTC Server Boundaries</span>
              </div>
            </div>
          </div>

          {/* Recent Broadcast Activity Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Recent Broadcast Activity
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing up to 15 recent broadcast records created within the selected range ({reports.dateBoundary.description}).
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name, sender, channel..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {filteredRecentCampaigns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-4">Broadcast</th>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3">Sender ID</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Encoding</th>
                      <th className="py-2.5 px-3 text-right">Est. Recipients</th>
                      <th className="py-2.5 px-3 text-right">Est. Segments</th>
                      <th className="py-2.5 px-4 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecentCampaigns.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{c.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              c.protocol === "RCS"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {c.protocol}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                          {c.senderId || "—"}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              c.status === "SENT"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : c.status === "SCHEDULED"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : c.status === "ARCHIVED"
                                ? "bg-slate-100 text-slate-600 border border-slate-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {c.encoding || "GSM-7"}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-800">
                          {c.totalRecipients.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-800">
                          {c.totalSegments.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <p className="text-xs">
                  {search
                    ? "No broadcasts match your filter query."
                    : "No broadcasts recorded in this date range."}
                </p>
              </div>
            )}
          </div>

          {/* Carrier Delivery Receipts (DLR) & Handset Event Logs Section */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center shadow-2xs">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-inner">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold mb-2">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              <span>Pending Carrier Provider Integration</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Live Delivery Status Receipts (DLR) & Handset Latency
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto leading-relaxed">
              Handset delivery receipts, carrier bounce diagnostics, and two-way STOP opt-out suppression logs will populate automatically once direct SMS/RCS carrier credentials (e.g. Twilio, Sinch, Infobip) and webhook endpoints are configured.
            </p>

            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  Handset DLR Receipts
                </span>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  End-to-end receipt confirmation directly from mobile carriers when messages reach recipient handsets.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  Two-Way STOP Tracking
                </span>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Inbound opt-out responses are automatically recognized and added to the workspace suppression list.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  Carrier Error Diagnostics
                </span>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Granular error codes for landlines, unallocated numbers, roaming disconnects, and carrier spam filters.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Zero Campaigns Across Workspace Empty State */}
      {!loading && reports && reports.summary.totalCampaigns === 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center shadow-2xs">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-inner">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            No Broadcasts Found in This Date Window
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            There are no SMS or RCS broadcasts recorded in this workspace for the selected time window ({reports.dateBoundary.description}). Create a new broadcast draft or adjust the date filter to see activity.
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/dashboard/sms-rcs/compose"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Create First Broadcast</span>
            </Link>
            <Link
              href="/dashboard/sms-rcs/templates"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Browse Templates</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
