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
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 shadow-xs transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{campaign?.name}</h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg} ${statusBadge.color} ${statusBadge.border}`}
              >
                {campaign?.status === "SENDING" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
                )}
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Subject: &ldquo;{campaign?.subject}&rdquo; &bull; Sender: {campaign?.fromName} &lt;{campaign?.fromEmail}&gt;
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {campaign?.status === "SENDING" && (
            <button
              onClick={handlePause}
              className="px-3.5 py-1.5 rounded-lg border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Pause className="h-3.5 w-3.5 text-orange-600" />
              <span>Pause Sending</span>
            </button>
          )}

          {campaign?.status === "PAUSED" && (
            <button
              onClick={handleResume}
              className="px-3.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Play className="h-3.5 w-3.5 text-emerald-600" />
              <span>Resume Sending</span>
            </button>
          )}

          {(campaign?.status === "SENDING" ||
            campaign?.status === "SCHEDULED" ||
            campaign?.status === "PAUSED") && (
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              <span>Cancel</span>
            </button>
          )}

          <button
            onClick={handleDuplicate}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Duplicate</span>
          </button>

          <Link
            href={`/dashboard/email-marketing/campaigns/${id}/report`}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs shadow-blue-500/20 transition-colors"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>View Report</span>
          </Link>
        </div>
      </div>

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
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="font-bold uppercase tracking-wider text-slate-700">
              Live Sending Progress
            </span>
          </div>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {counts?.progressPercent ?? 0}% Completed
          </span>
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
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-medium block">Total Audience</span>
            <span className="text-base font-bold text-slate-900">{counts?.total ?? 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-medium block">Pending Queue</span>
            <span className="text-base font-bold text-slate-700">{counts?.pending ?? 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
            <span className="text-[10px] text-blue-700 font-medium block">Submitted (Resend)</span>
            <span className="text-base font-bold text-blue-800">{counts?.submitted ?? 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
            <span className="text-[10px] text-rose-700 font-medium block">Failed Submissions</span>
            <span className="text-base font-bold text-rose-800">{counts?.failed ?? 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-amber-700 font-medium block">Excluded / Suppressed</span>
            <span className="text-base font-bold text-amber-800">{counts?.excluded ?? 0}</span>
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
