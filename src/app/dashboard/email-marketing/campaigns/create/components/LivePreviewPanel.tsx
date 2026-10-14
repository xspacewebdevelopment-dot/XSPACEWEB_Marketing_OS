"use client";

import { useState, useMemo } from "react";
import {
  Monitor,
  Smartphone,
  Send,
  Save,
  CheckCircle2,
  Mail,
  Loader2,
  Sparkles,
  Maximize2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { interpolatePersonalization, wrapInEmailContainer } from "@/lib/templates/compiler";

interface LivePreviewPanelProps {
  subject: string;
  preheader: string;
  fromName: string;
  fromEmail: string;
  compiledHtml: string | null;
  eligibleCount: number;
  sending: boolean;
  savingDraft: boolean;
  onSendNow: () => void;
  onSaveDraft: () => void;
  onOpenTestModal: () => void;
}

export function LivePreviewPanel({
  subject,
  preheader,
  fromName,
  fromEmail,
  compiledHtml,
  eligibleCount,
  sending,
  savingDraft,
  onSendNow,
  onSaveDraft,
  onOpenTestModal,
}: LivePreviewPanelProps) {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [useSampleData, setUseSampleData] = useState(true);

  // Sample data for realistic email rendering
  const sampleData = {
    first_name: "Alex",
    last_name: "Morgan",
    email: "alex.morgan@acmecorp.com",
    company: "Acme Corporation",
    city: "San Francisco",
    unsubscribe_url: "https://nexareach.com/unsubscribe?sample=true",
  };

  const renderedHtml = useMemo(() => {
    let raw = compiledHtml || "<p style='padding: 24px; color: #64748b;'>Select a template from the list to preview the broadcast design.</p>";
    if (useSampleData) {
      raw = interpolatePersonalization(raw, sampleData);
    }
    return wrapInEmailContainer(raw, {
      title: subject || "Broadcast Email",
      preheader: preheader || undefined,
    });
  }, [compiledHtml, subject, preheader, useSampleData]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col h-full overflow-hidden sticky top-6">
      {/* Top Preview Bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800 tracking-tight">Live Broadcast Preview</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-700 font-bold border border-blue-200/60">
            Real-Time
          </span>
        </div>

        {/* Device Mode Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setDeviceMode("desktop")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              deviceMode === "desktop"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode("mobile")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              deviceMode === "mobile"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>
      </div>

      {/* Simulated Email Client Envelope Header */}
      <div className="px-5 py-3 bg-white border-b border-slate-100 space-y-1.5 text-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">From:</span>
              <span className="font-semibold text-slate-900 truncate">
                {fromName || "NexaReach Marketing"} &lt;{fromEmail || "marketing@xspacecode.com"}&gt;
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subject:</span>
              <span className="font-bold text-slate-900 truncate">
                {subject || <span className="text-slate-400 italic">No subject line provided yet</span>}
              </span>
            </div>
            {preheader && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Snippet:</span>
                <span className="text-slate-500 truncate">{preheader}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenTestModal}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer shrink-0 py-1"
          >
            Send Test Email
          </button>
        </div>
      </div>

      {/* Canvas / IFrame View */}
      <div className="flex-1 bg-slate-100/70 p-4 sm:p-6 overflow-y-auto flex items-start justify-center min-h-[460px] max-h-[600px]">
        <div
          style={{
            width: deviceMode === "mobile" ? "375px" : "100%",
            maxWidth: deviceMode === "mobile" ? "375px" : "640px",
          }}
          className={`bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden transition-all duration-200 ${
            deviceMode === "mobile" ? "ring-8 ring-slate-800 rounded-3xl my-2" : ""
          }`}
        >
          <iframe
            title="Campaign Live Preview"
            srcDoc={renderedHtml}
            className="w-full min-h-[480px] border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </div>

      {/* Bottom Dispatch Controls */}
      <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            ✓
          </div>
          <div>
            <div className="font-bold text-slate-900">
              Target Audience: {eligibleCount} Contacts
            </div>
            <div className="text-[11px] text-slate-500">
              Ready to broadcast to entire workspace audience
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={savingDraft || sending}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
          >
            {savingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={onSendNow}
            disabled={sending}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send Broadcast Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
