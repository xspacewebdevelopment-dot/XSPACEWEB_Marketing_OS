"use client";

import { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  Server,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Info,
  ExternalLink,
  FileSpreadsheet,
  UserCheck,
} from "lucide-react";

interface ResultDetailsProps {
  result: any | null;
  onClose: () => void;
  onReverify?: (email: string) => void;
  onAddToContacts?: (id: string) => void;
}

export function ResultDetailsDrawer({
  result,
  onClose,
  onReverify,
  onAddToContacts,
}: ResultDetailsProps) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(result.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = {
    VALID: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
      color: "text-emerald-600",
      desc: "Mailbox confirmed active and deliverable via deep SMTP handshake.",
    },
    INVALID: {
      badge: "bg-rose-50 text-rose-700 border-rose-200",
      icon: XCircle,
      color: "text-rose-600",
      desc: "Mailbox does not exist, account is disabled, or domain does not accept mail.",
    },
    RISKY: {
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      icon: AlertTriangle,
      color: "text-amber-600",
      desc: "High risk profile: catch-all server, disposable mailbox, or spam trap signal.",
    },
    UNKNOWN: {
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      icon: HelpCircle,
      color: "text-slate-500",
      desc: "Remote mail server unresponsive, greylisting active, or connection timed out.",
    },
  };

  const statusInfo =
    statusConfig[result.status as keyof typeof statusConfig] || statusConfig.UNKNOWN;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Audit Signal Details
              </span>
              <h2 className="text-base font-bold text-slate-900 truncate max-w-xs">
                {result.email}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Status Summary Banner */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.badge}`}>
                  {result.status}
                </span>
                {result.overallScore !== null && result.overallScore !== undefined && (
                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900">
                      {result.overallScore}
                    </span>
                    <span className="text-xs text-slate-400">/100 Quality</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600">{statusInfo.desc}</p>
            </div>

            {/* Core Verification Identifiers */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Overview & Origin
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Provider Status</span>
                  <span className="font-semibold text-slate-800">{result.providerStatus || "Not available"}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Provider Substatus</span>
                  <span className="font-semibold text-slate-800">{result.providerSubstatus || "Not available"}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Verification Source</span>
                  <span className="font-semibold text-slate-800">{result.source || "SINGLE"}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] block">Verification Mode</span>
                  <span className="font-semibold text-slate-800">{result.verificationMode || "POWER"}</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Reason */}
            {result.reason && (
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Diagnostics Reason
                </h3>
                <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900">
                  {result.reason}
                </div>
              </div>
            )}

            {/* Granular Deliverability Signals */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Detailed Signal Audit
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="p-3 flex items-center justify-between bg-white">
                  <span className="text-slate-600">Syntax Format (RFC 5322)</span>
                  <span className="font-semibold text-emerald-600">
                    {result.isValidSyntax ? "Valid RFC 5322" : "Invalid Syntax"}
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between bg-white">
                  <span className="text-slate-600">Domain & MX Records</span>
                  <span className="font-semibold text-slate-800">
                    {result.mxAcceptsMail ? "Mail Accepted" : "No MX Records"}
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between bg-white">
                  <span className="text-slate-600">SMTP Handshake</span>
                  <span className="font-semibold text-slate-800">
                    {result.canConnectSmtp === null
                      ? "Not checked (Quick mode)"
                      : result.canConnectSmtp
                      ? "Connected Successfully"
                      : "Failed / Blocked"}
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between bg-white">
                  <span className="text-slate-600">Mailbox Deliverability</span>
                  <span className="font-semibold text-slate-800">
                    {result.isDeliverable === null
                      ? "Not checked (Quick mode)"
                      : result.isDeliverable
                      ? "Confirmed Deliverable"
                      : "Undeliverable / Rejected"}
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between bg-white">
                  <span className="text-slate-600">Catch-All Server</span>
                  <span className="font-semibold text-slate-800">
                    {result.isCatchAll ? "Catch-All Server" : "Strict Mailbox"}
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between bg-white">
                  <span className="text-slate-600">Disposable Email</span>
                  <span className="font-semibold text-slate-800">
                    {result.isDisposable ? "Disposable Provider" : "Legitimate Domain"}
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between bg-white">
                  <span className="text-slate-600">Role-Based Account</span>
                  <span className="font-semibold text-slate-800">
                    {result.isRoleBased ? "Role-Based (team mailbox)" : "Individual Mailbox"}
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between bg-white">
                  <span className="text-slate-600">Spam Trap Hazard</span>
                  <span className="font-semibold text-slate-800">
                    {result.isSpamtrap ? "Spam Trap Flagged" : "Clean / No Hazard"}
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between bg-white">
                  <span className="text-slate-600">Suppression Status</span>
                  <span className="font-semibold text-slate-800">
                    {result.isSuppressed ? `Suppressed (${result.suppressionReason})` : "Not Suppressed"}
                  </span>
                </div>

                {result.job && (
                  <div className="p-3 flex items-center justify-between bg-white">
                    <span className="text-slate-600">Origin Batch Job</span>
                    <span className="font-semibold text-indigo-600 truncate max-w-[180px]">
                      {result.job.filename}
                    </span>
                  </div>
                )}

                <div className="p-3 flex items-center justify-between bg-white">
                  <span className="text-slate-600">Verified Timestamp</span>
                  <span className="text-slate-500">
                    {new Date(result.verifiedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Deliverability Disclaimer Notice */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/60 text-xs text-blue-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                <Info className="h-4 w-4 shrink-0 text-blue-600" />
                <span>Industry Delivery Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-700">
                Verification verifies technical mailbox existence and deliverability signals via deep SMTP handshake, but does not guarantee delivery or inbox placement (which also depends on sender domain reputation, email content, and recipient spam filters).
              </p>
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
            <button
              onClick={handleCopyEmail}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy Email"}</span>
            </button>

            <div className="flex items-center gap-2">
              {onAddToContacts && (
                <button
                  onClick={() => onAddToContacts(result.id)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span>Add to Contacts</span>
                </button>
              )}
              {onReverify && (
                <button
                  onClick={() => onReverify(result.email)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Re-verify
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
