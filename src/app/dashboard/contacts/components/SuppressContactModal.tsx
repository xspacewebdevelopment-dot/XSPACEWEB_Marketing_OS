"use client";

import { useState } from "react";
import { X, ShieldAlert, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

interface SuppressContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactEmail: string;
  contactName?: string | null;
  onSuccess: () => void;
}

export function SuppressContactModal({
  isOpen,
  onClose,
  contactId,
  contactEmail,
  contactName,
  onSuccess,
}: SuppressContactModalProps) {
  const [reason, setReason] = useState<
    "MANUAL_BLOCK" | "DO_NOT_CONTACT" | "UNSUBSCRIBED" | "SPAM_COMPLAINT" | "INVALID_MAILBOX"
  >("MANUAL_BLOCK");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSuppress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/dashboard/contacts/${contactId}/suppress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to suppress contact");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to suppress contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Add to Suppression List</h2>
              <p className="text-xs text-slate-400">Prevent future email dispatches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSuppress} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <p className="text-xs text-slate-400">Target Contact:</p>
            <p className="text-sm font-semibold text-white">{contactEmail}</p>
            {contactName && <p className="text-xs text-slate-400">{contactName}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Suppression Reason <span className="text-rose-400">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <option value="MANUAL_BLOCK">Manual Block (Admin preference)</option>
              <option value="DO_NOT_CONTACT">Do Not Contact (Explicit user request)</option>
              <option value="UNSUBSCRIBED">Unsubscribed (Documented opt-out)</option>
              <option value="SPAM_COMPLAINT">Spam Complaint (Abuse report)</option>
              <option value="INVALID_MAILBOX">Invalid Mailbox (Hard bounce / undeliverable)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Audit Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason or context for auditing purposes"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              This will add <span className="font-semibold">{contactEmail}</span> to the workspace suppression list. Even if this contact is deleted in the future, its suppression record will persist to protect sender reputation.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Suppressing...
                </>
              ) : (
                "Confirm Suppression"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
