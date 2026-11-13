"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  PhoneCall,
  Plus,
  Send,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  Search,
  RotateCw,
  Info,
  Calendar,
  Layers,
  PhoneOff,
  PhoneMissed,
  PhoneForwarded,
} from "lucide-react";

interface OverviewMetrics {
  totalCampaigns: number;
  draftCampaigns: number;
  scheduledCampaigns: number;
  queuedCampaigns: number;
  completedCampaigns: number;
  cancelledCampaigns: number;
  failedCampaigns: number;
  totalEligibleRecipients: number;
  totalExcludedRecipients: number;
  completedCalls: number;
  failedCalls: number;
  busyCalls: number;
  noAnswerCalls: number;
  cancelledCalls: number;
}

export function VoiceOverviewTab({ phoneContactsCount = 0 }: { phoneContactsCount?: number }) {
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalCampaigns: 0,
    draftCampaigns: 0,
    scheduledCampaigns: 0,
    queuedCampaigns: 0,
    completedCampaigns: 0,
    cancelledCampaigns: 0,
    failedCampaigns: 0,
    totalEligibleRecipients: 0,
    totalExcludedRecipients: 0,
    completedCalls: 0,
    failedCalls: 0,
    busyCalls: 0,
    noAnswerCalls: 0,
    cancelledCalls: 0,
  });

  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/voice-campaigns/reports?range=30d");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load voice campaign overview");
      }
      if (data.reports?.metrics) {
        setMetrics(data.reports.metrics);
      }
      if (data.reports?.recentCampaigns) {
        setRecentCampaigns(data.reports.recentCampaigns);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load overview data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="h-3 w-3 text-slate-500" />
            Draft
          </span>
        );
      case "READY_FOR_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Ready for Review
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Calendar className="h-3 w-3 text-amber-600" />
            Scheduled
          </span>
        );
      case "QUEUED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Queued
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner: Simulation & Readiness */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100/60 text-blue-700 shrink-0 mt-0.5">
            <Info className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">
                Voice Campaigns Engine — Internal Management Mode
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Provider Unconnected
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Campaign creation, multi-language speech settings, script variable synthesis, audience eligibility, and scheduling workflows are fully active. All call delivery metrics reflect internal simulation and dry-run state. Outbound telephony will remain safe and dormant until an external provider adapter is activated in settings.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchOverviewData(true)}
          disabled={isRefreshing || isLoading}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shrink-0 cursor-pointer"
          title="Refresh Overview"
        >
          <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Campaigns */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Campaigns
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PhoneCall className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {isLoading ? "—" : metrics.totalCampaigns}
            </span>
            <span className="text-xs text-slate-500">campaigns created</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Drafts: {metrics.draftCampaigns}</span>
            <span>Scheduled: {metrics.scheduledCampaigns}</span>
          </div>
        </div>

        {/* Scheduled Campaigns */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Scheduled Queue
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {isLoading ? "—" : metrics.scheduledCampaigns}
            </span>
            <span className="text-xs text-amber-600 font-medium">scheduled</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Ready for review: {metrics.queuedCampaigns}</span>
            <span>Drafts: {metrics.draftCampaigns}</span>
          </div>
        </div>

        {/* Eligible Recipients */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Eligible Audience
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {isLoading ? "—" : metrics.totalEligibleRecipients}
            </span>
            <span className="text-xs text-emerald-600 font-medium">opted-in contacts</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Phone contacts: {phoneContactsCount}</span>
            <span>Excluded: {metrics.totalExcludedRecipients}</span>
          </div>
        </div>

        {/* Internal Completed Calls */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dry-Run Completed
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Radio className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {isLoading ? "—" : metrics.completedCalls}
            </span>
            <span className="text-xs text-indigo-600 font-medium">simulated calls</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Failed: {metrics.failedCalls}</span>
            <span>Busy/Unanswered: {metrics.busyCalls + metrics.noAnswerCalls}</span>
          </div>
        </div>
      </div>

      {/* Secondary Outcome Breakdown Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
        <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center justify-between">
          <span>Call Job Outcome Telemetry (Simulated & Dry-Run Logs)</span>
          <span className="text-[11px] font-normal text-slate-400">Strictly Workspace-Scoped</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Completed
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{metrics.completedCalls}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <PhoneOff className="h-3.5 w-3.5 text-rose-500" />
              Failed
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{metrics.failedCalls}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <PhoneMissed className="h-3.5 w-3.5 text-amber-500" />
              Busy / No Answer
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {metrics.busyCalls + metrics.noAnswerCalls}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              Cancelled / Skipped
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{metrics.cancelledCalls}</div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/voice-campaigns/compose"
          className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div>
            <div className="font-semibold text-sm">Create New Voice Campaign</div>
            <div className="text-xs text-blue-100 mt-0.5">
              Launch 5-step wizard with voice synthesis preview
            </div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Plus className="h-4 w-4 text-white" />
          </div>
        </Link>

        <Link
          href="/dashboard/voice-campaigns/templates"
          className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs transition-all group flex items-center justify-between"
        >
          <div>
            <div className="font-semibold text-sm text-slate-900">Manage Voice Templates</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Browse starter reminders, notifications, and surveys
            </div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
            <FileText className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/dashboard/voice-campaigns/reports"
          className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs transition-all group flex items-center justify-between"
        >
          <div>
            <div className="font-semibold text-sm text-slate-900">View Delivery Reports</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Audience logs, error codes, and CSV download
            </div>
          </div>
          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
            <BarChart3 className="h-4 w-4" />
          </div>
        </Link>
      </div>

      {/* Recent Campaigns Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Voice Campaigns</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest voice campaigns created or scheduled in your workspace.
            </p>
          </div>
          <Link
            href="/dashboard/voice-campaigns/campaigns"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* Empty State */}
        {!isLoading && recentCampaigns.length === 0 && (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
              <PhoneCall className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No voice campaigns yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Draft your first voice campaign with dynamic variable substitutions and browser speech preview.
            </p>
            <Link
              href="/dashboard/voice-campaigns/compose"
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Campaign</span>
            </Link>
          </div>
        )}

        {/* Campaign Table */}
        {recentCampaigns.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Eligible Audience</th>
                  <th className="py-3 px-4">Schedule / Created</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {recentCampaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <Link
                        href={`/dashboard/voice-campaigns/compose?id=${c.id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {c.purpose}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="font-semibold text-slate-900">{c.eligibleCount || 0}</span>
                      {c.excludedCount > 0 && (
                        <span className="text-[10px] text-slate-400 ml-1">
                          ({c.excludedCount} excl)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {c.scheduledAt ? (
                        <span className="text-amber-700 font-medium">
                          Scheduled: {formatDate(c.scheduledAt)}
                        </span>
                      ) : (
                        formatDate(c.createdAt)
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/voice-campaigns/compose?id=${c.id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        {c.status === "DRAFT" ? "Edit Draft" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
