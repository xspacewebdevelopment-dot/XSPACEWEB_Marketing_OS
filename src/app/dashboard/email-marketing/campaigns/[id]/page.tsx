"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  Play,
  Pause,
  XCircle,
  Copy,
  BarChart2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Send,
  RefreshCw,
  Mail,
  ShieldAlert,
  Sliders,
  ChevronRight,
  AlertCircle,
  AlertOctagon,
} from "lucide-react";
import {
  CAMPAIGN_STATUS_BADGES,
  CAMPAIGN_TYPE_LABELS,
  CampaignStatus,
} from "@/lib/types/campaigns";

export default function CampaignMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monitorData, setMonitorData] = useState<any>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 3500);
  };

  const fetchMonitorData = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/email-marketing/campaigns/${id}/monitor`);
      if (!res.ok) throw new Error("Failed to load monitor data");
      const json = await res.json();
      setMonitorData(json.data);
    } catch (err: any) {
      console.error(err);
      showNotice("error", err.message || "Failed to poll campaign status.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMonitorData();
  }, [fetchMonitorData]);

  // Real-time Database Polling (every 3 seconds if SENDING or QUEUED)
  useEffect(() => {
    if (!monitorData) return;
    const status = monitorData.campaign?.status;

    if (status === "SENDING" || status === "QUEUED") {
      const interval = setInterval(() => {
        fetchMonitorData();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [monitorData, fetchMonitorData]);

  const handlePause = async () => {
    try {
      const res = await fetch(`/api/dashboard/email-marketing/campaigns/${id}/pause`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        showNotice("success", "Campaign sending paused.");
        fetchMonitorData();
      } else {
        showNotice("error", json.error || "Failed to pause campaign");
      }
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  const handleResume = async () => {
    try {
      const res = await fetch(`/api/dashboard/email-marketing/campaigns/${id}/resume`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        showNotice("success", "Campaign sending resumed.");
        fetchMonitorData();
      } else {
        showNotice("error", json.error || "Failed to resume campaign");
      }
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this campaign? Pending unsent emails will not be dispatched.")) return;
    try {
      const res = await fetch(`/api/dashboard/email-marketing/campaigns/${id}/cancel`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        showNotice("success", "Campaign cancelled.");
        fetchMonitorData();
      } else {
        showNotice("error", json.error || "Failed to cancel campaign");
      }
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/dashboard/email-marketing/campaigns/${id}/duplicate`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        showNotice("success", "Campaign duplicated as a new draft.");
        router.push(`/dashboard/email-marketing/campaigns/create?id=${json.data?.id}`);
      } else {
        showNotice("error", json.error || "Failed to duplicate");
      }
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-[75vh] w-full flex flex-col items-center justify-center text-slate-300 space-y-3">
        <RefreshCw className="h-7 w-7 animate-spin text-blue-500" />
        <p className="text-xs font-semibold">Connecting to live campaign monitor...</p>
      </div>
    );
  }

  const campaign = monitorData?.campaign;
  const counts = monitorData?.counts;
  const recentErrors = monitorData?.recentErrors || [];
  const recentEvents = monitorData?.recentEvents || [];

  const statusBadge = CAMPAIGN_STATUS_BADGES[campaign?.status as CampaignStatus] || {
    label: campaign?.status,
    color: "text-slate-300",
    bg: "bg-slate-800",
    border: "border-slate-700",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 select-none">
      {/* Toast Notice */}
      {notice && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold shadow-xl animate-in fade-in duration-200 ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          <Link
            href="/dashboard/email-marketing/campaigns"
            className="h-9 w-9 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-slate-900 shadow-2xs hover:shadow-xs flex items-center justify-center transition-all duration-150 active:scale-95"
            title="Return to Campaigns"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{campaign?.name}</h1>
              {campaign?.status === "SENDING" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                  </span>
                  <span>Sending</span>
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg} ${statusBadge.color} ${statusBadge.border}`}
                >
                  {statusBadge.label}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Subject: &ldquo;{campaign?.subject}&rdquo; &bull; Sender: {campaign?.fromName} &lt;{campaign?.fromEmail}&gt;
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchMonitorData();
            }}
            disabled={refreshing}
            className="h-9 w-9 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-slate-800 shadow-2xs hover:shadow-xs flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refresh live status"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>

          {campaign?.status === "SENDING" && (
            <button
              onClick={handlePause}
              className="h-9 px-3.5 rounded-xl border border-amber-200/90 bg-amber-50/50 hover:bg-amber-100/70 text-amber-900 text-xs font-bold flex items-center gap-2 transition-all duration-150 shadow-2xs hover:shadow-xs hover:border-amber-300 active:scale-95 cursor-pointer"
            >
              <Pause className="h-3.5 w-3.5 text-amber-600" />
              <span>Pause Sending</span>
            </button>
          )}

          {campaign?.status === "PAUSED" && (
            <button
              onClick={handleResume}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 transition-all duration-150 shadow-sm shadow-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/30 active:scale-95 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Resume Sending</span>
            </button>
          )}

          {(campaign?.status === "SENDING" ||
            campaign?.status === "SCHEDULED" ||
            campaign?.status === "PAUSED") && (
            <button
              onClick={handleCancel}
              className="h-9 px-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-rose-50/60 text-slate-600 hover:text-rose-700 hover:border-rose-200 text-xs font-bold flex items-center gap-2 transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer group"
            >
              <XCircle className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-500 transition-colors" />
              <span>Cancel</span>
            </button>
          )}

          <button
            onClick={handleDuplicate}
            className="h-9 px-3.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center gap-2 transition-all duration-150 shadow-2xs hover:shadow-xs hover:border-slate-300 active:scale-95 cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5 text-slate-400" />
            <span>Duplicate</span>
          </button>
        </div>
      </div>

      {/* COMPLETED BANNER */}
      {campaign?.status === "COMPLETED" && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-blue-50/40 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950">Campaign Broadcast Completed</div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                All recipients have been submitted. Track real-time opens, clicks, and deliverability metrics in the analytics report.
              </p>
            </div>
          </div>
          <Link
            href={`/dashboard/email-marketing/campaigns/${id}/report`}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm shadow-emerald-500/20 active:scale-95 shrink-0 self-start sm:self-center"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>View Full Analytics Report</span>
          </Link>
        </div>
      )}

      {/* SCHEDULED BANNER (If Scheduled) */}
      {campaign?.status === "SCHEDULED" && campaign?.scheduledAt && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-950">Campaign Scheduled for Automated Dispatch</div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Target launch: <strong className="text-amber-900">{new Date(campaign.scheduledAt).toUTCString()}</strong> ({campaign.timezone || "UTC"})
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-amber-800 bg-white px-2.5 py-1 rounded-md border border-amber-200 shadow-xs">
            Durable Inngest Sleep Active
          </span>
        </div>
      )}

      {/* REAL PROGRESS BAR */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="font-bold uppercase tracking-wider text-slate-700">
              Live Sending Progress
            </span>
          </div>
          <div className="flex items-center gap-3.5">
            <span className="font-mono font-bold text-slate-900 text-sm">
              {counts?.progressPercent ?? 0}% Completed
            </span>
            <Link
              href={`/dashboard/email-marketing/campaigns/${id}/report`}
              className="h-8 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95"
            >
              <BarChart2 className="h-3.5 w-3.5 text-blue-600" />
              <span>View Report &rarr;</span>
            </Link>
          </div>
        </div>

        <div className="h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              campaign?.status === "COMPLETED"
                ? "bg-emerald-500"
                : campaign?.status === "PAUSED"
                ? "bg-orange-500"
                : "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"
            }`}
            style={{ width: `${counts?.progressPercent ?? 0}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-semibold block">Total Audience</span>
            <span className="text-xl font-black text-slate-900 tracking-tight mt-0.5 block">{counts?.total ?? 0}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-semibold block">Pending Queue</span>
            <span className="text-xl font-black text-slate-700 tracking-tight mt-0.5 block">{counts?.pending ?? 0}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/70 shadow-2xs">
            <span className="text-[11px] text-blue-700 font-semibold block">Submitted (Resend)</span>
            <span className="text-xl font-black text-blue-800 tracking-tight mt-0.5 block">{counts?.submitted ?? 0}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/70 shadow-2xs">
            <span className="text-[11px] text-rose-700 font-semibold block">Failed Submissions</span>
            <span className="text-xl font-black text-rose-800 tracking-tight mt-0.5 block">{counts?.failed ?? 0}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70 col-span-2 sm:col-span-1 shadow-2xs">
            <span className="text-[11px] text-amber-700 font-semibold block">Excluded / Suppressed</span>
            <span className="text-xl font-black text-amber-800 tracking-tight mt-0.5 block">{counts?.excluded ?? 0}</span>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: Live Activity & Provider Errors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity Stream */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Clock className="h-4 w-4 text-indigo-600" />
              <span>Real-Time Activity Stream</span>
            </div>
            <span className="text-[10px] text-slate-500">Latest Database Events</span>
          </div>

          {recentEvents.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No sending activity logged yet.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-[11px]">
              {recentEvents.map((evt: any) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-700"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        evt.eventType === "SUBMITTED"
                          ? "bg-blue-100 text-blue-700"
                          : evt.eventType === "UNSUBSCRIBED"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {evt.eventType}
                    </span>
                    <span className="truncate">{evt.recipientEmail}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(evt.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Provider Error Logs */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <AlertOctagon className="h-4 w-4 text-rose-600" />
              <span>Provider Errors & Rejections</span>
            </div>
            <span className="text-[10px] text-rose-700 font-mono font-medium">
              {recentErrors.length} Captured
            </span>
          </div>

          {recentErrors.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Zero provider submission errors detected.</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
              {recentErrors.map((err: any) => (
                <div
                  key={err.id}
                  className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-1"
                >
                  <div className="flex justify-between font-mono text-[11px] text-slate-700">
                    <span className="font-semibold text-rose-700">{err.email}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(err.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800 font-mono">
                    {err.errorMessage || "Unknown provider rejection"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
