"use client";

import React, { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  PhoneCall,
  Volume2,
  Radio,
  Lock,
  RotateCw,
  Info,
} from "lucide-react";

export function VoiceSettingsTab() {
  const [settings, setSettings] = useState<any>({
    defaultLanguage: "en-US",
    defaultVoice: "alloy",
    defaultSpeed: 1.0,
    timezone: "UTC",
    callingWindowStart: "09:00",
    callingWindowEnd: "20:00",
    callingDays: "MON_FRI",
    quietHoursEnabled: true,
    maxRetryAttempts: 3,
    retryIntervalMinutes: 30,
    enforceConsent: true,
    enforceSuppression: true,
    requireOptInProof: true,
    providerStatus: "NOT_CONNECTED",
    providerName: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/dashboard/voice-campaigns/settings");
        const data = await res.json();
        if (res.ok && data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/dashboard/voice-campaigns/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save settings");
      }
      setSettings(data.settings);
      showToast("success", "Voice settings updated successfully.");
    } catch (err: any) {
      showToast("error", err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
        Loading voice settings...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      {/* Toast */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-700 font-bold ml-4">
            ×
          </button>
        </div>
      )}

      {/* 1. GENERAL VOICE SYNTHESIS PREFERENCES */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Volume2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">General Voice Studio Defaults</h2>
            <p className="text-xs text-slate-500">Default speech parameters pre-populated when creating new campaigns.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Language / Accent</label>
            <select
              value={settings.defaultLanguage}
              onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Voice Timbre</label>
            <select
              value={settings.defaultVoice}
              onChange={(e) => setSettings({ ...settings, defaultVoice: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 capitalize"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default Speaking Speed ({settings.defaultSpeed}x)
            </label>
            <input
              type="range"
              min="0.75"
              max="1.4"
              step="0.05"
              value={settings.defaultSpeed}
              onChange={(e) => setSettings({ ...settings, defaultSpeed: parseFloat(e.target.value) })}
              className="w-full mt-2 accent-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Workspace Timezone</label>
            <input
              type="text"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 font-mono"
            />
          </div>
        </div>
      </div>

      {/* 2. CALLING PREFERENCES & QUIET HOURS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Calling Window & Retry Policies</h2>
            <p className="text-xs text-slate-500">Configure permissible calling hours and retry attempts for call jobs.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Allowed Window Start (Local Time)</label>
            <input
              type="time"
              value={settings.callingWindowStart}
              onChange={(e) => setSettings({ ...settings, callingWindowStart: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Allowed Window End (Local Time)</label>
            <input
              type="time"
              value={settings.callingWindowEnd}
              onChange={(e) => setSettings({ ...settings, callingWindowEnd: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Allowed Calling Days</label>
            <select
              value={settings.callingDays}
              onChange={(e) => setSettings({ ...settings, callingDays: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
            >
              <option value="MON_FRI">Monday to Friday (Business Days Only)</option>
              <option value="MON_SAT">Monday to Saturday</option>
              <option value="ALL_WEEK">All 7 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Maximum Retry Attempts</label>
            <input
              type="number"
              min="0"
              max="5"
              value={settings.maxRetryAttempts}
              onChange={(e) => setSettings({ ...settings, maxRetryAttempts: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
            <input
              type="checkbox"
              checked={settings.quietHoursEnabled}
              onChange={(e) => setSettings({ ...settings, quietHoursEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">Enforce Quiet Hours (Block calls outside allowed window automatically)</span>
          </label>
        </div>
      </div>

      {/* 3. COMPLIANCE & CONSENT SETTINGS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Regulatory Compliance & Consent Enforcement</h2>
            <p className="text-xs text-slate-500">Legal requirements governing automated calls and consumer protections.</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.enforceConsent}
              onChange={(e) => setSettings({ ...settings, enforceConsent: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">
              Strict Voice Consent Verification (Reject contacts without express OPTED_IN voice status)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.enforceSuppression}
              onChange={(e) => setSettings({ ...settings, enforceSuppression: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">
              Auto-exclude Active Suppression Records (Channel &ldquo;VOICE&rdquo; or &ldquo;ALL&rdquo;)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.requireOptInProof}
              onChange={(e) => setSettings({ ...settings, requireOptInProof: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium">
              Require Verifiable Opt-In Source (Import / Web Form / IVR verification timestamps)
            </span>
          </label>
        </div>
      </div>

      {/* 4. FUTURE PROVIDER INTEGRATION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">External Voice Telephony Provider</h2>
            <p className="text-xs text-slate-500">Outbound carrier connection status and carrier credentials.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Connection Status:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Not Connected
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Integration Status:</span>
            <span className="font-semibold text-blue-600">Ready for Provider Integration</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Provider Engine:</span>
            <span className="font-mono text-slate-800">Internal Safe Mode (Outbound Disabled)</span>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            <div className="flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                External telephony provider integration (Twilio / Vonage / Plivo / Telnyx) will be configured in a subsequent phase. All account credentials will remain strictly server-side in your hosting secret manager. No real phone calls will be placed until explicit provider authorization is established.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? "Saving Settings..." : "Save Voice Settings"}</span>
        </button>
      </div>
    </form>
  );
}
