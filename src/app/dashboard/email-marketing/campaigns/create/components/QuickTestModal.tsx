"use client";

import { useState } from "react";
import { Send, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface QuickTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string | null;
  onSaveDraftFirst: () => Promise<string | null>;
}

export function QuickTestModal({
  isOpen,
  onClose,
  campaignId,
  onSaveDraftFirst,
}: QuickTestModalProps) {
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes("@")) {
      setFeedback({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    try {
      setSending(true);
      setFeedback(null);

      // Save campaign draft first to ensure latest content is in DB
      let targetId = campaignId;
      if (!targetId) {
        targetId = await onSaveDraftFirst();
      }
      if (!targetId) {
        throw new Error("Could not save campaign draft before test sending.");
      }

      const res = await fetch(`/api/dashboard/email-marketing/campaigns/${targetId}/test-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail: testEmail.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to dispatch test email");
      }

      setFeedback({
        type: "success",
        message: `Test email sent to ${testEmail}! Check your inbox in a few moments.`,
      });
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 2500);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to send test email" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Send Test Email</h3>
              <p className="text-[11px] text-slate-500">Preview the broadcast directly in your inbox.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSendTest} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Recipient Email Address
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="e.g. yourname@company.com"
              required
              className="w-full px-3.5 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 font-medium"
            />
            <p className="text-[11px] text-slate-400">
              The test email will be sent through Resend with [TEST] prepended to the subject line.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              <span>{sending ? "Sending..." : "Send Test"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
