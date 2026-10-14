"use client";

import { useState } from "react";
import { AlertTriangle, Send, X, ShieldAlert, CheckCircle2 } from "lucide-react";

interface SendConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSend: () => Promise<void>;
  campaignName: string;
  fromAddress: string;
  recipientCount: number;
  isScheduling?: boolean;
  scheduledTimeText?: string;
}

export function SendConfirmationModal({
  isOpen,
  onClose,
  onConfirmSend,
  campaignName,
  fromAddress,
  recipientCount,
  isScheduling = false,
  scheduledTimeText = "",
}: SendConfirmationModalProps) {
  const [confirmedConsent, setConfirmedConsent] = useState(false);
  const [confirmedIrreversible, setConfirmedIrreversible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!confirmedConsent || !confirmedIrreversible) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirmSend();
    } catch (err: any) {
      setError(err.message || "Failed to initiate sending");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        {/* Glow Header */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isScheduling ? "Confirm Campaign Schedule" : "Production Sending Confirmation"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isScheduling
                    ? "Verify dispatch parameters before locking schedule."
                    : "Final authorization required for live email transmission."}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Campaign Specifics Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Campaign:</span>
              <span className="font-semibold text-slate-900 truncate max-w-xs">{campaignName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sender:</span>
              <span className="font-mono text-slate-800">{fromAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Eligible Recipients:</span>
              <span className="font-bold text-blue-700 font-mono">
                {recipientCount.toLocaleString()} Verified Contacts
              </span>
            </div>
            {isScheduling && scheduledTimeText && (
              <div className="flex justify-between border-t border-slate-200 pt-2 text-amber-800 font-medium">
                <span>Scheduled Dispatch:</span>
                <span className="font-semibold">{scheduledTimeText}</span>
              </div>
            )}
          </div>

          {/* Compliance Checklist Checkboxes */}
          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 cursor-pointer transition-colors text-xs text-slate-700 shadow-xs">
              <input
                type="checkbox"
                checked={confirmedConsent}
                onChange={(e) => setConfirmedConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span>
                I confirm that all recipients in this audience have provided documented opt-in consent or applicable lawful marketing basis under CAN-SPAM and GDPR.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 cursor-pointer transition-colors text-xs text-slate-700 shadow-xs">
              <input
                type="checkbox"
                checked={confirmedIrreversible}
                onChange={(e) => setConfirmedIrreversible(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span>
                I understand this action dispatches live commercial emails through the Resend API. Submitted emails cannot be retracted once transmitted.
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!confirmedConsent || !confirmedIrreversible || isSubmitting}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-xs shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>{isScheduling ? "Confirm & Schedule" : "Confirm & Send Now"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
