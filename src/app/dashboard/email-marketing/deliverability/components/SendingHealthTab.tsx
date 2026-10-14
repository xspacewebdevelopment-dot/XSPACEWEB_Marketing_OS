"use client";

import { useState } from "react";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Radio,
  Copy,
  Check,
  ExternalLink,
  Info,
  Clock,
  ShieldCheck,
  AlertOctagon,
  ArrowUpRight,
} from "lucide-react";

interface SendingHealthTabProps {
  sendingStats: {
    totalSent: number;
    deliveredCount: number;
    bouncedCount: number;
    complainedCount: number;
    failedDispatchCount: number;
    deliveryRate: string | null;
    bounceRate: string;
    complaintRate: string;
    hasWebhookConfirmation: boolean;
    webhookEventsCount: number;
    isResendConfigured: boolean;
    recentSends: any[];
  };
}

export function SendingHealthTab({ sendingStats }: SendingHealthTabProps) {
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/dashboard/email-marketing/webhooks/resend`
      : "https://your-domain.com/api/dashboard/email-marketing/webhooks/resend";

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const isResendConfigured = sendingStats.isResendConfigured;
  const hasWebhookConfirmation = sendingStats.hasWebhookConfirmation;

  return (
    <div className="space-y-6">
      {/* Provider Integration Status Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isResendConfigured
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-rose-50 text-rose-600 border-rose-200"
            }`}
          >
            {isResendConfigured ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Resend Sending Infrastructure</h2>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                  isResendConfigured
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {isResendConfigured ? "Connected" : "API Key Missing"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configured Sender: <span className="text-slate-800 font-mono font-medium">marketing@xspaceweb.com</span> • Upstream API Gateway
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://resend.com/emails"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
          >
            <span>Resend Console</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Sending Health Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sent / Dispatched */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>Emails Sent</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Send className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">{sendingStats.totalSent}</p>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Dispatched via official Resend API
          </p>
        </div>

        {/* Confirmed Delivered */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>Delivered (Confirmed)</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {sendingStats.deliveredCount}
              </span>
              {sendingStats.deliveryRate !== null ? (
                <span className="text-xs font-bold text-emerald-700">
                  ({sendingStats.deliveryRate}%)
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  Webhook Required
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            {hasWebhookConfirmation
              ? "Confirmed via live Resend webhook callback"
              : "Awaiting webhook event configuration"}
          </p>
        </div>

        {/* Bounces */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>Bounces</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {sendingStats.bouncedCount}
              </span>
              <span className="text-xs font-bold text-amber-700">
                ({sendingStats.bounceRate}%)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Target threshold: <strong className="text-slate-800">&lt; 2.0%</strong>
          </p>
        </div>

        {/* Complaints */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-rose-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>Spam Complaints</span>
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                <AlertOctagon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {sendingStats.complainedCount}
              </span>
              <span className="text-xs font-bold text-rose-700">
                ({sendingStats.complaintRate}%)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Target threshold: <strong className="text-slate-800">&lt; 0.10%</strong>
          </p>
        </div>
      </div>

      {/* Honest Rate Definitions Box */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <Info className="h-4 w-4 text-blue-600" />
          <span>Calculation Definitions & Delivery Transparency</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-600 pt-1">
          <div className="p-3 rounded-xl bg-white border border-slate-200/80">
            <strong className="text-slate-900 block mb-0.5">Delivery Rate:</strong>
            <code className="text-blue-700 font-mono">(Delivered / Sent) * 100</code>. Unlike basic SMTP relays that assume success on accept, NexaReach confirms final delivery strictly upon provider event receipt.
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200/80">
            <strong className="text-slate-900 block mb-0.5">Bounce Rate:</strong>
            <code className="text-amber-700 font-mono">(Bounces / Sent) * 100</code>. Reflects hard mailbox errors and soft DNS timeouts. Any bounced address is immediately protected in the suppression list.
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200/80">
            <strong className="text-slate-900 block mb-0.5">Spam Complaint Rate:</strong>
            <code className="text-rose-700 font-mono">(Complaints / Sent) * 100</code>. Measures recipients clicking 'Mark as Spam'. Must stay below 0.10% to prevent domain blacklisting.
          </div>
        </div>
      </div>

      {/* Webhook Configuration Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Radio className="h-4 w-4 text-indigo-600" />
              Resend Webhook Configuration
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Register this webhook in your Resend account to enable automatic delivery confirmations and automated bounce suppression.
            </p>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
              hasWebhookConfirmation
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {hasWebhookConfirmation
              ? `${sendingStats.webhookEventsCount} Events Received`
              : "0 Events (Pending Setup)"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="flex-1 px-3 py-2 rounded-xl text-xs font-mono bg-slate-50 border border-slate-200 text-slate-800 select-all"
          />
          <button
            onClick={copyWebhookUrl}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            {copiedWebhook ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy URL</span>
              </>
            )}
          </button>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
          <span className="font-medium">Supported Events:</span>
          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px]">email.sent</span>
          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px]">email.delivered</span>
          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px]">email.bounced</span>
          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px]">email.complained</span>
        </div>
      </div>

      {/* Sending Activity Log Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Recent Sending Activity & Provider Logs
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Real persisted send records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Recipient</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Sender</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Provider ID</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-xs">
              {sendingStats.recentSends.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <Send className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="font-bold text-slate-800">No outbound send records yet</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Send a test email from the Email Templates Studio to generate genuine send records and verify dispatch health.
                    </p>
                  </td>
                </tr>
              ) : (
                sendingStats.recentSends.map((s) => {
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {s.recipientEmail}
                      </td>
                      <td className="py-3 px-3 max-w-[200px] truncate text-slate-800 font-medium">
                        {s.subject}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {s.senderEmail}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            s.status === "DELIVERED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : s.status === "SENT"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : s.status === "BOUNCED"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : s.status === "COMPLAINED"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {s.status}
                        </span>
                        {s.errorMessage && (
                          <p className="text-[10px] text-rose-600 mt-0.5 max-w-[180px] truncate font-medium" title={s.errorMessage}>
                            {s.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {s.resendId ? (
                          <span title={s.resendId}>{s.resendId.slice(0, 14)}...</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-[11px] text-slate-500 font-mono">
                        {new Date(s.createdAt).toLocaleTimeString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
