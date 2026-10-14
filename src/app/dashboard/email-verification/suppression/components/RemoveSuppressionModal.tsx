"use client";

import { useState } from "react";
import { X, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { REASON_LABELS } from "@/lib/types/suppression";

interface RemoveSuppressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: any | null;
  onSuccess: () => void;
}

export function RemoveSuppressionModal({
  isOpen,
  onClose,
  entry,
  onSuccess,
}: RemoveSuppressionModalProps) {
  const [justification, setJustification] = useState("");
  const [confirmedRenewedConsent, setConfirmedRenewedConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !entry) return null;

  const isSensitiveReason =
    entry.reason === "UNSUBSCRIBED" || entry.reason === "SPAM_COMPLAINT";

  const handleRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/dashboard/email-verification/suppression/${entry.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          justification,
          confirmedRenewedConsent: isSensitiveReason ? confirmedRenewedConsent : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove suppression entry");
      }

      onSuccess();
      onClose();
      setJustification("");
      setConfirmedRenewedConsent(false);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Remove Suppression</h3>
              <p className="text-[11px] text-slate-500">Allow future campaign sends to this address</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleRemove} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
            <div className="font-semibold text-slate-800">{entry.email || entry.normalizedEmail}</div>
            <div className="text-[11px] text-slate-500">
              Reason: <span className="font-medium text-slate-700">{REASON_LABELS[entry.reason] || entry.reason}</span>
            </div>
            {entry.notes && (
              <div className="text-[11px] text-slate-500">
                Note: <span className="italic">{entry.notes}</span>
              </div>
            )}
          </div>

          {isSensitiveReason && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Legal Compliance Warning</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                This recipient was suppressed due to <strong>{REASON_LABELS[entry.reason]}</strong>. Sending emails without renewed affirmative consent violates anti-spam regulations (CAN-SPAM, GDPR).
              </p>
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={confirmedRenewedConsent}
                  onChange={(e) => setConfirmedRenewedConsent(e.target.checked)}
                  className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 accent-amber-600 mt-0.5"
                />
                <span className="text-[11px] font-semibold text-amber-900 leading-tight">
                  I confirm that I possess documented, renewed opt-in consent from this recipient.
                </span>
              </label>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Removal Justification * (Immutable Audit Trail)
            </label>
            <textarea
              rows={2}
              required
              minLength={5}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why this suppression is being lifted..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (isSensitiveReason && !confirmedRenewedConsent)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Removing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Lift Suppression</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
