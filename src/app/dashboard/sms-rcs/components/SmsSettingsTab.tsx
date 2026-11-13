"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Sliders,
  ShieldCheck,
  Building,
  Key,
  Smartphone,
  Sparkles,
  AlertTriangle,
  Lock,
  Globe,
  Radio,
  Save,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Clock,
  Layers,
  MessageSquare,
  Palette,
  ExternalLink,
  Info,
  Send,
  AlertCircle,
  X,
  Wallet,
  Loader2,
  User,
} from "lucide-react";
import type { SmsSettingsData } from "@/lib/sms/validation";
import { validatePreferredSenderId, isValidIanaTimezone } from "@/lib/sms/validation";

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function SmsSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initial loaded settings to check dirty state
  const [initialSettings, setInitialSettings] = useState<SmsSettingsData | null>(null);

  // Form Fields
  const [defaultSenderId, setDefaultSenderId] = useState("NEXAREACH");
  const [defaultChannel, setDefaultChannel] = useState<"SMS" | "RCS">("SMS");
  const [timezone, setTimezone] = useState("UTC");
  const [enforceStopOptOut, setEnforceStopOptOut] = useState(true);
  const [encodingPreference, setEncodingPreference] = useState<"AUTO" | "GSM-7" | "UCS-2">("AUTO");
  const [rcsBrandName, setRcsBrandName] = useState("NexaReach Marketing OS");
  const [rcsBrandColor, setRcsBrandColor] = useState("#2563EB");

  // Field-level validation errors
  const [senderIdError, setSenderIdError] = useState<string | null>(null);
  const [timezoneError, setTimezoneError] = useState<string | null>(null);

  // Fast2SMS Provider Status State
  const [providerConfig, setProviderConfig] = useState<{
    isConfigured: boolean;
    status: string;
    rcsStatus: string;
    walletBalance?: number;
    currency?: string;
  } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    message: string;
    walletBalance?: number;
  } | null>(null);

  // Single Test SMS Modal State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    "Hello from NexaReach Marketing OS! This is a single-recipient delivery verification test."
  );
  const [testRoute, setTestRoute] = useState<"q" | "dlt">("q");
  const [testSenderId, setTestSenderId] = useState("");
  const [testDltTemplateId, setTestDltTemplateId] = useState("");
  const [testConsentAgreed, setTestConsentAgreed] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSendResult, setTestSendResult] = useState<{
    success: boolean;
    status?: string;
    requestId?: string;
    error?: string;
    disclaimer?: string;
  } | null>(null);

  // Contacts for quick recipient selection in test modal
  const [contacts, setContacts] = useState<Array<{
    id: string;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    smsConsent?: string;
    email?: string;
  }>>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const fetchContacts = useCallback(async () => {
    if (contacts.length > 0) return;
    setIsLoadingContacts(true);
    try {
      const res = await fetch("/api/dashboard/contacts?limit=100");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.contacts)) {
          setContacts(data.contacts);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingContacts(false);
    }
  }, [contacts.length]);

  // Dynamic IANA Timezones list
  const timezoneList = useMemo(() => {
    try {
      if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
        return (Intl as any).supportedValuesOf("timeZone") as string[];
      }
    } catch {
      // fallback
    }
    return COMMON_TIMEZONES;
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/sms-rcs/settings");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load workspace SMS & RCS settings");
      }

      const s: SmsSettingsData = data.settings;
      setInitialSettings(s);
      setDefaultSenderId(s.defaultSenderId);
      setDefaultChannel(s.defaultChannel);
      setTimezone(s.timezone);
      setEnforceStopOptOut(s.enforceStopOptOut);
      setEncodingPreference(s.encodingPreference);
      setRcsBrandName(s.rcsBrandName);
      setRcsBrandColor(s.rcsBrandColor);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while loading settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProviderStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/sms-rcs/settings/provider");
      const data = await res.json();
      if (res.ok && data.success) {
        setProviderConfig({
          isConfigured: data.isConfigured,
          status: data.status,
          rcsStatus: data.rcsStatus,
        });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchProviderStatus();
  }, [fetchSettings, fetchProviderStatus]);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    try {
      const res = await fetch("/api/dashboard/sms-rcs/settings/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_connection" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConnectionTestResult({
          success: true,
          message: `Connected successfully! Current Fast2SMS balance: ₹${
            typeof data.walletBalance === "number" ? data.walletBalance.toFixed(2) : "0.00"
          }`,
          walletBalance: data.walletBalance,
        });
        setProviderConfig((prev) =>
          prev
            ? { ...prev, walletBalance: data.walletBalance, currency: "INR" }
            : { isConfigured: true, status: "CONFIGURED", rcsStatus: "NOT_CONNECTED", walletBalance: data.walletBalance, currency: "INR" }
        );
      } else {
        setConnectionTestResult({
          success: false,
          message: data.error || "Connection test failed",
        });
      }
    } catch (err: any) {
      setConnectionTestResult({
        success: false,
        message: err.message || "Network error while connecting to Fast2SMS",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleExecuteSingleTest = async () => {
    if (!testPhone || !testPhone.trim()) return;
    if (!testConsentAgreed) return;
    setIsSendingTest(true);
    setTestSendResult(null);
    try {
      const res = await fetch("/api/dashboard/sms-rcs/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone.trim(),
          messageText: testMessage.trim(),
          route: testRoute,
          senderId: testRoute === "dlt" ? testSenderId.trim() : undefined,
          dltTemplateId: testRoute === "dlt" ? testDltTemplateId.trim() : undefined,
          confirmLiveSend: true,
          attestedConsent: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestSendResult({
          success: true,
          status: data.status,
          requestId: data.requestId,
          disclaimer: data.disclaimer,
        });
      } else {
        setTestSendResult({
          success: false,
          error: data.error || "Failed to dispatch test SMS",
        });
      }
    } catch (err: any) {
      setTestSendResult({
        success: false,
        error: err.message || "Network error during test dispatch",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Handle sender ID change with validation
  const handleSenderIdChange = (val: string) => {
    setDefaultSenderId(val);
    const check = validatePreferredSenderId(val);
    if (!check.valid) {
      setSenderIdError(check.error || "Invalid sender ID");
    } else {
      setSenderIdError(null);
    }
  };

  // Handle timezone change
  const handleTimezoneChange = (val: string) => {
    setTimezone(val);
    if (!isValidIanaTimezone(val)) {
      setTimezoneError("Invalid IANA timezone identifier");
    } else {
      setTimezoneError(null);
    }
  };

  // Reset to initial settings
  const handleReset = () => {
    if (!initialSettings) return;
    setDefaultSenderId(initialSettings.defaultSenderId);
    setDefaultChannel(initialSettings.defaultChannel);
    setTimezone(initialSettings.timezone);
    setEnforceStopOptOut(initialSettings.enforceStopOptOut);
    setEncodingPreference(initialSettings.encodingPreference);
    setRcsBrandName(initialSettings.rcsBrandName);
    setRcsBrandColor(initialSettings.rcsBrandColor);
    setSenderIdError(null);
    setTimezoneError(null);
    setError(null);
    setSuccessMessage(null);
  };

  // Check if form is dirty
  const isDirty = useMemo(() => {
    if (!initialSettings) return false;
    return (
      defaultSenderId !== initialSettings.defaultSenderId ||
      defaultChannel !== initialSettings.defaultChannel ||
      timezone !== initialSettings.timezone ||
      enforceStopOptOut !== initialSettings.enforceStopOptOut ||
      encodingPreference !== initialSettings.encodingPreference ||
      rcsBrandName !== initialSettings.rcsBrandName ||
      rcsBrandColor !== initialSettings.rcsBrandColor
    );
  }, [
    initialSettings,
    defaultSenderId,
    defaultChannel,
    timezone,
    enforceStopOptOut,
    encodingPreference,
    rcsBrandName,
    rcsBrandColor,
  ]);

  // Save Settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    // Validate inputs before submitting
    const senderCheck = validatePreferredSenderId(defaultSenderId);
    if (!senderCheck.valid) {
      setSenderIdError(senderCheck.error || "Invalid sender ID");
      return;
    }

    if (!isValidIanaTimezone(timezone)) {
      setTimezoneError("Invalid IANA timezone identifier");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/dashboard/sms-rcs/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultSenderId: senderCheck.normalized,
          defaultChannel,
          timezone: timezone.trim(),
          enforceStopOptOut,
          encodingPreference,
          rcsBrandName: rcsBrandName.trim(),
          rcsBrandColor: rcsBrandColor.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save settings");
      }

      setInitialSettings(data.settings);
      setDefaultSenderId(data.settings.defaultSenderId);
      setSuccessMessage("Workspace SMS & RCS preferences saved successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !initialSettings) {
    return (
      <div className="space-y-6 max-w-5xl animate-pulse">
        <div className="h-28 bg-slate-100 rounded-xl" />
        <div className="h-64 bg-slate-100 rounded-xl" />
        <div className="h-44 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
      {/* Alert Notices */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 flex items-start gap-3 text-red-800 text-xs">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to save preferences</p>
            <p className="mt-0.5 text-red-700">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Settings Updated</p>
            <p className="mt-0.5 text-emerald-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Compliance Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Workspace Configuration & Regulatory Scope
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Saving preferences here configures your internal workspace composition defaults. Setting a preferred sender ID or brand profile does <strong>not</strong> register a 10DLC campaign, approve carrier DLT headers, or establish regulatory telecommunications clearance.
            </p>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 shrink-0 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 self-start sm:self-center">
          Workspace Scoped
        </div>
      </div>

      {/* SECTION 1: General & Composition Preferences */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              General & Composition Preferences
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set default handles, timezone formatting, and character encoding policies for campaign creation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Default Messaging Channel */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default Messaging Protocol
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDefaultChannel("SMS")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  defaultChannel === "SMS"
                    ? "bg-blue-50 border-blue-300 text-blue-700 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Radio className="h-3.5 w-3.5" />
                <span>SMS (Standard)</span>
              </button>
              <button
                type="button"
                onClick={() => setDefaultChannel("RCS")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  defaultChannel === "RCS"
                    ? "bg-purple-50 border-purple-300 text-purple-700 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>RCS (Rich Cards)</span>
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Default active channel when opening a new campaign composition.
            </span>
          </div>

          {/* Preferred Sender ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Preferred Sender ID / Handle
            </label>
            <input
              type="text"
              maxLength={20}
              value={defaultSenderId}
              onChange={(e) => handleSenderIdChange(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-lg border font-mono tracking-wide focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all ${
                senderIdError
                  ? "border-red-300 bg-red-50/50 text-red-900"
                  : "border-slate-200 bg-white text-slate-800 focus:border-blue-500"
              }`}
              placeholder="e.g. NEXAREACH or +15551234567"
            />
            {senderIdError ? (
              <span className="text-[10px] text-red-600 mt-1 block font-medium">
                {senderIdError}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 mt-1 block">
                Preferred alphanumeric handle (1-11 chars) or numeric short code. Not carrier approved.
              </span>
            )}
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Workspace Broadcast Timezone
            </label>
            <div className="relative">
              <select
                value={timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                  timezoneError ? "border-red-300" : "border-slate-200 focus:border-blue-500"
                }`}
              >
                {timezoneList.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Used for scheduling delivery windows and quiet-hours compliance.
            </span>
          </div>

          {/* Encoding Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Character Encoding Preference
            </label>
            <select
              value={encodingPreference}
              onChange={(e) =>
                setEncodingPreference(e.target.value as "AUTO" | "GSM-7" | "UCS-2")
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="AUTO">AUTO (Recommended • Auto-detect GSM-7 or UCS-2)</option>
              <option value="GSM-7">GSM-7 (Standard 160 char/segment • No emojis)</option>
              <option value="UCS-2">UCS-2 (Unicode 70 char/segment • Supports emojis)</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              AUTO automatically calculates optimal segment boundaries based on message content.
            </span>
          </div>
        </div>

        {/* STOP Opt-Out Toggle */}
        <div className="pt-3 border-t border-slate-100">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={enforceStopOptOut}
              onChange={(e) => setEnforceStopOptOut(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800">
                Enforce Regulatory STOP Opt-Out Notice in Drafts
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Automatically appends or reminds during composition to include <code>Reply STOP to opt out</code>.
                <span className="text-slate-400 block mt-0.5">
                  (Note: Automated carrier inbound STOP processing and suppression list sync will activate upon provider webhook connection.)
                </span>
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* SECTION 2: RCS Business Messaging (RBM) Agent Profile */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              RCS Business Messaging (RBM) Brand Identity
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified business profile details displayed in native Android Messages and iOS 18+ RCS threads.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Brand Display Name
            </label>
            <input
              type="text"
              maxLength={120}
              value={rcsBrandName}
              onChange={(e) => setRcsBrandName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. NexaReach Marketing OS"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Business name displayed on recipient lock screens and conversation headers.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Brand Accent Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={rcsBrandColor}
                onChange={(e) => setRcsBrandColor(e.target.value)}
                className="h-8 w-12 rounded border border-slate-200 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={rcsBrandColor}
                onChange={(e) => setRcsBrandColor(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="#2563EB"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Hex color used for verified tick badges, CTA action buttons, and card borders.
            </span>
          </div>
        </div>

        {/* Live Visual Preview Card */}
        <div className="mt-2 p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0"
              style={{ backgroundColor: rcsBrandColor || "#2563EB" }}
            >
              {rcsBrandName.charAt(0) || "N"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">
                  {rcsBrandName || "Brand Name"}
                </span>
                <span
                  className="h-3.5 w-3.5 rounded-full flex items-center justify-center text-white text-[9px]"
                  style={{ backgroundColor: rcsBrandColor || "#2563EB" }}
                >
                  ✓
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                Verified RCS Business Agent • Live Handset Preview
              </span>
            </div>
          </div>

          <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
            {rcsBrandColor}
          </span>
        </div>
      </div>

      {/* SECTION 3: Carrier Provider Gateway Status (Fast2SMS Connected, RCS Disconnected) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Radio className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Fast2SMS Telephony Gateway
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upstream telecommunications carrier connection for transactional & promotional messaging.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {providerConfig?.isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Fast2SMS Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Provider Key Missing
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              RCS API Disconnected
            </span>
          </div>
        </div>

        {/* Carrier Details & Balance Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-medium text-slate-700">Service Coverage</span>
              <span className="text-[11px] bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded">India (+91)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Supports 10-digit Indian mobile numbers. Automatic E.164 country verification is enforced.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-medium text-slate-700">RCS Protocol Status</span>
              <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">Draft Only</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Fast2SMS does not expose a public outbound REST API for RCS. Outbound RCS remains disabled.
            </p>
          </div>
        </div>

        {/* Connection Test & Status Bar */}
        <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-900">
                Wallet Balance:{" "}
                {typeof providerConfig?.walletBalance === "number"
                  ? `₹${providerConfig.walletBalance.toFixed(2)}`
                  : "Click 'Test Connection' to check"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Zero-cost verification. Tests API key authorization and credit balance without sending messages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`h-3 w-3 ${isTestingConnection ? "animate-spin" : ""}`} />
              <span>{isTestingConnection ? "Testing..." : "Test Connection"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsTestModalOpen(true);
                setTestSendResult(null);
                fetchContacts();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Send className="h-3 w-3" />
              <span>Send Single Test SMS</span>
            </button>
          </div>
        </div>

        {connectionTestResult && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              connectionTestResult.success
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {connectionTestResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{connectionTestResult.message}</span>
          </div>
        )}
      </div>

      {/* SINGLE RECIPIENT TEST SMS MODAL */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Send Single Test SMS (Fast2SMS)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Live single-recipient dispatch. Requires explicit opt-in confirmation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Warning Banner */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold">Billable Live Dispatch Safeguard</span>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  This will dispatch 1 real SMS message through your Fast2SMS account and debit credits. Bulk sending is disabled. The recipient must be an Indian mobile number (+91).
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Quick Contact Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700">
                    Select from Contacts <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  {isLoadingContacts && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" /> Loading contacts...
                    </span>
                  )}
                </div>
                <select
                  value={selectedContactId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedContactId(id);
                    const found = contacts.find((c) => c.id === id);
                    if (found) {
                      if (found.phone) {
                        setTestPhone(found.phone);
                      }
                      if (found.smsConsent === "OPTED_IN") {
                        setTestConsentAgreed(true);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800"
                >
                  <option value="">-- Choose from Contacts or enter manually below --</option>
                  {contacts
                    .filter((c) => !!c.phone)
                    .map((c) => {
                      const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.name || c.email;
                      const consent = c.smsConsent === "OPTED_IN" ? "✅ Opted-In" : c.smsConsent === "OPTED_OUT" ? "🛑 Opt-Out" : "⏳ Pending";
                      return (
                        <option key={c.id} value={c.id}>
                          {name} ({c.phone}) - {consent}
                        </option>
                      );
                    })}
                </select>
                {selectedContactId && (() => {
                  const c = contacts.find((item) => item.id === selectedContactId);
                  if (!c) return null;
                  return (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <User className="h-3 w-3 text-blue-600" />
                          <span>{[c.firstName, c.lastName].filter(Boolean).join(" ") || c.name || "Contact"}</span>
                        </div>
                        <span className="text-slate-500 text-[10px] block">{c.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.smsConsent === "OPTED_IN" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            SMS Opted-In
                          </span>
                        ) : c.smsConsent === "OPTED_OUT" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            Opted-Out (STOP)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Consent Pending
                          </span>
                        )}
                        <Link
                          href={`/dashboard/contacts/${c.id}`}
                          target="_blank"
                          className="text-slate-400 hover:text-blue-600 p-0.5"
                          title="View Contact Profile"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Recipient Indian Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="+91 9876543210 or 9876543210"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Must be a valid 10-digit Indian mobile number (+91).
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Fast2SMS Route <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTestRoute("q")}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                      testRoute === "q"
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 font-semibold"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="font-medium text-xs">Quick SMS (route=q)</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">Development / Quick Testing</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestRoute("dlt")}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                      testRoute === "dlt"
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 font-semibold"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="font-medium text-xs">DLT Route (route=dlt)</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">Pre-registered TRAI Template</div>
                  </button>
                </div>
              </div>

              {testRoute === "dlt" && (
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      DLT Sender ID (Header)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FSTSMS"
                      value={testSenderId}
                      onChange={(e) => setTestSenderId(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      DLT Template ID (Message)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 111111"
                      value={testDltTemplateId}
                      onChange={(e) => setTestDltTemplateId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Message Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
                />
              </div>

              {/* Mandatory Consent Attestation */}
              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={testConsentAgreed}
                  onChange={(e) => setTestConsentAgreed(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <span className="text-[11px] text-slate-700 leading-relaxed">
                  I confirm that the recipient has explicitly opted in to receive SMS communications from this workspace, and that this number is not on any active suppression list.
                </span>
              </label>
            </div>

            {testSendResult && (
              <div
                className={`p-3.5 rounded-xl text-xs space-y-1 ${
                  testSendResult.success
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "bg-red-50 text-red-900 border border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {testSendResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  )}
                  <span>
                    {testSendResult.success
                      ? `Submitted to Fast2SMS Gateway (Status: ${testSendResult.status})`
                      : "Dispatch Failed"}
                  </span>
                </div>
                {testSendResult.requestId && (
                  <div className="text-[11px] font-mono text-emerald-800">
                    Provider Request ID: {testSendResult.requestId}
                  </div>
                )}
                {testSendResult.disclaimer && (
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {testSendResult.disclaimer}
                  </p>
                )}
                {testSendResult.error && (
                  <p className="text-[11px] text-red-700 mt-0.5">
                    {testSendResult.error}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTestModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteSingleTest}
                disabled={
                  isSendingTest ||
                  !testPhone.trim() ||
                  !testMessage.trim() ||
                  !testConsentAgreed ||
                  (testRoute === "dlt" && (!testSenderId.trim() || !testDltTemplateId.trim()))
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Authorize & Send 1 Test SMS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Inbound & Delivery Receipts Webhook */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Carrier Inbound & DLR Webhooks
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Receives carrier delivery status receipts (DLR) and inbound STOP responses.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">
              Webhook Endpoint Will Activate After Provider Integration
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Once an upstream carrier (such as Twilio or Sinch) is linked in Step 3, a dedicated workspace webhook URL with signature verification will be generated here to ingest real-time handset delivery receipts and opt-out events.
            </p>
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between gap-4 sticky bottom-4">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          {isDirty ? (
            <span className="text-amber-600 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
              All changes saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || saving}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-3.5 w-3.5 inline mr-1 text-slate-400" />
            <span>Reset</span>
          </button>

          <button
            type="submit"
            disabled={!isDirty || saving || Boolean(senderIdError) || Boolean(timezoneError)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className={`h-3.5 w-3.5 ${saving ? "animate-spin" : ""}`} />
            <span>{saving ? "Saving..." : "Save Preferences"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
