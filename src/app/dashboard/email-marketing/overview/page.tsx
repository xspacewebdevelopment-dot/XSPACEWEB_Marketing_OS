"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Send,
  Users,
  MailCheck,
  ShieldCheck,
  Radio,
  FileCode2,
  Inbox,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ArrowRight,
  Plus,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  MousePointerClick,
  Eye,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { CAMPAIGN_STATUS_BADGES, CampaignStatus } from "@/lib/types/campaigns";

export default function EmailMarketingOverviewPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async (selectedRange = range) => {
    try {
      setError(null);
      const res = await fetch(`/api/dashboard/email-marketing/overview?range=${selectedRange}`);
      if (!res.ok) throw new Error("Failed to load email marketing overview");
      const json = await res.json();
      setData(json.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load overview data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview(range);
  }, [range]);

  const contacts = data?.contacts || {};
  const campaigns = data?.campaigns || {};
  const delivery = data?.delivery || {};
  const verification = data?.verification || {};
  const suppression = data?.suppression || {};
  const deliverability = data?.deliverability || {};
  const timeline = data?.performanceTimeline || [];
  const recentCampaigns = data?.recentCampaigns || [];
  const recentActivity = data?.recentActivity || [];

  // Chart max value for dynamic SVG scaling
  const maxChartValue = useMemo(() => {
    if (!timeline || timeline.length === 0) return 10;
    const max = Math.max(
      ...timeline.map((d: any) => Math.max(d.submitted, d.delivered, d.opened, d.clicked)),
      1
    );
    return Math.max(max, 5);
  }, [timeline]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Email Marketing
            </h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
              Overview
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Central command for campaigns, audience growth, delivery telemetry, and deliverability protection.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Date Range Filter */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  range === r
                    ? "bg-white text-blue-600 shadow-2xs font-bold"
                    : "hover:text-slate-900"
                }`}
              >
                {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setRefreshing(true);
              fetchOverview(range);
            }}
            disabled={refreshing}
            className="h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refresh metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <Link
            href="/dashboard/email-marketing/campaigns/create"
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm shadow-blue-500/25 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Campaign</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* QUICK ACTIONS DOCK */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/dashboard/email-marketing/campaigns/create"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all group flex flex-col justify-between"
        >
          <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Send className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
              New Campaign
            </span>
            <span className="text-[10px] text-slate-500">Launch email blast</span>
          </div>
        </Link>

        <Link
          href="/dashboard/contacts"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all group flex flex-col justify-between"
        >
          <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">
              Manage Contacts
            </span>
            <span className="text-[10px] text-slate-500">{contacts.total ?? 0} total records</span>
          </div>
        </Link>

        <Link
          href="/dashboard/email-verification"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all group flex flex-col justify-between"
        >
          <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-bold text-slate-900 block group-hover:text-emerald-600 transition-colors">
              Verify Emails
            </span>
            <span className="text-[10px] text-slate-500">Reoon deep verification</span>
          </div>
        </Link>

        <Link
          href="/dashboard/email-marketing/templates"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 hover:shadow-xs transition-all group flex flex-col justify-between"
        >
          <div className="h-8 w-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileCode2 className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-bold text-slate-900 block group-hover:text-violet-600 transition-colors">
              Email Templates
            </span>
            <span className="text-[10px] text-slate-500">Visual drag-and-drop</span>
          </div>
        </Link>

        <Link
          href="/dashboard/email-marketing/deliverability"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-xs transition-all group flex flex-col justify-between"
        >
          <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Radio className="h-4 w-4" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-bold text-slate-900 block group-hover:text-amber-600 transition-colors">
              Deliverability
            </span>
            <span className="text-[10px] text-slate-500">{deliverability.score ?? 100}/100 Health</span>
          </div>
        </Link>

        <Link
          href="/dashboard/email-marketing/inbox"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-rose-300 hover:shadow-xs transition-all group flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Inbox className="h-4 w-4" />
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
              Draft
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-bold text-slate-900 block group-hover:text-rose-600 transition-colors">
              Unified Inbox
            </span>
            <span className="text-[10px] text-slate-500">Multichannel hub</span>
          </div>
        </Link>
      </div>

      {/* CORE WORKSPACE METRICS (8 Key Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Audience */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Audience Contacts
            </span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {contacts.total ?? 0}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
              <span className="text-emerald-600 font-semibold">{contacts.subscribed ?? 0} Subscribed</span>
              <span>&bull;</span>
              <span>{contacts.pending ?? 0} Pending</span>
            </div>
          </div>
        </div>

        {/* Campaigns Created */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Campaigns
            </span>
            <Send className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {campaigns.total ?? 0}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
              <span className="text-blue-600 font-semibold">{campaigns.sent ?? 0} Sent</span>
              <span>&bull;</span>
              <span>{campaigns.drafts ?? 0} Drafts</span>
            </div>
          </div>
        </div>

        {/* Submitted via Resend API */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Emails Submitted
            </span>
            <MailCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {delivery.submitted ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Accepted by Resend API
            </div>
          </div>
        </div>

        {/* Confirmed Delivery */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Confirmed Deliveries
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {delivery.delivered ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {delivery.rates?.confirmedDeliveryRate ?? 0}% webhook confirmed
            </div>
          </div>
        </div>

        {/* Verified Opens */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Verified Opens
            </span>
            <Eye className="h-4 w-4 text-violet-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {delivery.opened ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {delivery.rates?.openRate ?? 0}% genuine open rate
            </div>
          </div>
        </div>

        {/* Link Clicks */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Link Clicks
            </span>
            <MousePointerClick className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {delivery.clicked ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {delivery.rates?.clickRate ?? 0}% click-through rate
            </div>
          </div>
        </div>

        {/* Email Verification Summary */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Verified Safe (Reoon)
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              {verification.valid ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>{verification.risky ?? 0} risky</span>
              <span>&bull;</span>
              <span className="text-rose-600">{verification.invalid ?? 0} invalid</span>
            </div>
          </div>
        </div>

        {/* Suppressed / Deliverability Shield */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Suppressions
            </span>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {suppression.totalActive ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {delivery.rates?.bounceRate ?? 0}% workspace bounce rate
            </div>
          </div>
        </div>
      </div>

      {/* PERFORMANCE TIMELINE CHART */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Campaign Dispatch &amp; Engagement Telemetry
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily telemetry based strictly on persisted database dispatches and event callbacks.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Submitted
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              Delivered
            </span>
            <span className="flex items-center gap-1.5 text-violet-600">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />
              Opens
            </span>
            <span className="flex items-center gap-1.5 text-cyan-600">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-600" />
              Clicks
            </span>
          </div>
        </div>

        {/* SVG Responsive Chart */}
        <div className="pt-4">
          <div className="h-48 w-full flex items-end gap-1 sm:gap-2">
            {timeline.map((point: any, idx: number) => {
              const subPct = Math.round((point.submitted / maxChartValue) * 100);
              const delPct = Math.round((point.delivered / maxChartValue) * 100);
              const openPct = Math.round((point.opened / maxChartValue) * 100);
              const clickPct = Math.round((point.clicked / maxChartValue) * 100);

              return (
                <div
                  key={point.date}
                  className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col gap-0.5 p-2 rounded-lg bg-slate-900 text-white text-[10px] z-20 whitespace-nowrap shadow-lg pointer-events-none">
                    <span className="font-bold text-slate-300">{point.label}</span>
                    <span className="text-blue-300">Submitted: {point.submitted}</span>
                    <span className="text-emerald-300">Delivered: {point.delivered}</span>
                    <span className="text-violet-300">Opens: {point.opened}</span>
                    <span className="text-cyan-300">Clicks: {point.clicked}</span>
                  </div>

                  {/* Multi-metric Bar cluster */}
                  <div className="w-full max-w-[20px] flex items-end justify-center gap-0.5 h-full">
                    {/* Submitted Bar */}
                    <div
                      style={{ height: `${Math.max(point.submitted > 0 ? 6 : 0, subPct)}%` }}
                      className="w-1.5 rounded-t bg-blue-500/80 group-hover:bg-blue-600 transition-all"
                    />
                    {/* Delivered Bar */}
                    <div
                      style={{ height: `${Math.max(point.delivered > 0 ? 6 : 0, delPct)}%` }}
                      className="w-1.5 rounded-t bg-emerald-500/80 group-hover:bg-emerald-600 transition-all"
                    />
                    {/* Opened Bar */}
                    <div
                      style={{ height: `${Math.max(point.opened > 0 ? 6 : 0, openPct)}%` }}
                      className="w-1.5 rounded-t bg-violet-500/80 group-hover:bg-violet-600 transition-all"
                    />
                  </div>

                  {/* Date label at bottom */}
                  {(timeline.length <= 14 || idx % Math.ceil(timeline.length / 10) === 0) && (
                    <span className="text-[9px] text-slate-400 mt-2 truncate w-full text-center">
                      {point.label.split(" ")[1] || point.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Window: Past {range === "7d" ? "7 days" : range === "90d" ? "90 days" : "30 days"}</span>
            <span>Policy: Zero simulated or fabricated telemetry. Displaying exact database counts.</span>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: Deliverability Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deliverability Warnings & Reputation (1 col) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Deliverability Health
              </h2>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                deliverability.score >= 90
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {deliverability.grade || "Good"} ({deliverability.score ?? 100}%)
            </span>
          </div>

          {deliverability.warnings && deliverability.warnings.length > 0 ? (
            <div className="space-y-3">
              {deliverability.warnings.map((w: any) => (
                <div
                  key={w.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    w.level === "danger"
                      ? "bg-rose-50/70 border-rose-200 text-rose-900"
                      : w.level === "warning"
                      ? "bg-amber-50/70 border-amber-200 text-amber-900"
                      : "bg-blue-50/60 border-blue-200 text-blue-900"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {w.level === "danger" ? (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    ) : w.level === "warning" ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    )}
                    <span>{w.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{w.detail}</p>
                  {w.actionUrl && (
                    <Link
                      href={w.actionUrl}
                      className="inline-flex items-center gap-1 font-bold text-[11px] text-blue-600 hover:text-blue-800 pt-1"
                    >
                      <span>{w.actionLabel || "Resolve"}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="font-bold">Zero Deliverability Alerts</span>
              <p className="text-[11px] text-emerald-700">
                Your sender reputation and suppression safeguards are within optimal thresholds.
              </p>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/dashboard/email-marketing/deliverability"
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>View Detailed Deliverability Audit</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Real-Time Database Activity Stream (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Recent Marketing Activity
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">Live Database Events</span>
          </div>

          {recentActivity.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              <p className="font-semibold text-slate-700">No email marketing activity recorded yet</p>
              <p className="text-[11px] text-slate-400 mt-1">
                When campaigns are dispatched, real-time submission and delivery callbacks will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden font-mono text-xs">
              {recentActivity.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3 bg-white hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        act.eventType === "SUBMITTED"
                          ? "bg-blue-100 text-blue-700"
                          : act.eventType === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-700"
                          : act.eventType === "OPENED"
                          ? "bg-violet-100 text-violet-700"
                          : act.eventType === "CLICKED"
                          ? "bg-cyan-100 text-cyan-700"
                          : act.eventType === "BOUNCED"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {act.eventType}
                    </span>
                    <span className="font-medium text-slate-900 truncate">
                      {act.recipientEmail}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline truncate">
                      &bull; {act.campaignName}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RECENT CAMPAIGNS TABLE */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Recent Email Campaigns
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Overview of recent broadcasts and their real provider execution status.
            </p>
          </div>

          <Link
            href="/dashboard/email-marketing/campaigns"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Campaigns</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentCampaigns.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Send className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900">No campaigns created yet</h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Create your first email campaign draft or broadcast to begin reaching your audience.
              </p>
            </div>
            <Link
              href="/dashboard/email-marketing/campaigns/create"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Campaign</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Campaign Name &amp; Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Recipients</th>
                  <th className="px-4 py-3 text-right">Submitted</th>
                  <th className="px-4 py-3 text-right">Delivered</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentCampaigns.map((camp: any) => {
                  const badge = CAMPAIGN_STATUS_BADGES[camp.status as CampaignStatus] || {
                    label: camp.status,
                    bg: "bg-slate-100",
                    color: "text-slate-700",
                    border: "border-slate-200",
                  };

                  return (
                    <tr key={camp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{camp.name}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-md">
                          {camp.subject}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.color} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {camp.totalRecipients}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-blue-600 font-semibold">
                        {camp.submittedCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">
                        {camp.deliveredCount}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/email-marketing/campaigns/${camp.id}`}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors"
                          >
                            Monitor
                          </Link>
                          <Link
                            href={`/dashboard/email-marketing/campaigns/${camp.id}/report`}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                          >
                            Report
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
