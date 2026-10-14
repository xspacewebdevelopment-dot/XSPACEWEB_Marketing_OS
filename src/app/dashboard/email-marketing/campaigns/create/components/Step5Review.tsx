"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Send,
  Clock,
  Layers,
  ShieldCheck,
  Eye,
  Sliders,
  FileCode2,
  Mail,
  Building,
} from "lucide-react";
import type { AudienceBreakdown } from "@/lib/types/campaigns";
import { SendConfirmationModal } from "./SendConfirmationModal";

interface Step5ReviewProps {
  campaignId?: string;
  formData: {
    name: string;
    type: string;
    fromName: string;
    fromEmail: string;
    replyTo: string;
    subject: string;
    preheader: string;
    postalAddress: string;
    batchSize: number;
    batchDelayMs: number;
  };
  compiledHtml?: string | null;
  breakdown: AudienceBreakdown | null;
  onSaveDraft: () => Promise<void>;
  onSendNow: () => Promise<void>;
  onScheduleSend: (scheduledAtIso: string, timezone: string) => Promise<void>;
  savingDraft: boolean;
  onUpdateBatchSettings: (batchSize: number, batchDelayMs: number) => void;
}

export function Step5Review({
  campaignId,
  formData,
  compiledHtml,
  breakdown,
  onSaveDraft,
  onSendNow,
  onScheduleSend,
  savingDraft,
  onUpdateBatchSettings,
}: Step5ReviewProps) {
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [timezone, setTimezone] = useState("UTC");
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSchedulingAction, setIsSchedulingAction] = useState(false);

  const eligibleCount = breakdown?.eligible ?? 0;

  // Validation checks for readiness checklist
  const hasSubject = Boolean(formData.subject?.trim());
  const hasSender = Boolean(formData.fromEmail?.includes("@") && formData.fromName?.trim());
  const hasAudience = eligibleCount > 0;
  const hasDesign = Boolean(compiledHtml && compiledHtml.trim().length > 20);
  const hasPostal = Boolean(formData.postalAddress?.trim());

  const allPassed = hasSubject && hasSender && hasAudience && hasDesign && hasPostal;

  const handleTriggerSendNow = () => {
    setIsSchedulingAction(false);
    setIsConfirmationOpen(true);
  };

  const handleTriggerSchedule = () => {
    if (!scheduledDate || !scheduledTime) {
      alert("Please specify a valid schedule date and time.");
      return;
    }
    setIsSchedulingAction(true);
    setIsConfirmationOpen(true);
  };

  const handleExecuteConfirmedAction = async () => {
    if (isSchedulingAction) {
      const isoString = new Date(`${scheduledDate}T${scheduledTime}:00Z`).toISOString();
      await onScheduleSend(isoString, timezone);
    } else {
      await onSendNow();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl select-none">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-base font-bold text-white tracking-tight">Step 5: Review, Validate & Launch</h2>
        <p className="text-xs text-slate-400 mt-1">
          Perform pre-flight compliance audit and dispatch immediately or schedule with durable Inngest background batching.
        </p>
      </div>

      {/* Pre-Flight Checklist Card */}
      <div className="p-4 rounded-xl bg-[#0a1829] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Pre-Flight Sending Checklist
            </h3>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
              allPassed
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
            }`}
          >
            {allPassed ? "All Checks Passed" : "Action Required"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            {hasSubject ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span className={hasSubject ? "text-slate-300" : "text-rose-400 font-semibold"}>
              Subject Line Defined
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            {hasSender ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span className={hasSender ? "text-slate-300" : "text-rose-400 font-semibold"}>
              Sender Credentials Configured
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            {hasAudience ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span className={hasAudience ? "text-slate-300" : "text-rose-400 font-semibold"}>
              Audience Eligible ({eligibleCount} contacts)
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            {hasDesign ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span className={hasDesign ? "text-slate-300" : "text-rose-400 font-semibold"}>
              Email Client HTML Compiled
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 sm:col-span-2">
            {hasPostal ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span className={hasPostal ? "text-slate-300" : "text-rose-400 font-semibold"}>
              Legal Postal Address & One-Click Unsubscribe Mandates Active
            </span>
          </div>
        </div>
      </div>

      {/* Summary Parameters Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Identity & Headers */}
        <div className="p-4 rounded-xl bg-[#0a1829] border border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
            <Mail className="h-3.5 w-3.5 text-blue-400" />
            <span>Campaign Specs</span>
          </div>
          <div className="space-y-1 text-slate-400">
            <div>Name: <strong className="text-white">{formData.name}</strong></div>
            <div>Type: <strong className="text-slate-200">{formData.type}</strong></div>
            <div>Subject: <strong className="text-white">{formData.subject}</strong></div>
            <div>Preheader: <strong className="text-slate-300">{formData.preheader || "None"}</strong></div>
            <div>Sender: <strong className="text-slate-200">{formData.fromName} &lt;{formData.fromEmail}&gt;</strong></div>
            {formData.replyTo && <div>Reply-To: <strong className="text-slate-200">{formData.replyTo}</strong></div>}
          </div>
        </div>

        {/* Audience Breakdown */}
        <div className="p-4 rounded-xl bg-[#0a1829] border border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>Audience Breakdown</span>
          </div>
          <div className="space-y-1 text-slate-400">
            <div>Selected Raw: <strong className="text-white">{breakdown?.totalRaw ?? 0}</strong></div>
            <div>Duplicate Filtered: <strong className="text-amber-400">-{breakdown?.duplicates ?? 0}</strong></div>
            <div>Suppressed Blocked: <strong className="text-rose-400">-{breakdown?.suppressed ?? 0}</strong></div>
            <div>Unsubscribed: <strong className="text-red-400">-{breakdown?.unsubscribed ?? 0}</strong></div>
            <div>Invalid/Risky: <strong className="text-orange-400">-{breakdown?.invalidOrRisky ?? 0}</strong></div>
            <div className="pt-1 border-t border-slate-800 font-bold text-blue-400 text-sm">
              Net Eligible: {eligibleCount} recipients
            </div>
          </div>
        </div>

        {/* Batch Delivery Engine Settings */}
        <div className="p-4 rounded-xl bg-[#0a1829] border border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
            <Sliders className="h-3.5 w-3.5 text-teal-400" />
            <span>Controlled Batching</span>
          </div>

          <div className="space-y-2 text-slate-400">
            <div>
              <label className="text-[10px] block mb-1">Batch Size</label>
              <select
                value={formData.batchSize || 100}
                onChange={(e) =>
                  onUpdateBatchSettings(Number(e.target.value), formData.batchDelayMs || 1000)
                }
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
              >
                <option value={25}>25 emails / batch (Cautious)</option>
                <option value={50}>50 emails / batch (Recommended)</option>
                <option value={100}>100 emails / batch (Standard)</option>
                <option value={250}>250 emails / batch (High Volume)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] block mb-1">Throttling Delay Between Batches</label>
              <select
                value={formData.batchDelayMs || 1000}
                onChange={(e) =>
                  onUpdateBatchSettings(formData.batchSize || 100, Number(e.target.value))
                }
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
              >
                <option value={1000}>1 second (Standard Rate)</option>
                <option value={3000}>3 seconds (Smooth Warmup)</option>
                <option value={5000}>5 seconds (Safe Throttle)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Picker Form (When toggled) */}
      {scheduleMode && (
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/50 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <Calendar className="h-4 w-4 text-amber-400" />
            <span>Schedule Timezone-Aware Launch</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Date</label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="UTC">UTC (Universal Time Coordinated)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Execution Action Buttons */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={savingDraft}
          className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-800 bg-[#0a1829] hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
        >
          {savingDraft ? "Saving..." : "Save as Draft"}
        </button>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {!scheduleMode ? (
            <button
              type="button"
              onClick={() => setScheduleMode(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-amber-800/60 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Schedule for Later</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTriggerSchedule}
              disabled={!allPassed}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-600/20"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Confirm Schedule</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleTriggerSendNow}
            disabled={!allPassed}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Now ({eligibleCount})</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <SendConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirmSend={handleExecuteConfirmedAction}
        campaignName={formData.name}
        fromAddress={`${formData.fromName} <${formData.fromEmail}>`}
        recipientCount={eligibleCount}
        isScheduling={isSchedulingAction}
        scheduledTimeText={isSchedulingAction ? `${scheduledDate} at ${scheduledTime} (${timezone})` : ""}
      />
    </div>
  );
}
