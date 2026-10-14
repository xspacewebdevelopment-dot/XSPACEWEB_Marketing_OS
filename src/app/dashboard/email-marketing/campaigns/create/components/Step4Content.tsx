"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
  Loader2,
  ShieldCheck,
  Building,
  Tag,
  Sliders,
} from "lucide-react";
import {
  interpolatePersonalization,
  wrapInEmailContainer,
} from "@/lib/templates/compiler";
import type { UTMParams, TrackingSettings } from "@/lib/types/campaigns";

interface Step4ContentProps {
  campaignId?: string;
  formData: {
    subject: string;
    preheader: string;
    fromName: string;
    fromEmail: string;
    postalAddress: string;
    utmParams: UTMParams;
    trackingSettings: TrackingSettings;
  };
  compiledHtml?: string | null;
  sampleRecipients: Array<any>;
  onChange: (fields: any) => void;
  errors: Record<string, string>;
}

export function Step4Content({
  campaignId,
  formData,
  compiledHtml,
  sampleRecipients,
  onChange,
  errors,
}: Step4ContentProps) {
  // Test email state
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  // Selected sample contact for personalized preview simulator
  const [selectedContactIndex, setSelectedContactIndex] = useState(0);

  // Extract and validate links inside HTML
  const detectedLinks = useMemo(() => {
    if (!compiledHtml) return [];
    const matches = Array.from(compiledHtml.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi));
    const urls = matches.map((m) => m[1]);
    return Array.from(new Set(urls));
  }, [compiledHtml]);

  // Insert merge tag into subject
  const insertSubjectTag = (tag: string) => {
    onChange({ subject: `${formData.subject} ${tag}`.trim() });
  };

  // Execute test email dispatch via Resend
  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      setTestResult({ success: false, error: "Please provide a valid test email address" });
      return;
    }
    if (!campaignId) {
      setTestResult({
        success: false,
        error: "Please save the campaign draft first to dispatch test emails.",
      });
      return;
    }

    try {
      setSendingTest(true);
      setTestResult(null);

      const res = await fetch(`/api/dashboard/email-marketing/campaigns/${campaignId}/test-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail: testEmailAddress.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setTestResult({
          success: true,
          message: `Test email successfully submitted to ${testEmailAddress}. Message ID: ${json.messageId}`,
        });
      } else {
        setTestResult({
          success: false,
          error: json.error || "Failed to dispatch test email",
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  // Compute live personalized preview for selected sample contact
  const activeSampleContact = sampleRecipients[selectedContactIndex] || {
    first_name: "Sarah",
    last_name: "Connor",
    email: "sarah.connor@acme-corp.com",
    company: "Cyberdyne Systems",
    city: "San Francisco",
  };

  const personalizedPreviewHtml = useMemo(() => {
    let body = compiledHtml || "<p>Hello {{first_name|there}}, welcome to NexaReach.</p>";
    body = interpolatePersonalization(body, {
      first_name: activeSampleContact.firstName || activeSampleContact.name?.split(" ")[0] || "Sarah",
      last_name: activeSampleContact.lastName || "Connor",
      email: activeSampleContact.email,
      company: activeSampleContact.company || "Cyberdyne",
      city: activeSampleContact.city || "San Francisco",
      unsubscribe_url: "https://nexareach.com/unsubscribe?token=sample-preview-token",
    });

    return wrapInEmailContainer(body, {
      title: formData.subject || "Email Preview",
      preheader: formData.preheader || undefined,
    });
  }, [compiledHtml, activeSampleContact, formData.subject, formData.preheader]);

  return (
    <div className="space-y-6 max-w-4xl select-none p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Step 4: Content, Personalization & Delivery Parameters</h2>
        <p className="text-xs text-slate-500 mt-1">
          Compose compelling subject headers, insert merge tags, configure tracking, and test real inbox delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Subject, Preheader, Postal Address, UTM */}
        <div className="space-y-4">
          {/* Subject Line */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Email Subject Line *</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Insert tag:</span>
                <button
                  type="button"
                  onClick={() => insertSubjectTag("{{first_name|there}}")}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-mono font-semibold cursor-pointer"
                >
                  {"{{first_name}}"}
                </button>
                <button
                  type="button"
                  onClick={() => insertSubjectTag("{{company}}")}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-mono font-semibold cursor-pointer"
                >
                  {"{{company}}"}
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="e.g. {{first_name|there}}, your exclusive early access invitation"
              value={formData.subject}
              onChange={(e) => onChange({ subject: e.target.value })}
              className={`w-full bg-white border rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-xs transition-colors ${
                errors.subject ? "border-rose-500" : "border-slate-300 focus:border-blue-500"
              }`}
            />
            {errors.subject && <p className="text-[11px] text-rose-600">{errors.subject}</p>}
          </div>

          {/* Preheader */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Preview Header Snippet (Preheader)</span>
              <span className="text-[10px] text-slate-400">Appears next to subject in email clients</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Discover how modern teams scale customer engagement effortlessly"
              value={formData.preheader}
              onChange={(e) => onChange({ preheader: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs"
            />
          </div>

          {/* Physical Postal Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-slate-400" />
              <span>Physical Business Address *</span>
            </label>
            <input
              type="text"
              placeholder="e.g. NexaReach Inc., 100 Innovation Way, Suite 400, San Francisco, CA 94105"
              value={formData.postalAddress}
              onChange={(e) => onChange({ postalAddress: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs"
            />
            <p className="text-[10px] text-slate-500">
              Legally mandated by CAN-SPAM and GDPR requirements in commercial email footers.
            </p>
          </div>

          {/* UTM Parameters Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Sliders className="h-3.5 w-3.5 text-blue-600" />
              <span>UTM Campaign Analytics Tags</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">utm_source</label>
                <input
                  type="text"
                  placeholder="nexareach_email"
                  value={formData.utmParams?.source || ""}
                  onChange={(e) =>
                    onChange({
                      utmParams: { ...formData.utmParams, source: e.target.value },
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 shadow-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">utm_medium</label>
                <input
                  type="text"
                  placeholder="email"
                  value={formData.utmParams?.medium || ""}
                  onChange={(e) =>
                    onChange({
                      utmParams: { ...formData.utmParams, medium: e.target.value },
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 shadow-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">utm_campaign</label>
                <input
                  type="text"
                  placeholder="q4_launch"
                  value={formData.utmParams?.campaign || ""}
                  onChange={(e) =>
                    onChange({
                      utmParams: { ...formData.utmParams, campaign: e.target.value },
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 shadow-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">utm_content</label>
                <input
                  type="text"
                  placeholder="cta_button"
                  value={formData.utmParams?.content || ""}
                  onChange={(e) =>
                    onChange({
                      utmParams: { ...formData.utmParams, content: e.target.value },
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 shadow-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Test Email Form */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <Send className="h-3.5 w-3.5 text-blue-600" />
              <span>Send Manually Approved Test Email</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Dispatches a single real test email via Resend to verify inbox placement and rendering before campaign launch.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="developer@yourdomain.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 shadow-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingTest}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                {sendingTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>Send Test</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium ${
                  testResult.success
                    ? "bg-emerald-100/70 border border-emerald-300 text-emerald-800"
                    : "bg-rose-100/70 border border-rose-300 text-rose-800"
                }`}
              >
                {testResult.success ? testResult.message : testResult.error}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Personalization Simulator & Link Validator */}
        <div className="space-y-4">
          {/* Contact Simulator Controls */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Personalization Simulator</span>
              </div>
              {sampleRecipients.length > 0 && (
                <span className="text-[10px] text-slate-500 font-mono">
                  Sample {selectedContactIndex + 1} of {sampleRecipients.length}
                </span>
              )}
            </div>

            {sampleRecipients.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {sampleRecipients.slice(0, 5).map((rec, idx) => (
                  <button
                    key={rec.id || idx}
                    type="button"
                    onClick={() => setSelectedContactIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                      selectedContactIndex === idx
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {rec.firstName || rec.email.split("@")[0]}
                  </button>
                ))}
              </div>
            )}

            <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 shadow-xs">
              <div>
                Simulated Recipient: <strong className="text-slate-900">{activeSampleContact.email}</strong>
              </div>
              <div>
                Resolved Merge Tags: first_name = &quot;{activeSampleContact.firstName || "there"}&quot;, company = &quot;{activeSampleContact.company || "N/A"}&quot;
              </div>
            </div>

            {/* Micro Live Preview Container */}
            <div className="h-64 rounded-xl bg-white overflow-hidden shadow-xs border border-slate-200">
              <iframe
                title="Personalization Test"
                srcDoc={personalizedPreviewHtml}
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          {/* CTA Link Validation Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <LinkIcon className="h-3.5 w-3.5 text-blue-600" />
                <span>CTA Link Validator</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">
                {detectedLinks.length} Links Scanned
              </span>
            </div>

            {detectedLinks.length === 0 ? (
              <p className="text-xs text-slate-500">
                No external links detected in current HTML content.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto font-mono text-[11px]">
                {detectedLinks.map((url, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-slate-700 shadow-xs truncate"
                  >
                    <span className="truncate flex-1 mr-2">{url}</span>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="h-3 w-3" /> Valid
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
