"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Save,
  AlertCircle,
  FileCode2,
  Users,
  Settings,
  Mail,
  Send,
  Loader2,
} from "lucide-react";
import { Step1Setup } from "./components/Step1Setup";
import { Step2Audience } from "./components/Step2Audience";
import { Step3Template } from "./components/Step3Template";
import { Step4Content } from "./components/Step4Content";
import { Step5Review } from "./components/Step5Review";
import type {
  CampaignType,
  AudienceConfig,
  AudienceBreakdown,
  UTMParams,
  TrackingSettings,
} from "@/lib/types/campaigns";

const STEPS = [
  { id: 1, label: "Setup", desc: "Identity & Sender", icon: Settings },
  { id: 2, label: "Audience", desc: "Recipients & Exclusions", icon: Users },
  { id: 3, label: "Design", desc: "Template & Studio", icon: FileCode2 },
  { id: 4, label: "Content", desc: "Subject & Merge Tags", icon: Mail },
  { id: 5, label: "Review", desc: "Validation & Send", icon: Send },
];

function CampaignWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingId = searchParams.get("id");
  const stepParam = searchParams.get("step");

  const [currentStep, setCurrentStep] = useState<number>(
    stepParam ? parseInt(stepParam, 10) : 1
  );

  const [campaignId, setCampaignId] = useState<string | null>(existingId || null);
  const [loadingInitial, setLoadingInitial] = useState(Boolean(existingId));
  const [savingDraft, setSavingDraft] = useState(false);
  const [calculatingAudience, setCalculatingAudience] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: CampaignType;
    fromName: string;
    fromEmail: string;
    replyTo: string;
    subject: string;
    preheader: string;
    templateId: string | null;
    compiledHtml: string | null;
    editorJson: any;
    plainText: string;
    audienceConfig: AudienceConfig;
    utmParams: UTMParams;
    trackingSettings: TrackingSettings;
    postalAddress: string;
    batchSize: number;
    batchDelayMs: number;
  }>({
    name: "",
    description: "",
    type: "NEWSLETTER",
    fromName: "NexaReach Marketing",
    fromEmail: "marketing@xspaceweb.com",
    replyTo: "",
    subject: "",
    preheader: "",
    templateId: null,
    compiledHtml: null,
    editorJson: null,
    plainText: "",
    audienceConfig: {
      contactIds: [],
      listIds: [],
      segmentIds: [],
      excludedListIds: [],
      excludedContactIds: [],
    },
    utmParams: {
      source: "nexareach",
      medium: "email",
      campaign: "",
      content: "",
    },
    trackingSettings: {
      trackOpens: false,
      trackClicks: false,
    },
    postalAddress: "NexaReach Marketing OS, 100 Innovation Way, San Francisco, CA 94105",
    batchSize: 100,
    batchDelayMs: 1000,
  });

  const [audienceBreakdown, setAudienceBreakdown] = useState<AudienceBreakdown | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 3500);
  };

  // Load existing campaign data if editing
  useEffect(() => {
    if (!existingId) return;

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
          description: camp.description || "",
          type: camp.type || "NEWSLETTER",
          fromName: camp.fromName || "",
          fromEmail: camp.fromEmail || "",
          replyTo: camp.replyTo || "",
          subject: camp.subject || "",
          preheader: camp.preheader || "",
          templateId: camp.templateId || null,
          compiledHtml: camp.compiledHtml || null,
          editorJson: camp.editorJson || null,
          plainText: camp.plainText || "",
          audienceConfig: camp.audienceConfig || {
            contactIds: [],
            listIds: [],
            segmentIds: [],
            excludedListIds: [],
            excludedContactIds: [],
          },
          utmParams: camp.utmParams || {},
          trackingSettings: camp.trackingSettings || { trackOpens: false, trackClicks: false },
          postalAddress: camp.postalAddress || "",
          batchSize: camp.batchSize || 100,
          batchDelayMs: camp.batchDelayMs || 1000,
        });

        // Calculate initial audience breakdown
        if (camp.audienceConfig) {
          fetchBreakdown(camp.audienceConfig);
        }
      } catch (err: any) {
        showNotice("error", err.message);
      } finally {
        setLoadingInitial(false);
      }
    }

    loadCampaign();
  }, [existingId]);

  // Audience breakdown calculator helper
  const fetchBreakdown = async (config: AudienceConfig) => {
    try {
      setCalculatingAudience(true);
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
      console.error(err);
    } finally {
      setCalculatingAudience(false);
    }
  };

  // Recalculate audience when audienceConfig changes
  const handleAudienceConfigChange = (newConfig: AudienceConfig) => {
    setFormData((prev) => ({ ...prev, audienceConfig: newConfig }));
    fetchBreakdown(newConfig);
  };

  // Save draft to database
  const handleSaveDraft = useCallback(
    async (silent = false): Promise<string | null> => {
      try {
        if (!silent) setSavingDraft(true);

        const payload = {
          name: formData.name?.trim() || `Untitled Campaign (${new Date().toLocaleDateString()})`,
          description: formData.description || null,
          type: formData.type || "NEWSLETTER",
          fromName: formData.fromName?.trim() || "Marketing",
          fromEmail: formData.fromEmail?.trim() || "marketing@xspacecode.com",
          replyTo: formData.replyTo?.trim() || null,
          subject: formData.subject?.trim() || "",
          preheader: formData.preheader?.trim() || null,
          templateId: formData.templateId || null,
          compiledHtml: formData.compiledHtml || null,
          editorJson: formData.editorJson || null,
          plainText: formData.plainText || null,
          audienceConfig: formData.audienceConfig || {},
          utmParams: formData.utmParams || {},
          trackingSettings: formData.trackingSettings || { trackOpens: false, trackClicks: false },
          postalAddress: formData.postalAddress?.trim() || null,
          batchSize: formData.batchSize || 100,
          batchDelayMs: formData.batchDelayMs || 1000,
        };

        if (campaignId) {
          // Update existing
          const res = await fetch(`/api/dashboard/email-marketing/campaigns/${campaignId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await res.json().catch(() => null);
          if (!res.ok) {
            throw new Error(json?.error || "Failed to update campaign draft");
          }
          if (!silent) showNotice("success", "Draft saved.");
          return campaignId;
        } else {
          // Create new
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
                `/dashboard/email-marketing/campaigns/create?id=${newId}&step=${currentStep}`
              );
            }
          }
          if (!silent) showNotice("success", "Draft saved.");
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
    [campaignId, formData, currentStep]
  );

  // Validate step transitions
  const validateCurrentStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name?.trim()) newErrors.name = "Campaign name is required";
      if (!formData.fromName?.trim()) newErrors.fromName = "From Name is required";
      if (!formData.fromEmail?.trim() || !formData.fromEmail.includes("@")) {
        newErrors.fromEmail = "Valid From Email is required";
      }
    } else if (step === 2) {
      const conf = formData.audienceConfig;
      const count =
        (conf.contactIds?.length || 0) +
        (conf.listIds?.length || 0) +
        (conf.segmentIds?.length || 0);
      if (count === 0) {
        showNotice("error", "Please select at least one contact list, segment, or contact.");
        return false;
      }
    } else if (step === 3) {
      const hasDesign = Boolean(
        formData.templateId ||
        (formData.compiledHtml && formData.compiledHtml.trim().length >= 10)
      );
      if (!hasDesign) {
        showNotice("error", "Please select a template design or edit in studio.");
        return false;
      }
    } else if (step === 4) {
      if (!formData.subject?.trim()) newErrors.subject = "Subject line is required";
      if (!formData.postalAddress?.trim()) newErrors.postalAddress = "Postal address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateCurrentStep(currentStep)) return;

    // Ensure template HTML is synced if templateId is chosen but compiledHtml was empty
    if (
      currentStep === 3 &&
      formData.templateId &&
      (!formData.compiledHtml || formData.compiledHtml.trim().length < 10)
    ) {
      try {
        const res = await fetch(`/api/dashboard/email-marketing/templates/${formData.templateId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data?.compiledHtml) {
            formData.compiledHtml = json.data.compiledHtml;
            formData.editorJson = json.data.editorJson;
            setFormData((prev) => ({
              ...prev,
              compiledHtml: json.data.compiledHtml,
              editorJson: json.data.editorJson,
            }));
          }
        }
      } catch (err) {
        console.warn("Could not sync template HTML on next:", err);
      }
    }

    await handleSaveDraft(true);
    setCurrentStep((prev) => Math.min(STEPS.length, prev + 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Launch Live Sending
  const handleSendNow = async () => {
    let targetId = campaignId;
    if (!targetId) {
      targetId = await handleSaveDraft(true);
    }
    if (!targetId) {
      throw new Error("Could not save campaign before dispatching. Please try saving draft.");
    }

    const res = await fetch(`/api/dashboard/email-marketing/campaigns/${targetId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmed: true }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || "Failed to initiate sending");

    showNotice("success", "Campaign launched successfully!");
    router.push(`/dashboard/email-marketing/campaigns/${targetId}`);
  };

  // Schedule Campaign
  const handleScheduleSend = async (scheduledAtIso: string, timezone: string) => {
    let targetId = campaignId;
    if (!targetId) {
      targetId = await handleSaveDraft(true);
    }
    if (!targetId) {
      throw new Error("Could not save campaign before scheduling. Please try saving draft.");
    }

    const res = await fetch(`/api/dashboard/email-marketing/campaigns/${targetId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledAt: scheduledAtIso,
        timezone,
        confirmed: true,
      }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || "Failed to schedule campaign");

    showNotice("success", "Campaign scheduled successfully!");
    router.push(`/dashboard/email-marketing/campaigns/${targetId}`);
  };

  if (loadingInitial) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#061321] text-slate-300">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col select-none">
      {/* Toast Notice */}
      {notice && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold shadow-lg animate-in fade-in duration-200 ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* TOP WIZARD APP BAR */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/email-marketing/campaigns"
            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-xs transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 truncate max-w-xs">
                {formData.name || "New Campaign"}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {formData.type}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              5-Step Campaign Builder &bull; Inngest Batch Dispatch
            </span>
          </div>
        </div>

        {/* Save Draft Action */}
        <button
          type="button"
          onClick={() => handleSaveDraft(false)}
          disabled={savingDraft}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer"
        >
          {savingDraft ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
          ) : (
            <Save className="h-3.5 w-3.5 text-blue-600" />
          )}
          <span>Save Draft</span>
        </button>
      </header>

      {/* STEP PROGRESS TRACKER */}
      <div className="border-b border-slate-200 bg-white px-6 py-3.5 shrink-0 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => {
                    if (isCompleted) setCurrentStep(step.id);
                  }}
                  disabled={!isCompleted && !isCurrent}
                  className={`flex items-center gap-2.5 text-left transition-all ${
                    isCurrent
                      ? "text-blue-600 font-bold"
                      : isCompleted
                      ? "text-slate-700 hover:text-slate-900 cursor-pointer"
                      : "text-slate-400 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-blue-600 text-white shadow-xs"
                        : isCompleted
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs leading-none">{step.label}</div>
                    <div className="text-[10px] text-slate-500 mt-1 leading-none">{step.desc}</div>
                  </div>
                </button>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 sm:mx-4 transition-all ${
                      isCompleted ? "bg-emerald-400" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN STEP CONTENT AREA */}
      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full overflow-y-auto">
        {currentStep === 1 && (
          <Step1Setup
            formData={formData}
            onChange={(fields) => setFormData((prev) => ({ ...prev, ...fields }))}
            errors={errors}
          />
        )}

        {currentStep === 2 && (
          <Step2Audience
            audienceConfig={formData.audienceConfig}
            onChange={handleAudienceConfigChange}
            breakdown={audienceBreakdown}
            calculating={calculatingAudience}
            onRecalculate={() => fetchBreakdown(formData.audienceConfig)}
          />
        )}

        {currentStep === 3 && (
          <Step3Template
            campaignId={campaignId || undefined}
            templateId={formData.templateId}
            compiledHtml={formData.compiledHtml}
            editorJson={formData.editorJson}
            onChange={(tmplData) => setFormData((prev) => ({ ...prev, ...tmplData }))}
            onSaveDraftBeforeEdit={() => handleSaveDraft(true)}
          />
        )}

        {currentStep === 4 && (
          <Step4Content
            campaignId={campaignId || undefined}
            formData={{
              subject: formData.subject,
              preheader: formData.preheader,
              fromName: formData.fromName,
              fromEmail: formData.fromEmail,
              postalAddress: formData.postalAddress,
              utmParams: formData.utmParams,
              trackingSettings: formData.trackingSettings,
            }}
            compiledHtml={formData.compiledHtml}
            sampleRecipients={audienceBreakdown?.sampleEligible || []}
            onChange={(fields) => setFormData((prev) => ({ ...prev, ...fields }))}
            errors={errors}
          />
        )}

        {currentStep === 5 && (
          <Step5Review
            campaignId={campaignId || undefined}
            formData={{
              name: formData.name,
              type: formData.type,
              fromName: formData.fromName,
              fromEmail: formData.fromEmail,
              replyTo: formData.replyTo,
              subject: formData.subject,
              preheader: formData.preheader,
              postalAddress: formData.postalAddress,
              batchSize: formData.batchSize,
              batchDelayMs: formData.batchDelayMs,
            }}
            compiledHtml={formData.compiledHtml}
            breakdown={audienceBreakdown}
            onSaveDraft={() => handleSaveDraft(false).then(() => {})}
            onSendNow={handleSendNow}
            onScheduleSend={handleScheduleSend}
            savingDraft={savingDraft}
            onUpdateBatchSettings={(batchSize, batchDelayMs) =>
              setFormData((prev) => ({ ...prev, batchSize, batchDelayMs }))
            }
          />
        )}
      </main>

      {/* BOTTOM WIZARD NAVIGATION BAR */}
      <footer className="h-16 border-t border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 sticky bottom-0 z-20 shadow-xs">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer"
        >
          &larr; Back
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono">
            Step {currentStep} of {STEPS.length}
          </span>

          {currentStep < 5 && (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs shadow-blue-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function CampaignWizardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-slate-700">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Loading Campaign Builder...</span>
          </div>
        </div>
      }
    >
      <CampaignWizardContent />
    </Suspense>
  );
}

