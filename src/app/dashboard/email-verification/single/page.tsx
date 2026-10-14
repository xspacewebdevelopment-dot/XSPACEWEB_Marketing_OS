"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Send,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  Server,
  Zap,
  Trash2,
  UserPlus,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import {
  NormalizedVerificationDetails,
  ProviderCreditBalance,
  VerificationDepth,
} from "@/lib/reoon/types";

export default function SingleVerifyPage() {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<VerificationDepth>("POWER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NormalizedVerificationDetails | null>(null);
  const [copied, setCopied] = useState(false);

  // Credit balance state
  const [credits, setCredits] = useState<ProviderCreditBalance | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  // Recent verifications state
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [totalRecent, setTotalRecent] = useState(0);
  const [recentPage, setRecentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Contacts integration state
  const [contactLookup, setContactLookup] = useState<{ exists: boolean; contact?: any } | null>(null);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactFirstName, setNewContactFirstName] = useState("");
  const [newContactLastName, setNewContactLastName] = useState("");
  const [newContactCompany, setNewContactCompany] = useState("");
  const [newContactListId, setNewContactListId] = useState("");
  const [newContactTags, setNewContactTags] = useState("");
  const [availableLists, setAvailableLists] = useState<any[]>([]);
  const [savingContact, setSavingContact] = useState(false);
  const [contactSaveError, setContactSaveError] = useState<string | null>(null);

  const fetchCredits = useCallback(async (refresh = false) => {
    try {
      setLoadingCredits(true);
      const res = await fetch(
        `/api/dashboard/email-verification/credits${refresh ? "?refresh=true" : ""}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCredits(json.data);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingCredits(false);
    }
  }, []);

  const fetchRecent = useCallback(
    async (page = 1, search = "") => {
      try {
        setLoadingRecent(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: "6",
        });
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(
          `/api/dashboard/email-verification/single/recent?${params.toString()}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setRecentItems(json.data.items || []);
            setTotalRecent(json.data.pagination?.total || 0);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoadingRecent(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCredits();
    fetchRecent(1, "");
  }, [fetchCredits, fetchRecent]);

  // Lookup contact existence when result changes
  useEffect(() => {
    if (result?.email) {
      fetch(`/api/dashboard/contacts/lookup?email=${encodeURIComponent(result.email)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setContactLookup({ exists: d.exists, contact: d.contact });
          }
        })
        .catch(console.error);

      fetch("/api/dashboard/lists")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.lists) setAvailableLists(d.lists);
        })
        .catch(console.error);
    } else {
      setContactLookup(null);
    }
  }, [result]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;
    setSavingContact(true);
    setContactSaveError(null);

    const tags = newContactTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/dashboard/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: result.email,
          firstName: newContactFirstName.trim() || undefined,
          lastName: newContactLastName.trim() || undefined,
          company: newContactCompany.trim() || undefined,
          tags,
          listIds: newContactListId ? [newContactListId] : [],
          verificationStatus: result.status,
          subscriptionStatus: "PENDING", // Never assume consent
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add contact");
      }

      setContactLookup({ exists: true, contact: data.contact });
      setShowAddContactModal(false);
      setNewContactFirstName("");
      setNewContactLastName("");
      setNewContactCompany("");
      setNewContactTags("");
    } catch (err: any) {
      setContactSaveError(err.message || "Failed to create contact");
    } finally {
      setSavingContact(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;

    const trimmed = email.trim();
    setError(null);

    if (!trimmed) {
      setError("Please enter an email address to verify.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(trimmed)) {
      setError("Please provide a valid email format (e.g. name@domain.com).");
      return;
    }

    if (credits && credits.status === "insufficient") {
      setError("Account has 0 remaining credits. Please replenish credits before continuing.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/dashboard/email-verification/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, mode }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Server returned unexpected response (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setResult(data.data);
      // Refresh credits and recent list in background
      fetchCredits(true);
      fetchRecent(1, searchQuery);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to execute email verification");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!result) return;
    const summary = [
      `NexaReach Single Verification Summary`,
      `Email: ${result.email}`,
      `Status: ${result.status}`,
      `Mode: ${result.verificationMode}`,
      `Provider Score: ${result.overallScore !== null ? `${result.overallScore}/100` : "N/A"}`,
      `Provider Status: ${result.providerStatus}`,
      `Deliverable: ${result.isDeliverable === null ? "Not checked (Quick mode)" : result.isDeliverable ? "Yes" : "No"}`,
      `SMTP Connected: ${result.canConnectSmtp === null ? "Not checked (Quick mode)" : result.canConnectSmtp ? "Yes" : "No"}`,
      `Disposable: ${result.isDisposable ? "Yes" : "No"}`,
      `Role-based: ${result.isRoleBased ? "Yes" : "No"}`,
      `Catch-all: ${result.isCatchAll ? "Yes" : "No"}`,
      `Spam Trap: ${result.isSpamtrap ? "Yes" : "No"}`,
      `Mailbox Full: ${result.hasInboxFull ? "Yes" : "No"}`,
      `Mailbox Disabled: ${result.isDisabled ? "Yes" : "No"}`,
      `Verified At: ${new Date(result.verifiedAt).toLocaleString()}`,
      `Notice: Verification does not guarantee delivery or inbox placement.`,
    ].join("\n");

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setEmail("");
    setResult(null);
    setError(null);
  };

  const handleDelete = async (id: string, emailToDelete: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the verification record for "${emailToDelete}"?`
      )
    ) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/dashboard/email-verification/results/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete verification record");
      }
      setRecentItems((prev) => prev.filter((item) => item.id !== id));
      setTotalRecent((prev) => Math.max(0, prev - 1));
      setDeleteNotice(`Record for ${emailToDelete} removed from database.`);
      setTimeout(() => setDeleteNotice(null), 3500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete verification record");
    } finally {
      setDeletingId(null);
    }
  };

  const statusConfig = {
    VALID: {
      label: "Valid Mailbox",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cardClass: "border-emerald-200 bg-emerald-50/20",
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      description: "Mailbox confirmed active and deliverable via deep SMTP handshake.",
    },
    INVALID: {
      label: "Invalid Mailbox",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      cardClass: "border-rose-200 bg-rose-50/20",
      icon: XCircle,
      iconColor: "text-rose-600",
      description: "Target address does not exist or has been disabled. Guaranteed hard bounce.",
    },
    RISKY: {
      label: "Risky Address",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      cardClass: "border-amber-200 bg-amber-50/20",
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      description: "Address carries deliverability or reputation risk (disposable, full inbox, catch-all, or spam trap).",
    },
    UNKNOWN: {
      label: "Unknown / Indeterminate",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      cardClass: "border-slate-200 bg-slate-50/20",
      icon: HelpCircle,
      iconColor: "text-slate-600",
      description: "Target mail server connection timed out or did not return a definitive SMTP response.",
    },
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 select-none">
      {/* 1. Header Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/dashboard/email-verification"
              className="hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Email Verification
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Single Verification</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Single Email Verification
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              Provider: Reoon
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Reoon Engine
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time mailbox validation with syntax verification, domain MX resolution, and SMTP handshake.
          </p>
        </div>

        {/* Balance Status Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-center gap-2 text-xs">
            <Coins className="h-3.5 w-3.5 text-indigo-600" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Credits:</span>
              <span className="font-semibold text-slate-800">
                {credits
                  ? credits.totalCreditsRemaining !== null
                    ? `${credits.totalCreditsRemaining.toLocaleString()}`
                    : credits.message || "Unavailable"
                  : "Checking..."}
              </span>
              {credits && credits.dailyCreditsRemaining !== null && (
                <span className="text-[10px] text-slate-400">
                  ({credits.dailyCreditsRemaining} daily / {credits.instantCreditsRemaining} instant)
                </span>
              )}
            </div>
            <button
              onClick={() => fetchCredits(true)}
              disabled={loadingCredits}
              title="Refresh credit balance"
              className="ml-1 p-1 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loadingCredits ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>



      {/* 2. Main Verification Input Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Target Email Address</span>
              <span className="text-[11px] font-normal text-slate-400">
                Single address lookup
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-60"
              />
            </div>
          </div>

          {/* Verification Depth Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Verification Depth
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("POWER")}
                disabled={loading}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  mode === "POWER"
                    ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    mode === "POWER"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900">
                      Power Mode
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Deep SMTP handshake, individual mailbox validation, inbox-full & catch-all detection.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("QUICK")}
                disabled={loading}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  mode === "QUICK"
                    ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    mode === "QUICK"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Server className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900">
                      Quick Check
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      Syntax & MX Only
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Rapid domain & syntax inspection (&lt;0.5s). Does not verify individual mailbox existence.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Costs 1 verification credit on live API
            </span>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Connecting to Mail Server...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Verify Email Address</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Detailed Result Panel (Renders without page reload) */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {(() => {
            const currentStatus = statusConfig[result.status] || statusConfig.UNKNOWN;
            const StatusIcon = currentStatus.icon;

            return (
              <div
                className={`rounded-2xl border p-6 bg-white shadow-sm space-y-6 ${currentStatus.cardClass}`}
              >
                {/* Result Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl border bg-white shadow-2xs ${currentStatus.iconColor}`}
                    >
                      <StatusIcon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-slate-900">
                          {result.email}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentStatus.badgeClass}`}
                        >
                          {result.status}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          Mode: {result.verificationMode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {result.reason || currentStatus.description}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Verified at {new Date(result.verifiedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Provider Quality Score Gauge */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Deliverability Score
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      {result.overallScore !== null ? (
                        <>
                          {result.overallScore}
                          <span className="text-xs font-normal text-slate-400">
                            /100
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-slate-400">
                          Unavailable
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Quick mode notice or conflicting signals notice */}
                {result.notice && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>{result.notice}</span>
                  </div>
                )}

                {result.hasConflictingSignals && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      Flagged for review: Provider returned positive general status but reported negative deliverability flags.
                    </span>
                  </div>
                )}

                {result.contactUpdated && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      Matching contact record found in workspace and updated with genuine live verification status.
                    </span>
                  </div>
                )}

                {/* 4. Detailed Verification Checks Grid */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Detailed Signal Audit
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {/* Syntax Validity */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-500 font-medium">Syntax Validity</div>
                      <div className="mt-1 font-semibold text-xs flex items-center gap-1.5 text-slate-900">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Valid RFC 5322 Format</span>
                      </div>
                    </div>

                    {/* Domain & MX Records */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-500 font-medium">Domain & MX Records</div>
                      <div className="mt-1 font-semibold text-xs flex items-center gap-1.5 text-slate-900 truncate">
                        {result.mxAcceptsMail ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{result.domain || "Valid MX"}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                            <span>No MX Records</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* SMTP Handshake */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-500 font-medium">SMTP Server Handshake</div>
                      <div className="mt-1 font-semibold text-xs flex items-center gap-1.5">
                        {result.canConnectSmtp === null ? (
                          <span className="text-slate-400">Not checked (Quick mode)</span>
                        ) : result.canConnectSmtp ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-slate-900">Connected Successfully</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5 text-rose-600" />
                            <span className="text-rose-700">Connection Failed</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mailbox Deliverability */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-500 font-medium">Mailbox Deliverability</div>
                      <div className="mt-1 font-semibold text-xs flex items-center gap-1.5">
                        {result.isDeliverable === null ? (
                          <span className="text-slate-400">Not checked (Quick mode)</span>
                        ) : result.isDeliverable ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Confirmed Deliverable</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5 text-rose-600" />
                            <span className="text-rose-700">Not Deliverable</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Disposable Domain */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-500 font-medium">Disposable Email</div>
                      <div className="mt-1 font-semibold text-xs flex items-center gap-1.5">
                        {result.isDisposable ? (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-amber-700">Disposable Temporary Domain</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-slate-900">Legitimate Domain</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Role-Based Account */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-500 font-medium">Role-Based Account</div>
                      <div className="mt-1 font-semibold text-xs flex items-center gap-1.5">
                        {result.isRoleBased ? (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-amber-700">Role / Department (Shared)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-slate-900">Personal Individual Mailbox</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Catch-All Domain */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-500 font-medium">Catch-All Server</div>
                      <div className="mt-1 font-semibold text-xs flex items-center gap-1.5">
                        {result.isCatchAll ? (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-amber-700">Accepts All Incoming Mail</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-slate-900">Strict Mailbox Rejection</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Spam Trap Signal */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-500 font-medium">Spam Trap Signal</div>
                      <div className="mt-1 font-semibold text-xs flex items-center gap-1.5">
                        {result.isSpamtrap ? (
                          <>
                            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                            <span className="text-rose-700 font-bold">Spam Trap Detected</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-slate-900">Clean / No Hazard</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mailbox Storage Status */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-500 font-medium">Storage Quota</div>
                      <div className="mt-1 font-semibold text-xs flex items-center gap-1.5">
                        {result.hasInboxFull ? (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-amber-700">Inbox Storage Full</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-slate-900">Storage Available</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mailbox Administrative Status */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-500 font-medium">Account Status</div>
                      <div className="mt-1 font-semibold text-xs flex items-center gap-1.5">
                        {result.isDisabled ? (
                          <>
                            <XCircle className="h-3.5 w-3.5 text-rose-600" />
                            <span className="text-rose-700">Disabled by Admin</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-slate-900">Active Account</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Free Email Provider */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-500 font-medium">Provider Type</div>
                      <div className="mt-1 font-semibold text-xs flex items-center gap-1.5 text-slate-900">
                        <span>{result.isFreeEmail ? "Free Webmail (e.g. Gmail)" : "Corporate / Custom Domain"}</span>
                      </div>
                    </div>

                    {/* Provider Raw Status */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-500 font-medium">Raw Provider Status</div>
                      <div className="mt-1 font-semibold text-xs text-slate-700 font-mono">
                        {result.providerStatus}
                        {result.providerSubstatus ? ` (${result.providerSubstatus})` : ""}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Disclaimer Notice */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>
                    <strong>Notice:</strong> Verification indicates technical mailbox existence and deliverability signals, but does not guarantee delivery or inbox placement (which also depends on content, sender domain reputation, and recipient filtering).
                  </span>
                </div>

                {/* Result Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySummary}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Result Summary</span>
                        </>
                      )}
                    </button>
                    <Link
                      href="/dashboard/email-verification/history"
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>View Full History</span>
                    </Link>

                    {/* Contacts Integration */}
                    {contactLookup?.exists ? (
                      <Link
                        href={`/dashboard/contacts/${contactLookup.contact.id}`}
                        className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                        <span>View Contact ({contactLookup.contact.name || contactLookup.contact.email})</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => setShowAddContactModal(true)}
                        className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Add to Contacts</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Verify Another Email
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Add to Contacts Modal */}
          {showAddContactModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-slate-900">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Add to Contacts</h3>
                      <p className="text-xs text-slate-500">Save verified email into workspace contacts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddContactModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateContact} className="space-y-3.5">
                  {contactSaveError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                      {contactSaveError}
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <p className="text-slate-500 text-[11px]">Target Email & Verification Record</p>
                    <p className="font-semibold text-slate-900 font-mono">{result.email}</p>
                    <p className="text-[11px] text-slate-600">
                      Status: <strong className="text-indigo-600">{result.status}</strong> · Score: {result.overallScore ?? "—"}/100
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={newContactFirstName}
                        onChange={(e) => setNewContactFirstName(e.target.value)}
                        placeholder="e.g. Sarah"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={newContactLastName}
                        onChange={(e) => setNewContactLastName(e.target.value)}
                        placeholder="e.g. Connor"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={newContactCompany}
                      onChange={(e) => setNewContactCompany(e.target.value)}
                      placeholder="e.g. Cyberdyne Systems"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {availableLists.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Add to List (Optional)</label>
                      <select
                        value={newContactListId}
                        onChange={(e) => setNewContactListId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">-- None --</option>
                        {availableLists.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Tags (Optional)</label>
                    <input
                      type="text"
                      value={newContactTags}
                      onChange={(e) => setNewContactTags(e.target.value)}
                      placeholder="e.g. inbound, single-verified"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                    Consent Notice: New contact will be marked with <strong>Pending Consent</strong>. Verification confirms deliverability only, not marketing opt-in consent.
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddContactModal(false)}
                      className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingContact}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {savingContact ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Contact"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Database-Backed Recent Verifications Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              Recent Single Verifications
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                {totalRecent} total
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Audit log of verified email addresses in this workspace
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  startTransition(() => {
                    fetchRecent(1, e.target.value);
                  });
                }}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 w-44"
              />
            </div>
            <button
              onClick={() => fetchRecent(recentPage, searchQuery)}
              disabled={loadingRecent}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingRecent ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {deleteNotice && (
          <div className="mx-5 my-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{deleteNotice}</span>
            </div>
            <button
              onClick={() => setDeleteNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold px-1 text-sm cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {recentItems.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-slate-300 mx-auto" />
            <h3 className="text-xs font-semibold text-slate-700">
              No recent verifications to display
            </h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Enter an email address above and click verify to record and audit single verification results.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Email Address</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Mode</th>
                  <th className="px-5 py-3">Quality Score</th>
                  <th className="px-5 py-3">Verified At</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentItems.map((item) => {
                  const itemStatus = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.UNKNOWN;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{item.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${itemStatus.badgeClass}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-medium">
                        {item.verificationMode || "POWER"}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {item.overallScore !== null ? `${item.overallScore}/100` : "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(item.verifiedAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => {
                              setEmail(item.email);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                          >
                            Re-verify
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => handleDelete(item.id, item.email)}
                            disabled={deletingId === item.id}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40"
                            title="Delete verification record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>{deletingId === item.id ? "Deleting..." : "Delete"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalRecent > 6 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {recentPage} of {Math.ceil(totalRecent / 6)}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const p = Math.max(1, recentPage - 1);
                  setRecentPage(p);
                  fetchRecent(p, searchQuery);
                }}
                disabled={recentPage <= 1}
                className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  const p = recentPage + 1;
                  setRecentPage(p);
                  fetchRecent(p, searchQuery);
                }}
                disabled={recentPage >= Math.ceil(totalRecent / 6)}
                className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
