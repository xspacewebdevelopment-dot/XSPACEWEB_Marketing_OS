"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PhoneCall,
  Users,
  FileText,
  Volume2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Play,
  Square,
  RotateCw,
  Save,
  Check,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Radio,
  Filter,
  Sliders,
  Send,
  Loader2,
} from "lucide-react";

interface VoiceComposerProps {
  initialDraftId?: string | null;
  initialTemplateId?: string | null;
  phoneContactsCount?: number;
}

export function VoiceComposerTab({
  initialDraftId,
  initialTemplateId,
  phoneContactsCount = 0,
}: VoiceComposerProps) {
  const router = useRouter();

  // Wizard Step (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Campaign State
  const [campaignId, setCampaignId] = useState<string | null>(initialDraftId || null);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("NOTIFICATION");
  const [status, setStatus] = useState<string>("DRAFT");

  // Voice Settings State
  const [scriptText, setScriptText] = useState<string>("");
  const [language, setLanguage] = useState<string>("en-US");
  const [voiceId, setVoiceId] = useState<string>("alloy");
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);

  // Audience State
  const [audienceType, setAudienceType] = useState<"ALL" | "LIST" | "SEGMENT" | "TEST">("ALL");
  const [listId, setListId] = useState<string>("");
  const [segmentId, setSegmentId] = useState<string>("");
  const [testPhone, setTestPhone] = useState<string>("");

  // Lists & Segments data from workspace
  const [availableLists, setAvailableLists] = useState<any[]>([]);
  const [availableSegments, setAvailableSegments] = useState<any[]>([]);

  // Server-Calculated Audience Eligibility
  const [eligibility, setEligibility] = useState<any | null>(null);
  const [isCalculatingAudience, setIsCalculatingAudience] = useState<boolean>(false);

  // Scheduling State
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("UTC");

  // Save / Action States
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPreflightChecking, setIsPreflightChecking] = useState<boolean>(false);
  const [preflightResults, setPreflightResults] = useState<{
    passed: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  // Browser SpeechSynthesis State (Audio Preview)
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);

  // Notice Toast
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const showToast = (type: "success" | "error" | "info", message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4500);
  };

  // Check browser SpeechSynthesis availability
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSpeechSupported(true);
    }
  }, []);

  // Fetch lists and segments for audience picker
  useEffect(() => {
    async function loadAudiences() {
      try {
        const [listsRes, segsRes] = await Promise.all([
          fetch("/api/dashboard/lists"),
          fetch("/api/dashboard/segments"),
        ]);
        if (listsRes.ok) {
          const lData = await listsRes.json();
          if (Array.isArray(lData.lists)) setAvailableLists(lData.lists);
        }
        if (segsRes.ok) {
          const sData = await segsRes.json();
          if (Array.isArray(sData.segments)) setAvailableSegments(sData.segments);
        }
      } catch {
        // Gracefully ignore fetch errors
      }
    }
    loadAudiences();
  }, []);

  // Load initial template if provided
  useEffect(() => {
    if (!initialTemplateId) return;
    async function loadTemplate() {
      try {
        const res = await fetch(`/api/dashboard/voice-campaigns/templates/${initialTemplateId}`);
        const data = await res.json();
        if (res.ok && data.success && data.template) {
          setName((prev) => prev || `${data.template.name} Campaign`);
          setScriptText(data.template.scriptText);
          if (data.template.language) setLanguage(data.template.language);
          if (data.template.voiceId) setVoiceId(data.template.voiceId);
          if (data.template.speed) setSpeed(data.template.speed);
          showToast("info", `Applied voice template "${data.template.name}".`);
        }
      } catch {
        // ignore
      }
    }
    loadTemplate();
  }, [initialTemplateId]);

  // Load existing campaign draft if provided
  useEffect(() => {
    if (!campaignId) return;
    async function loadExisting() {
      try {
        const res = await fetch(`/api/dashboard/voice-campaigns/campaigns/${campaignId}`);
        const data = await res.json();
        if (res.ok && data.success && data.campaign) {
          const c = data.campaign;
          setName(c.name || "");
          setDescription(c.description || "");
          setPurpose(c.purpose || "NOTIFICATION");
          setStatus(c.status || "DRAFT");
          setScriptText(c.scriptText || "");
          setLanguage(c.language || "en-US");
          setVoiceId(c.voiceId || "alloy");
          setSpeed(c.speed || 1.0);
          setPitch(c.pitch || 1.0);
          setAudienceType(c.audienceType || "ALL");
          setListId(c.listId || "");
          setSegmentId(c.segmentId || "");
          setTestPhone(c.testPhone || "");
          if (c.scheduledAt) {
            setScheduledAt(new Date(c.scheduledAt).toISOString().slice(0, 16));
          }
          if (c.timezone) setTimezone(c.timezone);
        }
      } catch {
        // ignore
      }
    }
    loadExisting();
  }, [campaignId]);

  // Server-Side Audience Calculation
  const calculateAudience = useCallback(async () => {
    setIsCalculatingAudience(true);
    try {
      const res = await fetch("/api/dashboard/voice-campaigns/campaigns/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audienceType,
          listId: audienceType === "LIST" ? listId : null,
          segmentId: audienceType === "SEGMENT" ? segmentId : null,
          testPhone: audienceType === "TEST" ? testPhone : null,
          scriptText,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.audience) {
        setEligibility(data.audience);
      }
    } catch {
      // ignore
    } finally {
      setIsCalculatingAudience(false);
    }
  }, [audienceType, listId, segmentId, testPhone, scriptText]);

  // Automatically recalculate audience on audience params change
  useEffect(() => {
    if (currentStep >= 2) {
      calculateAudience();
    }
  }, [currentStep, calculateAudience]);

  // Live Script Metrics
  const scriptMetrics = useMemo(() => {
    const trimmed = (scriptText || "").trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const characters = trimmed.length;
    const baseSeconds = words > 0 ? Math.ceil((words / 130) * 60) : 0;
    const estimatedDurationSeconds = Math.max(1, Math.round(baseSeconds / Math.max(0.5, speed || 1.0)));
    return { words, characters, estimatedDurationSeconds };
  }, [scriptText, speed]);

  // Sample substituted script preview
  const sampleSubstitutedScript = useMemo(() => {
    const sample = eligibility?.eligibleContacts?.[0] || {
      firstName: "Alex",
      lastName: "Taylor",
      company: "Acme Corp",
      city: "Metropolis",
      phone: "+1 555-0199",
    };
    let txt = scriptText;
    txt = txt.replace(/{{\s*firstName\s*}}/gi, sample.firstName || "Customer");
    txt = txt.replace(/{{\s*lastName\s*}}/gi, sample.lastName || "");
    txt = txt.replace(/{{\s*company\s*}}/gi, sample.company || "our team");
    txt = txt.replace(/{{\s*city\s*}}/gi, sample.city || "your area");
    txt = txt.replace(/{{\s*phone\s*}}/gi, sample.phone || "");
    return txt;
  }, [scriptText, eligibility]);

  // Browser SpeechSynthesis Preview
  const handlePlayAudio = () => {
    if (!speechSupported) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sampleSubstitutedScript);
    utterance.rate = speed;
    utterance.pitch = pitch;
    utterance.lang = language;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleStopAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  // Stop audio if component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Save Draft at any step
  const handleSaveDraft = async (targetStatus = "DRAFT") => {
    if (!name.trim()) {
      showToast("error", "Campaign name is required to save.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        id: campaignId || undefined,
        name: name.trim(),
        description: description.trim() || null,
        purpose,
        status: targetStatus,
        scriptText: scriptText.trim() || "Draft voice campaign script.",
        language,
        voiceId,
        speed,
        pitch,
        audienceType,
        listId: audienceType === "LIST" ? listId : null,
        segmentId: audienceType === "SEGMENT" ? segmentId : null,
        testPhone: audienceType === "TEST" ? testPhone : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        timezone,
      };

      const res = await fetch("/api/dashboard/voice-campaigns/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save campaign");
      }

      setCampaignId(data.campaign.id);
      setStatus(data.campaign.status);
      showToast("success", `Campaign saved as ${targetStatus.toLowerCase()}.`);
      return data.campaign;
    } catch (err: any) {
      showToast("error", err.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  // Run Pre-flight Checks (Step 5)
  const runPreflight = async () => {
    setIsPreflightChecking(true);
    try {
      // First ensure draft is saved
      const saved = await handleSaveDraft("DRAFT");
      if (!saved?.id) return;

      const res = await fetch(`/api/dashboard/voice-campaigns/campaigns/${saved.id}/preflight`);
      const data = await res.json();
      if (res.ok && data.success && data.preflight) {
        setPreflightResults(data.preflight);
      }
    } catch {
      // ignore
    } finally {
      setIsPreflightChecking(false);
    }
  };

  // Trigger Pre-flight check when entering Step 5
  useEffect(() => {
    if (currentStep === 5) {
      runPreflight();
    }
  }, [currentStep]);

  // Insert Variable Tag Helper
  const insertVariable = (tag: string) => {
    setScriptText((prev) => `${prev} ${tag}`.trimStart());
  };

  // Save as Template
  const handleSaveAsTemplate = async () => {
    if (!scriptText.trim()) {
      showToast("error", "Script text cannot be empty to save as template.");
      return;
    }
    try {
      const res = await fetch("/api/dashboard/voice-campaigns/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${name.trim() || "Voice"} Template`,
          description: `Saved from ${name || "voice campaign"}.`,
          category: purpose,
          scriptText: scriptText.trim(),
          language,
          voiceId,
          speed,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Script successfully saved to Voice Templates library.");
      } else {
        throw new Error(data.error || "Failed to save template");
      }
    } catch (err: any) {
      showToast("error", err.message || "Could not save template");
    }
  };

  // Step 1 Validation
  const canProceedStep1 = name.trim().length > 0;
  // Step 2 Validation
  const canProceedStep2 =
    audienceType === "ALL" ||
    (audienceType === "LIST" && listId) ||
    (audienceType === "SEGMENT" && segmentId) ||
    (audienceType === "TEST" && testPhone.trim());
  // Step 3 Validation
  const canProceedStep3 = scriptText.trim().length >= 10;

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : notice.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <span>{notice.message}</span>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-700 font-bold ml-4">
            ×
          </button>
        </div>
      )}

      {/* Wizard Step Progression Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {[
            { num: 1, label: "Campaign Details" },
            { num: 2, label: "Audience & Consent" },
            { num: 3, label: "Voice Script Studio" },
            { num: 4, label: "Preview & Synthesis" },
            { num: 5, label: "Pre-flight & Schedule" },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => {
                  if (s.num < currentStep) setCurrentStep(s.num);
                }}
                disabled={s.num > currentStep}
                className="flex items-center gap-2.5 text-left group cursor-pointer disabled:cursor-not-allowed"
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === s.num
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-4 ring-blue-50"
                      : currentStep > s.num
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {currentStep > s.num ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <div className="hidden sm:block">
                  <span
                    className={`block text-xs font-semibold ${
                      currentStep === s.num
                        ? "text-blue-600"
                        : currentStep > s.num
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="block text-[10px] text-slate-400">Step {s.num} of 5</span>
                </div>
              </button>
              {idx < 4 && (
                <div
                  className={`flex-1 h-0.5 mx-3 hidden sm:block ${
                    currentStep > idx + 1 ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STEP 1: CAMPAIGN DETAILS */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6 max-w-3xl mx-auto">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Step 1: Campaign Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set the internal identity, purpose, and classification for this voice campaign.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Campaign Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q4 Client Consultation Reminder"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Internal Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Internal notes regarding target goals, audience segment, or department owner..."
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Campaign Purpose / Category
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 cursor-pointer"
              >
                <option value="NOTIFICATION">Service Notification</option>
                <option value="REMINDER">Appointment / Event Reminder</option>
                <option value="SURVEY">Customer Experience Survey (NPS)</option>
                <option value="TRANSACTIONAL">Order / Billing Update</option>
                <option value="PROMOTIONAL">Promotional / Special Announcement</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Used for internal audit logs and compliance classification.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => handleSaveDraft("DRAFT")}
              disabled={isSaving || !name.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? "Saving..." : "Save Draft"}</span>
            </button>

            <button
              onClick={() => {
                handleSaveDraft("DRAFT");
                setCurrentStep(2);
              }}
              disabled={!canProceedStep1}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>Next: Select Audience</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AUDIENCE & CONSENT */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 2: Audience Selection & Compliance</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Target recipients are strictly evaluated against voice-specific consent and suppression records.
              </p>
            </div>
            <button
              onClick={calculateAudience}
              disabled={isCalculatingAudience}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isCalculatingAudience ? "animate-spin text-blue-600" : ""}`} />
              <span>Recalculate</span>
            </button>
          </div>

          {/* Compliance Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold">Independent Voice Consent Required</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                NexaReach enforces strict channel consent separation. An SMS opt-in <strong>does not</strong> authorize automated voice phone calls. Contacts with pending voice consent or on the voice suppression list will be automatically excluded.
              </p>
            </div>
          </div>

          {/* Audience Type Radio Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              {
                id: "ALL",
                title: "All Contacts",
                desc: "All contacts in current workspace",
                icon: Users,
              },
              {
                id: "LIST",
                title: "Contact List",
                desc: "Target a specific saved list",
                icon: Layers,
              },
              {
                id: "SEGMENT",
                title: "Dynamic Segment",
                desc: "Filter by criteria & rules",
                icon: Filter,
              },
              {
                id: "TEST",
                title: "Direct Test Phone",
                desc: "Direct single phone test",
                icon: Radio,
              },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => setAudienceType(item.id as any)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  audienceType === item.id
                    ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 mb-2 ${
                    audienceType === item.id ? "text-blue-600" : "text-slate-400"
                  }`}
                />
                <div className="text-xs font-bold text-slate-900">{item.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Specific selector based on audienceType */}
          {audienceType === "LIST" && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Contact List
              </label>
              <select
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden text-slate-800"
              >
                <option value="">-- Choose a Contact List --</option>
                {availableLists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.contactCount || 0} contacts)
                  </option>
                ))}
              </select>
            </div>
          )}

          {audienceType === "SEGMENT" && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Dynamic Segment
              </label>
              <select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden text-slate-800"
              >
                <option value="">-- Choose a Segment --</option>
                {availableSegments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.matchingCount || 0} matching)
                  </option>
                ))}
              </select>
            </div>
          )}

          {audienceType === "TEST" && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Direct Test Phone Number (with Country Code)
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+14155552671"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden text-slate-800 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Normalized to international E.164 without assuming US formatting.
              </span>
            </div>
          )}

          {/* Eligibility Results Breakdown Card */}
          {eligibility && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Server-Side Eligibility Telemetry
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified Server Rules
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Total Selected</span>
                  <span className="text-xl font-bold text-slate-900 mt-0.5 block font-mono">
                    {eligibility.totalSelected}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-medium block">Eligible Recipients</span>
                  <span className="text-xl font-bold text-emerald-800 mt-0.5 block font-mono">
                    {eligibility.eligibleCount}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                  <span className="text-[11px] text-rose-700 font-medium block">Excluded Contacts</span>
                  <span className="text-xl font-bold text-rose-800 mt-0.5 block font-mono">
                    {eligibility.excludedCount}
                  </span>
                </div>
              </div>

              {/* Exclusion breakdown */}
              {eligibility.excludedCount > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-2">
                    Exclusion Reasons Itemization:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
                      Pending Consent: <span className="font-semibold text-rose-700">{eligibility.exclusionBreakdown.consentPending}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
                      Active Suppression: <span className="font-semibold text-rose-700">{eligibility.exclusionBreakdown.activeSuppression}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
                      Invalid Phone: <span className="font-semibold text-rose-700">{eligibility.exclusionBreakdown.invalidPhone}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
                      Missing Phone: <span className="font-semibold text-rose-700">{eligibility.exclusionBreakdown.missingPhone}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
                      Explicit Opt-Out: <span className="font-semibold text-rose-700">{eligibility.exclusionBreakdown.explicitOptOut}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => {
                handleSaveDraft("DRAFT");
                setCurrentStep(3);
              }}
              disabled={!canProceedStep2}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>Next: Voice Script Studio</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VOICE SCRIPT STUDIO */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 3: Voice Script Studio & Synthesis Config</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compose spoken script with dynamic variable tags, speech cadence, and language options.
              </p>
            </div>
            <button
              onClick={handleSaveAsTemplate}
              disabled={!scriptText.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer disabled:opacity-40"
            >
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <span>Save as Template</span>
            </button>
          </div>

          {/* Voice Preferences Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Language / Accent
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish (Spain)</option>
                <option value="fr-FR">French (France)</option>
                <option value="de-DE">German (Germany)</option>
                <option value="hi-IN">Hindi (India)</option>
                <option value="ja-JP">Japanese (Japan)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Voice Timbre Character
              </label>
              <select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 capitalize"
              >
                <option value="alloy">Alloy (Neutral & Clear)</option>
                <option value="echo">Echo (Warm & Resonant)</option>
                <option value="fable">Fable (Expressive & Calm)</option>
                <option value="onyx">Onyx (Deep & Authoritative)</option>
                <option value="nova">Nova (Bright & Energetic)</option>
                <option value="shimmer">Shimmer (Gentle & Smooth)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Cadence Speed ({speed}x)
              </label>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full mt-2 accent-blue-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Pitch Modulation ({pitch}x)
              </label>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full mt-2 accent-blue-600"
              />
            </div>
          </div>

          {/* Dynamic Placeholders Insertion Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-blue-500" /> Insert Variable:
            </span>
            {[
              { tag: "{{firstName}}", label: "First Name" },
              { tag: "{{lastName}}", label: "Last Name" },
              { tag: "{{company}}", label: "Company" },
              { tag: "{{city}}", label: "City" },
              { tag: "{{phone}}", label: "Phone" },
              { tag: "{{appointmentTime}}", label: "Time" },
            ].map((v) => (
              <button
                key={v.tag}
                type="button"
                onClick={() => insertVariable(v.tag)}
                className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                {v.tag}
              </button>
            ))}
          </div>

          {/* Script Text Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Voice Call Script <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              rows={6}
              placeholder="Hello {{firstName}}, this is a courtesy notification from {{company}} regarding your upcoming..."
              className="w-full p-4 text-xs font-sans rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 leading-relaxed placeholder:text-slate-400"
            />
            {/* Live Metrics Counter */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1">
              <div className="flex items-center gap-3">
                <span>{scriptMetrics.words} words</span>
                <span>•</span>
                <span>{scriptMetrics.characters} characters</span>
                <span>•</span>
                <span className="text-blue-600 font-medium">
                  ~{scriptMetrics.estimatedDurationSeconds}s spoken duration
                </span>
              </div>
              <span className="text-slate-400">Max limit: 3,000 characters</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => {
                handleSaveDraft("DRAFT");
                setCurrentStep(4);
              }}
              disabled={!canProceedStep3}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>Next: Preview & Synthesis</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PREVIEW & LOCAL AUDIO SYNTHESIS */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Step 4: Campaign Preview & Audio Synthesis</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review substituted recipient copy and test speech audio using local browser synthesis.
            </p>
          </div>

          {/* Audio Preview Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold tracking-wide">
                    Local Speech Preview Studio
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Browser Web SpeechSynthesis API • Not Provider Audio
                  </span>
                </div>
              </div>

              {speechSupported ? (
                <div className="flex items-center gap-2">
                  {isPlayingAudio ? (
                    <button
                      onClick={handleStopAudio}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" />
                      <span>Stop Audio</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePlayAudio}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Play Browser Preview</span>
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 italic">
                  SpeechSynthesis unavailable in current browser
                </span>
              )}
            </div>

            {/* Substituted script display */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-700/60 font-sans text-xs text-slate-200 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
              {sampleSubstitutedScript}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
              <span>Voice: <strong className="text-white capitalize">{voiceId}</strong> ({language})</span>
              <span>Cadence: <strong className="text-white">{speed}x</strong> speed</span>
              <span>Est. Call Duration: <strong className="text-white">~{scriptMetrics.estimatedDurationSeconds} seconds</strong></span>
            </div>
          </div>

          {/* Compliance & Audience Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800">Target Audience Summary</span>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Audience Mode:</span>
                  <span className="font-semibold uppercase text-slate-800">{audienceType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Eligible Recipients:</span>
                  <span className="font-semibold text-emerald-700">{eligibility?.eligibleCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Excluded Contacts:</span>
                  <span className="font-semibold text-rose-700">{eligibility?.excludedCount || 0}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800">Safety & Telephony Checklist</span>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Voice consent verified independently from SMS</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>E.164 phone normalization active</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Channel suppression rules enforced</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                handleStopAudio();
                setCurrentStep(3);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => {
                handleStopAudio();
                handleSaveDraft("DRAFT");
                setCurrentStep(5);
              }}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <span>Next: Pre-flight & Schedule</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: PRE-FLIGHT REVIEW & SCHEDULING */}
      {currentStep === 5 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Step 5: Pre-flight Validation & Scheduling</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review automated integrity checks before saving draft or queueing for future dry-run execution.
            </p>
          </div>

          {/* Pre-flight Checklist Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Automated Pre-Flight Checklist
              </span>
              {isPreflightChecking ? (
                <span className="text-xs text-blue-600 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Running checks...
                </span>
              ) : preflightResults?.passed ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" /> All System Checks Passed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                  <AlertCircle className="h-3.5 w-3.5" /> Action Required
                </span>
              )}
            </div>

            {/* Errors */}
            {preflightResults && preflightResults.errors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5 text-xs text-rose-800">
                <span className="font-semibold block">Critical Errors (Must resolve to schedule):</span>
                {preflightResults.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {preflightResults && preflightResults.warnings.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs text-amber-800">
                <span className="font-semibold block">System Notices & Advisories:</span>
                {preflightResults.warnings.map((warn, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scheduling Configuration */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
            <span className="text-xs font-bold text-slate-800 block">Execution Mode & Timing</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Schedule Execution Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Leave empty to retain campaign as a manual draft.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Workspace Time Zone
                </label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2.5">
              {/* Save Draft */}
              <button
                onClick={() => handleSaveDraft("DRAFT")}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Draft</span>
              </button>

              {/* Schedule or Queue Dry Run */}
              <button
                onClick={async () => {
                  const targetStatus = scheduledAt ? "SCHEDULED" : "READY_FOR_REVIEW";
                  const saved = await handleSaveDraft(targetStatus);
                  if (saved) {
                    showToast("success", `Campaign saved as ${targetStatus}.`);
                    router.push("/dashboard/voice-campaigns/campaigns");
                  }
                }}
                disabled={isSaving || Boolean(preflightResults && !preflightResults.passed)}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {scheduledAt ? (
                  <>
                    <Calendar className="h-4 w-4" />
                    <span>Confirm Schedule</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Mark Ready for Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
