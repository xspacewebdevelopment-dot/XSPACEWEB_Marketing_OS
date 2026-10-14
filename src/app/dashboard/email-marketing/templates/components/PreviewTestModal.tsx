"use client";

import { useState } from "react";
import {
  X,
  Monitor,
  Smartphone,
  Code2,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { interpolatePersonalization, SAMPLE_PERSONALIZATION } from "@/lib/templates/compiler";

interface PreviewTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  templateId?: string;
  subject?: string | null;
  preheader?: string | null;
  htmlContent: string;
}

export function PreviewTestModal({
  isOpen,
  onClose,
  templateName,
  templateId,
  subject,
  preheader,
  htmlContent,
}: PreviewTestModalProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile" | "code" | "send">("desktop");
  const [useSampleData, setUseSampleData] = useState(true);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Send Test Email Form States
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    messageId?: string;
    from?: string;
    to?: string | string[];
    error?: string;
    sentAt?: string;
    note?: string;
  } | null>(null);

  if (!isOpen) return null;

  const currentSubject = subject || `${templateName} Preview`;
  const resolvedSubject = useSampleData
    ? interpolatePersonalization(currentSubject, SAMPLE_PERSONALIZATION)
    : currentSubject;

  const resolvedHtml = useSampleData
    ? interpolatePersonalization(htmlContent, SAMPLE_PERSONALIZATION)
    : htmlContent;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(resolvedHtml);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || isSending) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/dashboard/email-marketing/templates/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          subject: resolvedSubject,
          html: resolvedHtml,
          preheader: preheader || "",
          personalization: useSampleData ? SAMPLE_PERSONALIZATION : {},
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSendResult({
          success: false,
          error: data.error || "Resend failed to accept the test send request.",
        });
      } else {
        setSendResult({
          success: true,
          messageId: data.messageId,
          from: data.from,
          to: data.to,
          sentAt: data.sentAt,
          note: data.note,
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        error: err?.message || "Network error while connecting to test send endpoint.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {templateName}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Live Preview
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-md">
              Subject: <span className="font-medium text-slate-700">{resolvedSubject}</span>
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setViewMode("desktop")}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  viewMode === "desktop"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>

              <button
                onClick={() => setViewMode("mobile")}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  viewMode === "mobile"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>

              <button
                onClick={() => setViewMode("code")}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  viewMode === "code"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">HTML</span>
              </button>

              <button
                onClick={() => setViewMode("send")}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  viewMode === "send"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-blue-700 hover:text-blue-900 font-bold"
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Test</span>
              </button>
            </div>

            {templateId && (
              <a
                href={`/dashboard/email-marketing/templates/${templateId}/editor`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-xs"
                title="Open Template Studio in a new window"
              >
                <span>Edit in Editor</span>
                <ExternalLink className="h-3.5 w-3.5 text-blue-300" />
              </a>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Subheader: Personalization sample toggle & info */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useSampleData}
                onChange={(e) => setUseSampleData(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 font-medium flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                Render Sample Personalization ({"{{first_name}}"} &rarr; Sarah)
              </span>
            </label>
          </div>

          {viewMode === "code" && (
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              {copiedHtml ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy HTML</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 bg-slate-100 overflow-y-auto p-4 sm:p-6 flex items-start justify-center">
          {/* Desktop Mode (600px email canvas) */}
          {viewMode === "desktop" && (
            <div className="w-full max-w-[640px] h-full min-h-[600px] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col my-auto sm:my-2">
              <iframe
                title="Desktop Email Preview"
                srcDoc={resolvedHtml}
                className="w-full h-full min-h-[600px] border-0 bg-white"
                sandbox="allow-same-origin allow-popups"
              />
            </div>
          )}

          {/* Mobile Mode (375px wrapper simulating mobile client) */}
          {viewMode === "mobile" && (
            <div className="w-[375px] h-[667px] bg-white rounded-3xl shadow-2xl border-8 border-slate-800 overflow-hidden flex flex-col relative">
              <div className="h-6 bg-slate-800 flex items-center justify-center">
                <div className="h-1 w-12 bg-slate-600 rounded-full"></div>
              </div>
              <iframe
                title="Mobile Email Preview"
                srcDoc={resolvedHtml}
                className="w-full flex-1 border-0 bg-white"
                sandbox="allow-same-origin allow-popups"
              />
            </div>
          )}

          {/* Code Mode */}
          {viewMode === "code" && (
            <div className="w-full h-full max-w-4xl bg-slate-900 rounded-xl p-4 overflow-auto font-mono text-xs text-slate-200 shadow-inner">
              <pre className="whitespace-pre-wrap break-all leading-relaxed">
                {resolvedHtml}
              </pre>
            </div>
          )}

          {/* Send Test Mode */}
          {viewMode === "send" && (
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Send Real Test Email
                    </h4>
                    <p className="text-xs text-slate-500">
                      Powered by your connected Resend API infrastructure
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSendTestEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recipient Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. yourname@domain.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter an authorized inbox where you can inspect real client rendering.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Sender:</span>
                    <span className="font-semibold text-slate-800">
                      marketing@xspaceweb.com
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Subject:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[240px]">
                      [TEST] {resolvedSubject}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Personalization:</span>
                    <span className="font-semibold text-emerald-600">
                      {useSampleData ? "Active (Sample Data)" : "Raw Tags"}
                    </span>
                  </div>
                </div>

                {sendResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      sendResult.success
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-rose-50 border-rose-200 text-rose-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {sendResult.success ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Resend Request Accepted!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                          <span>Dispatch Failed</span>
                        </>
                      )}
                    </div>
                    {sendResult.success ? (
                      <div className="space-y-1 text-[11px] text-emerald-800/90 font-mono">
                        <div>Message ID: <strong className="font-bold">{sendResult.messageId}</strong></div>
                        <div>Sent to: <strong>{String(sendResult.to)}</strong></div>
                        <p className="text-[10px] text-emerald-700 italic pt-1 font-sans">
                          {sendResult.note || "The email was accepted by Resend and queued for delivery."}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-rose-700 leading-relaxed">
                        {sendResult.error}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode("desktop")}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Back to Preview
                  </button>
                  <button
                    type="submit"
                    disabled={isSending || !recipientEmail}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Sending via Resend...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Send Test Email</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
