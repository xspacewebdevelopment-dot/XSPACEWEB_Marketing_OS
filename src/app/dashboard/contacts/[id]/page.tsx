"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Coins,
  RefreshCw,
  Edit2,
  Trash2,
  Plus,
  X,
  Layers,
  FileCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  ExternalLink,
} from "lucide-react";

import { EditContactModal } from "../components/EditContactModal";
import { AddToListModal } from "../components/AddToListModal";
import { SuppressContactModal } from "../components/SuppressContactModal";
import type { ContactListSummary } from "@/lib/types/contacts";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ContactProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const contactId = resolvedParams.id;
  const router = useRouter();

  const [contact, setContact] = useState<any>(null);
  const [lists, setLists] = useState<ContactListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [showSuppressModal, setShowSuppressModal] = useState(false);
  const [showReverifyConfirm, setShowReverifyConfirm] = useState(false);
  const [showRemoveSuppressionModal, setShowRemoveSuppressionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [reverifyLoading, setReverifyLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [suppressionJustification, setSuppressionJustification] = useState("");
  const [confirmedConsent, setConfirmedConsent] = useState(false);
  const [removalError, setRemovalError] = useState<string | null>(null);

  const fetchContact = async () => {
    try {
      const res = await fetch(`/api/dashboard/contacts/${contactId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Contact not found");
      setContact(data.contact);
    } catch (e: any) {
      setError(e.message || "Failed to load contact");
    } finally {
      setLoading(false);
    }
  };

  const fetchLists = async () => {
    try {
      const res = await fetch("/api/dashboard/lists");
      const data = await res.json();
      if (res.ok && data.lists) {
        setLists(data.lists);
      }
    } catch (e) {
      console.error("Failed to fetch lists", e);
    }
  };

  useEffect(() => {
    fetchContact();
    fetchLists();
  }, [contactId]);

  // Re-verify action
  const handleReverify = async () => {
    setReverifyLoading(true);
    try {
      const res = await fetch(`/api/dashboard/contacts/${contactId}/reverify`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Re-verification failed");
      setShowReverifyConfirm(false);
      await fetchContact();
    } catch (e: any) {
      alert(`Re-verification failed: ${e.message}`);
    } finally {
      setReverifyLoading(false);
    }
  };

  // Remove list membership
  const handleRemoveFromList = async (listId: string) => {
    if (!window.confirm("Remove contact from this list?")) return;
    try {
      const res = await fetch(`/api/dashboard/lists/${listId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: [contactId] }),
      });
      if (res.ok) {
        await fetchContact();
        await fetchLists();
      }
    } catch (e) {
      console.error("Failed to remove from list", e);
    }
  };

  // Remove manual suppression
  const handleRemoveSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.suppressionDetails?.id) return;
    setActionLoading(true);
    setRemovalError(null);

    try {
      const res = await fetch(
        `/api/dashboard/email-verification/suppression/${contact.suppressionDetails.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            justification: suppressionJustification.trim(),
            confirmedRenewedConsent: confirmedConsent,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove suppression");
      }
      setShowRemoveSuppressionModal(false);
      setSuppressionJustification("");
      setConfirmedConsent(false);
      await fetchContact();
    } catch (err: any) {
      setRemovalError(err.message || "Failed to remove suppression");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete contact
  const handleDeleteContact = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/dashboard/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard/contacts");
      }
    } catch (e) {
      alert("Failed to delete contact");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-sm">Loading contact profile...</p>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Contact Not Found</h2>
        <p className="text-xs text-slate-400">{error || "This contact record does not exist."}</p>
        <Link
          href="/dashboard/contacts"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Contacts
        </Link>
      </div>
    );
  }

  const fullName =
    contact.name ||
    [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
    "Unnamed Contact";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/contacts"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 shadow-xs transition-colors"
            title="Back to Contacts"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{fullName}</h1>
              {contact.isSuppressed && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Suppressed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{contact.email}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setShowReverifyConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Verify / Reverify Email</span>
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Profile</span>
          </button>

          {!contact.isSuppressed ? (
            <button
              onClick={() => setShowSuppressModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 shadow-xs transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Suppress</span>
            </button>
          ) : (
            <button
              onClick={() => setShowRemoveSuppressionModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 shadow-xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Remove Suppression</span>
            </button>
          )}

          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 shadow-xs transition-colors cursor-pointer"
            title="Delete Contact"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Info & Consent & Lists (1 Col) */}
        <div className="space-y-6">
          {/* Contact Details Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Contact Information
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 text-[11px]">Email Address</p>
                <p className="font-mono text-slate-900 font-medium mt-0.5">{contact.email}</p>
              </div>

              {contact.phone && (
                <div>
                  <p className="text-slate-400 text-[11px]">Phone Number</p>
                  <p className="text-slate-800 mt-0.5">{contact.phone}</p>
                </div>
              )}

              {(contact.company || contact.jobTitle) && (
                <div>
                  <p className="text-slate-400 text-[11px]">Company & Job Title</p>
                  <p className="text-slate-800 mt-0.5 font-medium">
                    {contact.jobTitle ? `${contact.jobTitle} at ` : ""}
                    {contact.company || "Independent"}
                  </p>
                </div>
              )}

              {contact.notes && (
                <div>
                  <p className="text-slate-400 text-[11px]">Notes</p>
                  <p className="text-slate-700 mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] whitespace-pre-wrap">
                    {contact.notes}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Created {new Date(contact.createdAt).toLocaleDateString()}</span>
                <span>Updated {new Date(contact.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Marketing Consent Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Marketing Consent
            </h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-700 font-medium">Subscription Status</span>
              {contact.subscriptionStatus === "SUBSCRIBED" ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Subscribed
                </span>
              ) : contact.subscriptionStatus === "UNSUBSCRIBED" ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  Unsubscribed
                </span>
              ) : contact.subscriptionStatus === "BOUNCED" ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Bounced
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Pending Consent
                </span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 text-blue-600 mt-0.5" />
              <span>
                Consent Integrity Rule: Email verification confirms technical deliverability only, not
                marketing opt-in consent. Consent is never assumed automatically.
              </span>
            </div>
          </div>

          {/* List Memberships Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                List Memberships
              </h3>
              <button
                onClick={() => setShowAddToListModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add to List
              </button>
            </div>

            {contact.lists && contact.lists.length > 0 ? (
              <div className="space-y-2">
                {contact.lists.map((l: any) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{l.name}</p>
                      {l.description && (
                        <p className="text-[10px] text-slate-400">{l.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveFromList(l.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      title="Remove from list"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">Not enrolled in any lists</p>
            )}
          </div>

          {/* Tags Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tags</h3>
            {contact.tags && contact.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No tags assigned</p>
            )}
          </div>
        </div>

        {/* Right Column: Reoon Verification & Suppression Details (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Reoon Verification Status Box */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                    contact.verificationStatus === "VALID"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-600"
                      : contact.verificationStatus === "INVALID"
                      ? "bg-rose-50 border border-rose-200 text-rose-600"
                      : contact.verificationStatus === "RISKY"
                      ? "bg-amber-50 border border-amber-200 text-amber-600"
                      : "bg-slate-100 border border-slate-200 text-slate-500"
                  }`}
                >
                  {contact.verificationStatus === "VALID" ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : contact.verificationStatus === "INVALID" ? (
                    <XCircle className="w-6 h-6" />
                  ) : contact.verificationStatus === "RISKY" ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <HelpCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {contact.verificationStatus || "UNVERIFIED"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {contact.lastVerifiedAt
                      ? `Verified on ${new Date(contact.lastVerifiedAt).toLocaleString()}`
                      : "Email has not undergone Reoon verification yet"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowReverifyConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3 h-3 text-blue-600" />
                <span>Re-check Deliverability</span>
              </button>
            </div>

            {/* Verification Metadata Subgrid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[11px] text-slate-400">Quality Score</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {contact.overallScore !== null && contact.overallScore !== undefined
                    ? `${contact.overallScore}/100`
                    : "—"}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[11px] text-slate-400">Syntax Check</p>
                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Passed
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[11px] text-slate-400">Disposable Mail</p>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  {contact.isDisposable ? "Yes (Disposable)" : "No (Genuine)"}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[11px] text-slate-400">Domain Classification</p>
                <p className="text-xs font-semibold text-slate-700 mt-1 truncate">
                  {contact.isRoleBased ? "Role Account" : "Personal / Corp"}
                </p>
              </div>
            </div>
          </div>

          {/* Suppression Status Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Suppression Governance
              </h3>
              {contact.isSuppressed ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Actively Suppressed
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Clean / Unsuppressed
                </span>
              )}
            </div>

            {contact.isSuppressed ? (
              <div className="space-y-3">
                <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Reason:</span>
                    <span className="font-semibold text-rose-700 font-mono">
                      {contact.suppressionReason || "MANUAL_BLOCK"}
                    </span>
                  </div>
                  {contact.suppressionDetails && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Source:</span>
                        <span className="text-slate-700">
                          {contact.suppressionDetails.source || "Manual Entry"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Suppressed On:</span>
                        <span className="text-slate-700">
                          {new Date(contact.suppressionDetails.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-400">
                    Dispatches to this address will be automatically prevented across all campaigns.
                  </p>
                  <button
                    onClick={() => setShowRemoveSuppressionModal(true)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition shrink-0 cursor-pointer"
                  >
                    Remove Manual Suppression
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  This contact is not suppressed and is eligible to receive dispatches if valid consent is recorded.
                </p>
                <button
                  onClick={() => setShowSuppressModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 shadow-xs transition cursor-pointer"
                >
                  Suppress Email
                </button>
              </div>
            )}
          </div>

          {/* Verification History Timeline / List */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Linked Verification History
            </h3>

            {contact.verificationHistory && contact.verificationHistory.length > 0 ? (
              <div className="space-y-2">
                {contact.verificationHistory.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          item.status === "VALID"
                            ? "bg-emerald-500"
                            : item.status === "INVALID"
                            ? "bg-rose-500"
                            : item.status === "RISKY"
                            ? "bg-amber-500"
                            : "bg-slate-400"
                        }`}
                      />
                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.status} ({item.providerStatus})
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.verificationJob
                            ? `Bulk Job: ${item.verificationJob.filename}`
                            : "Single Verification Check"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {item.overallScore !== null && (
                        <p className="font-mono text-blue-600 font-bold">{item.overallScore}/100</p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        {new Date(item.verifiedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No past verification job history on record for this email
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Reverify Email (Credit Consumption Warning) */}
      {showReverifyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Re-verification</h3>
                <p className="text-xs text-slate-500">Reoon Credit Consumption Notice</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Re-verifying <span className="font-semibold text-slate-900">{contact.email}</span> will trigger
              an authentic live verification request with Reoon and consume{" "}
              <span className="font-bold text-amber-700">1 Reoon credit</span>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReverifyConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reverifyLoading}
                onClick={handleReverify}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
              >
                {reverifyLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  "Confirm & Reverify"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Remove Manual Suppression */}
      {showRemoveSuppressionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Remove Manual Suppression</h3>
                <p className="text-xs text-slate-500">Audited Compliance Action</p>
              </div>
            </div>

            <form onSubmit={handleRemoveSuppression} className="space-y-4">
              {removalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {removalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Removal Justification <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={suppressionJustification}
                  onChange={(e) => setSuppressionJustification(e.target.value)}
                  placeholder="Documented reason for removing suppression (minimum 5 chars)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={confirmedConsent}
                  onChange={(e) => setConfirmedConsent(e.target.checked)}
                  className="mt-0.5 text-amber-500 rounded border-slate-800 focus:ring-amber-500"
                />
                <span>I confirm that the recipient has explicitly renewed their consent.</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRemoveSuppressionModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || suppressionJustification.trim().length < 5}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-lg transition"
                >
                  {actionLoading ? "Removing..." : "Confirm Removal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Contact Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Delete Contact</h3>
                <p className="text-xs text-slate-400">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Are you sure you want to delete <span className="font-semibold text-white">{contact.email}</span>?
              {contact.isSuppressed && (
                <span className="block mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  Notice: This email's suppression record will remain in the workspace suppression list
                  to protect your sender reputation.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteContact}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditContactModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        contact={contact}
        lists={lists}
        onSuccess={fetchContact}
      />

      {/* Add To List Modal */}
      <AddToListModal
        isOpen={showAddToListModal}
        onClose={() => setShowAddToListModal(false)}
        contactIds={[contactId]}
        lists={lists}
        onSuccess={fetchContact}
      />

      {/* Suppress Modal */}
      <SuppressContactModal
        isOpen={showSuppressModal}
        onClose={() => setShowSuppressModal(false)}
        contactId={contact.id}
        contactEmail={contact.email}
        contactName={contact.name}
        onSuccess={fetchContact}
      />
    </div>
  );
}
