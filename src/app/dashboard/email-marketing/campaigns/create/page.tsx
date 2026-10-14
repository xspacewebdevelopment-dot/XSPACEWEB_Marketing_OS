"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { BroadcastDetailsSegment } from "./components/BroadcastDetailsSegment";
import { TemplatePickerSegment } from "./components/TemplatePickerSegment";
import { LivePreviewPanel } from "./components/LivePreviewPanel";
import { SendConfirmationModal } from "./components/SendConfirmationModal";
import { QuickTestModal } from "./components/QuickTestModal";
import { STARTER_TEMPLATES } from "@/lib/templates/starter-templates";
import { wrapInEmailContainer } from "@/lib/templates/compiler";
import type { AudienceConfig, AudienceBreakdown } from "@/lib/types/campaigns";

function CampaignCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingId = searchParams.get("id");

  const [campaignId, setCampaignId] = useState<string | null>(existingId || null);
  const [loadingInitial, setLoadingInitial] = useState(Boolean(existingId));
  const [savingDraft, setSavingDraft] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  // Default to first starter template
  const defaultStarter = STARTER_TEMPLATES[0];
  const initialWrappedHtml = wrapInEmailContainer(defaultStarter.compiledHtml, {
    title: defaultStarter.name,
    preheader: defaultStarter.preheader,
  });

  // Campaign State
  const [formData, setFormData] = useState<{
    name: string;
    subject: string;
    preheader: string;
    fromName: string;
    fromEmail: string;
    replyTo: string;
    templateId: string | null;
    compiledHtml: string | null;
    editorJson: any;
    audienceConfig: AudienceConfig;
  }>({
    name: "",
    subject: defaultStarter.subject,
    preheader: defaultStarter.preheader,
    fromName: "NexaReach Marketing",
    fromEmail: "marketing@xspaceweb.com",
    replyTo: "",
    templateId: null,
    compiledHtml: initialWrappedHtml,
    editorJson: defaultStarter.editorJson,
    audienceConfig: {
      allContacts: true,
      contactIds: [],
      listIds: [],
      segmentIds: [],
      excludedListIds: [],
      excludedContactIds: [],
    },
  });

  const [audienceBreakdown, setAudienceBreakdown] = useState<AudienceBreakdown | null>(null);

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  // Helper to fetch audience preview breakdown
  const fetchAudienceBreakdown = useCallback(async (config: AudienceConfig) => {
    try {
      const res = await fetch("/api/dashboard/email-marketing/campaigns/audience-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const json = await res.json();
        setAudienceBreakdown(json.data);
      }
    } catch (err) {
      console.warn("Could not calculate audience preview:", err);
    }
  }, []);

  // Load existing campaign if editing an existing draft
  useEffect(() => {
    if (!existingId) {
      fetchAudienceBreakdown(formData.audienceConfig);
      return;
    }

    async function loadCampaign() {
      try {
        setLoadingInitial(true);
        const res = await fetch(`/api/dashboard/email-marketing/campaigns/${existingId}`);
        if (!res.ok) throw new Error("Campaign draft not found");

        const json = await res.json();
        const camp = json.data;

        setCampaignId(camp.id);
        setFormData({
          name: camp.name || "",
          subject: camp.subject || "",
          preheader: camp.preheader || "",
          fromName: camp.fromName || "NexaReach Marketing",
          fromEmail: camp.fromEmail || "marketing@xspaceweb.com",
          replyTo: camp.replyTo || "",
          templateId: camp.templateId || null,
          compiledHtml: camp.compiledHtml || null,
          editorJson: camp.editorJson || null,
          audienceConfig: camp.audienceConfig || {
            allContacts: true,
            contactIds: [],
            listIds: [],
            segmentIds: [],
          },
        });

        if (camp.audienceConfig) {
          fetchAudienceBreakdown(camp.audienceConfig);
        }
      } catch (err: any) {
        showNotice("error", err.message);
      } finally {
        setLoadingInitial(false);
      }
    }

    loadCampaign();
  }, [existingId, fetchAudienceBreakdown]);

  // Save Draft to Database
  const handleSaveDraft = useCallback(
    async (silent = false): Promise<string | null> => {
      try {
        if (!silent) setSavingDraft(true);

        const payload = {
          name: formData.name?.trim() || `Broadcast (${new Date().toLocaleDateString()})`,
          subject: formData.subject?.trim() || "Community Broadcast",
          preheader: formData.preheader?.trim() || null,
          fromName: formData.fromName?.trim() || "NexaReach Marketing",
          fromEmail: formData.fromEmail?.trim() || "marketing@xspaceweb.com",
          replyTo: formData.replyTo?.trim() || null,
          templateId: formData.templateId || null,
          compiledHtml: formData.compiledHtml || null,
          editorJson: formData.editorJson || null,
          audienceConfig: formData.audienceConfig || { allContacts: true },
          type: "NEWSLETTER",
          trackingSettings: { trackOpens: false, trackClicks: false },
        };

        if (campaignId) {
          // Update existing campaign
          const res = await fetch(`/api/dashboard/email-marketing/campaigns/${campaignId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await res.json().catch(() => null);
          if (!res.ok) {
            throw new Error(json?.error || "Failed to update campaign draft");
          }
          if (!silent) showNotice("success", "Draft saved successfully.");
          return campaignId;
        } else {
          // Create new campaign
          const res = await fetch("/api/dashboard/email-marketing/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await res.json().catch(() => null);
          if (!res.ok) {
            throw new Error(json?.error || "Failed to create campaign draft");
          }
          const newId = json?.data?.id;
          if (newId) {
            setCampaignId(newId);
            if (typeof window !== "undefined") {
              window.history.replaceState(
                null,
                "",
                `/dashboard/email-marketing/campaigns/create?id=${newId}`
              );
            }
          }
          if (!silent) showNotice("success", "Draft saved successfully.");
          return newId;
        }
      } catch (err: any) {
        console.warn("Save draft error:", err);
        if (!silent) showNotice("error", err.message || "Failed to save draft");
        return null;
      } finally {
        if (!silent) setSavingDraft(false);
      }
    },
    [campaignId, formData]
  );

  // Trigger Send Confirmation or Direct Dispatch
  const handleInitiateSend = async () => {
    if (!formData.subject?.trim()) {
      showNotice("error", "Please provide a subject line before sending.");
      return;
    }
    setShowConfirmModal(true);
  };

  // Execute Live Send via Resend
  const handleExecuteSend = async () => {
    if (sendingNow) return;
    try {
      setSendingNow(true);

      // Save draft first
      let targetId = campaignId;
      if (!targetId) {
        targetId = await handleSaveDraft(true);
      }
      if (!targetId) {
        showNotice("error", "Could not save campaign before dispatching.");
        return;
      }

      const res = await fetch(`/api/dashboard/email-marketing/campaigns/${targetId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        // If already in status SENDING, treat as success
        if (json?.error && (json.error.includes("already in status") || json.error.includes("SENDING"))) {
          showNotice("success", "Broadcast is in progress!");
          setShowConfirmModal(false);
          router.push(`/dashboard/email-marketing/campaigns/${targetId}`);
          return;
        }
        showNotice("error", json?.error || "Failed to initiate sending");
        return;
      }

      showNotice("success", "Broadcast campaign dispatched successfully!");
      setShowConfirmModal(false);

      // Navigate to campaign details
      router.push(`/dashboard/email-marketing/campaigns/${targetId}`);
    } catch (err: any) {
      console.error("Send error:", err);
      showNotice("error", err.message || "Failed to dispatch campaign");
    } finally {
      setSendingNow(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Loading campaign broadcast...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Navigation Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/email-marketing/campaigns"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Return to Campaigns"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  {formData.name || "New Broadcast Campaign"}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  Draft
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Streamlined email broadcast builder with live preview &amp; 1-click dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSaveDraft(false)}
              disabled={savingDraft || sendingNow}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {savingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Save Draft</span>
            </button>

            <button
              type="button"
              onClick={handleInitiateSend}
              disabled={sendingNow}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {sendingNow ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Broadcast</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Notice Banner */}
      {notice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-xs transition-all animate-in slide-in-from-top-2 duration-150 ${
              notice.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
        </div>
      )}

      {/* Main Two-Panel Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Segments (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Segment 1: Broadcast Details & Audience */}
            <BroadcastDetailsSegment
              name={formData.name}
              subject={formData.subject}
              preheader={formData.preheader}
              fromName={formData.fromName}
              fromEmail={formData.fromEmail}
              replyTo={formData.replyTo}
              audienceConfig={formData.audienceConfig}
              audienceBreakdown={audienceBreakdown}
              onUpdate={(updated) => {
                setFormData((prev) => ({ ...prev, ...updated }));
                if (updated.audienceConfig) {
                  fetchAudienceBreakdown(updated.audienceConfig);
                }
              }}
            />

            {/* Segment 2: Template Selection with Direct Studio Edit Link */}
            <TemplatePickerSegment
              selectedTemplateId={formData.templateId}
              selectedHtml={formData.compiledHtml}
              campaignId={campaignId}
              onSaveDraftBeforeEdit={() => handleSaveDraft(true)}
              onSelect={({ templateId, compiledHtml, editorJson, subject, preheader }) => {
                setFormData((prev) => ({
                  ...prev,
                  templateId,
                  compiledHtml,
                  editorJson: editorJson || prev.editorJson,
                  subject: subject || prev.subject,
                  preheader: preheader !== undefined ? preheader : prev.preheader,
                }));
                showNotice("success", "Template selected. Live preview updated.");
              }}
            />
          </div>

          {/* Right Column: CONSTANT LIVE EMAIL PREVIEW (5 cols, sticky) */}
          <div className="lg:col-span-5 sticky top-22">
            <LivePreviewPanel
              subject={formData.subject}
              preheader={formData.preheader}
              fromName={formData.fromName}
              fromEmail={formData.fromEmail}
              compiledHtml={formData.compiledHtml}
              eligibleCount={audienceBreakdown?.eligible ?? 2}
              sending={sendingNow}
              savingDraft={savingDraft}
              onSendNow={handleInitiateSend}
              onSaveDraft={() => handleSaveDraft(false)}
              onOpenTestModal={() => setShowTestModal(true)}
            />
          </div>
        </div>
      </div>

      {/* Send Confirmation Modal */}
      <SendConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirmSend={handleExecuteSend}
        campaignName={formData.name || "Broadcast Campaign"}
        fromAddress={`${formData.fromName} <${formData.fromEmail}>`}
        recipientCount={audienceBreakdown?.eligible ?? 2}
      />

      {/* Quick Test Email Modal */}
      <QuickTestModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        campaignId={campaignId}
        onSaveDraftFirst={() => handleSaveDraft(true)}
      />
    </div>
  );
}

export default function CampaignCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <CampaignCreateContent />
    </Suspense>
  );
}
