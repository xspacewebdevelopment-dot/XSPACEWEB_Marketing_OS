"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, AlertCircle, Coins, ShieldAlert, CheckCircle2 } from "lucide-react";

interface ReverifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess: (message: string) => void;
}

export function ReverifyModal({
  isOpen,
  onClose,
  selectedIds,
  onSuccess,
}: ReverifyModalProps) {
  const [loadingEstimate, setLoadingEstimate] = useState(true);
  const [estimate, setEstimate] = useState<{
    totalEmails: number;
    estimatedCredits: number;
    availableCredits: number | null;
    hasSufficientCredits: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && selectedIds.length > 0) {
      setLoadingEstimate(true);
      setError(null);
      fetch("/api/dashboard/email-verification/results/reverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultIds: selectedIds,
          estimateOnly: true,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setEstimate(data.data);
          } else {
            setError(data.error || "Failed to calculate credit estimate");
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoadingEstimate(false));
    }
  }, [isOpen, selectedIds]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/email-verification/results/reverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultIds: selectedIds,
          confirmed: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate re-verification");
      }

      onSuccess(data.message || "Re-verification initiated successfully.");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Re-verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Confirm Re-verification</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-xs">
            <p className="text-slate-600">
              You are about to re-verify <span className="font-bold text-slate-900">{selectedIds.length}</span> selected email address(es). This executes a live re-verification against the provider API.
            </p>

            {loadingEstimate ? (
              <div className="p-6 text-center text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Checking credit availability...</span>
              </div>
            ) : estimate ? (
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-2.5">
                <div className="flex items-center justify-between text-slate-700">
                  <span>Unique Emails to Verify:</span>
                  <span className="font-bold text-slate-900">{estimate.totalEmails}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5 text-amber-500" />
                    <span>Estimated Reoon Credits:</span>
                  </span>
                  <span className="font-bold text-indigo-600">
                    {estimate.estimatedCredits} credits
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700 pt-1 border-t border-indigo-100/60">
                  <span>Available Balance:</span>
                  <span className="font-semibold text-slate-800">
                    {estimate.availableCredits !== null ? `${estimate.availableCredits} credits` : "Active"}
                  </span>
                </div>

                {!estimate.hasSufficientCredits && (
                  <div className="pt-2 text-rose-600 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Insufficient credits available to complete this action.</span>
                  </div>
                )}
              </div>
            ) : null}

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/60 text-amber-900 text-[11px] space-y-1">
              <span className="font-semibold block flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                Explicit Confirmation Notice
              </span>
              <span>
                Paid API credits are deducted per unique verified address. Accidental clicks are guarded by this confirmation.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting || Boolean(estimate && !estimate.hasSufficientCredits)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${submitting ? "animate-spin" : ""}`} />
              <span>{submitting ? "Submitting..." : "Confirm & Re-verify"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
