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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
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
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Glow Header */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isScheduling ? "Schedule Campaign" : "Ready to Send Campaign"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isScheduling
                    ? "Lock in your automated dispatch schedule."
                    : "Confirm to start sending emails immediately."}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Campaign Details Summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Campaign:</span>
              <span className="font-semibold text-slate-900 truncate max-w-xs">{campaignName || "Email Campaign"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Sender:</span>
              <span className="font-mono text-slate-800 text-[11px] truncate max-w-xs">{fromAddress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Audience:</span>
              <span className="font-bold text-blue-700 font-mono">
                {recipientCount.toLocaleString()} Verified Contacts
              </span>
            </div>
            {isScheduling && scheduledTimeText && (
              <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-indigo-700 font-medium">
                <span>Dispatch Date & Time:</span>
                <span className="font-semibold">{scheduledTimeText}</span>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Audience verified and ready for live dispatch via Resend.</span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>{isScheduling ? "Schedule Now" : "Send Now"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
