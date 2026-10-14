"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  BarChart2,
  MailCheck,
  CheckCircle2,
  Eye,
  MousePointerClick,
  AlertOctagon,
  Calendar,
  Layers,
  Clock,
  ShieldCheck,
  RefreshCw,
  Info,
} from "lucide-react";
import { CAMPAIGN_STATUS_BADGES, CampaignStatus } from "@/lib/types/campaigns";

export default function CampaignReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const res = await fetch(`/api/dashboard/email-marketing/campaigns/${id}/report`);
        if (!res.ok) throw new Error("Failed to load report data");
        const json = await res.json();
        setReport(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [id]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      window.location.href = `/api/dashboard/email-marketing/campaigns/${id}/export`;
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setExporting(false), 1500);
    }
  };

  if (loading) {
    return (
      <div className="h-[75vh] w-full flex flex-col items-center justify-center text-slate-300 space-y-3">
        <RefreshCw className="h-7 w-7 animate-spin text-blue-500" />
        <p className="text-xs font-semibold">Generating verified campaign report...</p>
      </div>
    );
  }

  const campaign = report?.campaign;
  const statusBreakdown = report?.statusBreakdown || {};
  const timeline = report?.timeline || [];
  const recentAttempts = report?.recentAttempts || [];

  const totalSubmitted = campaign?.submittedCount || 0;
  const totalDelivered = campaign?.deliveredCount || 0;
  const totalOpens = campaign?.openedCount || 0;
  const totalClicks = campaign?.clickedCount || 0;
  const totalBounces = campaign?.bouncedCount || 0;
  const totalUnsubscribes = campaign?.unsubscribedCount || 0;

  const deliveryRate = totalSubmitted > 0 ? ((totalDelivered / totalSubmitted) * 100).toFixed(1) + "%" : "Awaiting Webhooks";
  const openRate = totalDelivered > 0 ? ((totalOpens / totalDelivered) * 100).toFixed(1) + "%" : "Awaiting Webhooks";
  const clickRate = totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) + "%" : "Awaiting Webhooks";

  const badge = CAMPAIGN_STATUS_BADGES[campaign?.status as CampaignStatus] || {
    label: campaign?.status,
    color: "text-slate-300",
    bg: "bg-slate-800",
    border: "border-slate-700",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 select-none">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          <Link
            href={`/dashboard/email-marketing/campaigns/${id}`}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 shadow-xs transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Campaign Audit Report</h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.color} ${badge.border}`}
              >
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {campaign?.name} &bull; Stored delivery facts & recipient audit trail
            </p>
          </div>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs shadow-blue-500/20 transition-all shrink-0"
        >
          {exporting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          <span>Export Full CSV Report</span>
        </button>
      </div>

      {/* COMPLIANCE & WEBHOOK POLICY DISCLAIMER */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3 text-xs text-blue-900 leading-relaxed shadow-xs">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-blue-950 block mb-0.5 font-semibold">Verified Data Integrity Policy:</strong>
          Resend API acceptance guarantees that emails were authenticated and submitted to provider mail queues.
          Downstream delivery confirmations, open tracking, and link click events strictly reflect genuine incoming webhooks.
          Unconfirmed engagement is never fabricated or simulated.
        </div>
      </div>

      {/* METRIC KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Eligible Target</span>
            <Layers className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {campaign?.totalRecipients?.toLocaleString() ?? 0}
          </div>
          <span className="text-[10px] text-slate-400">Recipient Snapshot</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Submitted (Resend)</span>
            <MailCheck className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-blue-700 font-mono">
            {totalSubmitted.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Accepted by Provider</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Confirmed Delivered</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 font-mono">
            {totalDelivered.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">{deliveryRate}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Opens (Tracked)</span>
            <Eye className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-700 font-mono">
            {totalOpens.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">{openRate}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Clicks (Tracked)</span>
            <MousePointerClick className="h-3.5 w-3.5 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-teal-700 font-mono">
            {totalClicks.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">{clickRate}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Opt-Outs / Bounces</span>
            <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700 font-mono">
            {(totalBounces + totalUnsubscribes).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">
            {totalUnsubscribes} unsubs &bull; {totalBounces} bounces
          </span>
        </div>
      </div>

      {/* SUBMISSION TIMELINE HOURLY BREAKDOWN */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Submission Cadence Timeline</span>
          </div>
          <span className="text-[10px] text-slate-500">Hourly Distribution</span>
        </div>

        {timeline.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">
            No timestamped submission intervals recorded for this campaign yet.
          </p>
        ) : (
          <div className="space-y-3">
            {timeline.map((item: any, idx: number) => {
              const maxCount = Math.max(...timeline.map((t: any) => t.count), 1);
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-700">
                      {new Date(item.hour).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                      {new Date(item.hour).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-blue-700 font-bold">{item.count} emails</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RECENT ATTEMPTS TABLE */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <MailCheck className="h-4 w-4 text-indigo-600" />
            <span>Recent Provider Sending Attempts</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Latest 50 Submissions</span>
        </div>

        {recentAttempts.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">
            No sending attempts recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] text-slate-600 uppercase border-b border-slate-200 font-semibold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Provider ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Diagnostic Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {recentAttempts.map((att: any) => (
                  <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{att.recipientEmail}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          att.status === "SUBMITTED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs font-mono">
                      {att.providerMessageId || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(att.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-sans">
                      {att.error || "Accepted by Resend API"}
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
