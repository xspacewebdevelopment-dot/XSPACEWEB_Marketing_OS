"use client";

import { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Server,
  Globe,
  Trash2,
  Star,
  Plus,
} from "lucide-react";
import { DnsRecordItem } from "@/lib/services/deliverability";

interface DomainManagementTabProps {
  domains: any[];
  onRefresh: () => void;
  onAddDomain: () => void;
  onSyncResend: () => void;
  isSyncing: boolean;
}

export function DomainManagementTab({
  domains,
  onRefresh,
  onAddDomain,
  onSyncResend,
  isSyncing,
}: DomainManagementTabProps) {
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(
    domains[0]?.id || null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState<{
    domainId: string;
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleVerify = async (domainId: string) => {
    try {
      setVerifyingId(domainId);
      setVerifyNotice(null);
      const res = await fetch(
        `/api/dashboard/email-marketing/deliverability/domains/${domainId}/verify`,
        { method: "POST" }
      );
      const json = await res.json();
      if (res.ok && json.success) {
        const d = json.data;
        if (d.status === "VERIFIED") {
          setVerifyNotice({
            domainId,
            type: "success",
            message: `Domain ${d.domain} is fully verified! SPF, DKIM, and DMARC checks passed.`,
          });
        } else {
          setVerifyNotice({
            domainId,
            type: "warning",
            message: `Verification check completed. Status is ${d.status}. Check pending DNS records below.`,
          });
        }
        onRefresh();
      } else {
        setVerifyNotice({
          domainId,
          type: "error",
          message: json.error || "Failed to verify domain DNS records.",
        });
      }
    } catch {
      setVerifyNotice({
        domainId,
        type: "error",
        message: "Network error during DNS verification.",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async (domainId: string) => {
    try {
      setIsDeleting(true);
      const res = await fetch(
        `/api/dashboard/email-marketing/deliverability/domains/${domainId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setDeleteConfirmId(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (domainId: string) => {
    try {
      await fetch(
        `/api/dashboard/email-marketing/deliverability/domains/${domainId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isDefault: true }),
        }
      );
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm text-slate-100">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-blue-400" />
            Sending Domain Authentication
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authenticate your corporate domain with SPF, DKIM, and DMARC to guarantee inbox placement and protect sender reputation.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onSyncResend}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors disabled:opacity-50"
            title="Sync domains from connected Resend account"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-blue-400" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync from Resend"}</span>
          </button>

          <button
            onClick={onAddDomain}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Sending Domain</span>
          </button>
        </div>
      </div>

      {/* DNS Setup Guide Accordion */}
      <div className="rounded-xl border border-slate-800 bg-[#09192d]/50 p-4 text-slate-300">
        <button
          onClick={() => setGuideOpen(!guideOpen)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">How DNS Authentication Works</p>
              <p className="text-[11px] text-slate-400">
                Setup guide for Cloudflare, GoDaddy, AWS Route 53, and Namecheap
              </p>
            </div>
          </div>
          {guideOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {guideOpen && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 text-xs text-slate-300 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-blue-400 block mb-1">1. SPF (Sender Policy Framework)</span>
                <p className="text-[11px] text-slate-400">
                  Authorizes Resend mail servers to send on behalf of your domain. Configured via CNAME (<code className="text-blue-300">send.yourdomain.com</code>) or TXT include.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-indigo-400 block mb-1">2. DKIM (DomainKeys Identified Mail)</span>
                <p className="text-[11px] text-slate-400">
                  Cryptographically signs every outbound email with a private key. Configured via TXT record at <code className="text-indigo-300">resend._domainkey</code>.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-emerald-400 block mb-1">3. DMARC (Domain-based Reporting)</span>
                <p className="text-[11px] text-slate-400">
                  Instructs receiving servers (Gmail, Yahoo) how to handle unauthenticated messages. Configured via TXT at <code className="text-emerald-300">_dmarc</code>.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-slate-200">DNS Propagation Note:</strong> After adding records in your registrar/DNS provider, changes typically take 5 to 30 minutes to propagate worldwide. NexaReach checks authoritative root nameservers directly.
            </p>
          </div>
        )}
      </div>

      {/* Domain Cards List */}
      {domains.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/40">
          <Globe className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No sending domains configured</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Add your domain or sync existing domains from Resend to begin sending authenticated marketing campaigns.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onSyncResend}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
            >
              Sync from Resend
            </button>
            <button
              onClick={onAddDomain}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
            >
              Add Domain
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {domains.map((d) => {
            const isExpanded = expandedDomainId === d.id;
            const records: DnsRecordItem[] = Array.isArray(d.dnsRecords) ? d.dnsRecords : [];
            const isFullyVerified = d.status === "VERIFIED";

            return (
              <div
                key={d.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden transition-all"
              >
                {/* Domain Header Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-900">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isFullyVerified
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {isFullyVerified ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white tracking-wide">
                          {d.domain}
                        </span>
                        {d.isDefault && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30 flex items-center gap-1">
                            <Star className="h-2.5 w-2.5 fill-blue-400" /> Default Sending Domain
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                            isFullyVerified
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : d.status === "PARTIALLY_VERIFIED"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                        <span>Region: {d.region || "us-east-1"}</span>
                        <span>•</span>
                        <span>
                          SPF:{" "}
                          <strong
                            className={
                              d.spfStatus === "VERIFIED"
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }
                          >
                            {d.spfStatus}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          DKIM:{" "}
                          <strong
                            className={
                              d.dkimStatus === "VERIFIED"
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }
                          >
                            {d.dkimStatus}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          DMARC:{" "}
                          <strong
                            className={
                              d.dmarcStatus === "VERIFIED"
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }
                          >
                            {d.dmarcStatus}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleVerify(d.id)}
                      disabled={verifyingId === d.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${
                          verifyingId === d.id ? "animate-spin text-blue-400" : ""
                        }`}
                      />
                      <span>{verifyingId === d.id ? "Verifying DNS..." : "Verify DNS Now"}</span>
                    </button>

                    {!d.isDefault && isFullyVerified && (
                      <button
                        onClick={() => handleSetDefault(d.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-blue-400 hover:bg-slate-800 border border-slate-800 transition-colors"
                        title="Make Default"
                      >
                        Set Default
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteConfirmId(d.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete Domain"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() =>
                        setExpandedDomainId(isExpanded ? null : d.id)
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Verification Notification */}
                {verifyNotice && verifyNotice.domainId === d.id && (
                  <div
                    className={`px-5 py-3 text-xs flex items-center gap-2 border-b ${
                      verifyNotice.type === "success"
                        ? "bg-emerald-950/40 text-emerald-300 border-emerald-900/50"
                        : verifyNotice.type === "warning"
                        ? "bg-amber-950/40 text-amber-300 border-amber-900/50"
                        : "bg-rose-950/40 text-rose-300 border-rose-900/50"
                    }`}
                  >
                    {verifyNotice.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    )}
                    <span>{verifyNotice.message}</span>
                  </div>
                )}

                {/* Expanded DNS Records Table */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4 bg-[#071322]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Required DNS Records for {d.domain}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Copy each record to your DNS management console
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/90">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Host / Name</th>
                            <th className="py-2.5 px-3">Value / Target</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                          {records.map((r, idx) => {
                            const isVerified = r.status === "verified";
                            const nameKey = `${d.id}-name-${idx}`;
                            const valKey = `${d.id}-val-${idx}`;

                            return (
                              <tr
                                key={idx}
                                className="hover:bg-slate-800/40 transition-colors"
                              >
                                <td className="py-3 px-3">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-bold">
                                    {r.type}
                                  </span>
                                  <span className="ml-1.5 text-[10px] text-slate-400 font-sans">
                                    ({r.record})
                                  </span>
                                </td>
                                <td className="py-3 px-3 max-w-[200px] truncate text-slate-200">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate">{r.name}</span>
                                    <button
                                      onClick={() =>
                                        copyToClipboard(r.name, nameKey)
                                      }
                                      className="p-1 hover:text-white text-slate-400 transition-colors"
                                      title="Copy Host"
                                    >
                                      {copiedKey === nameKey ? (
                                        <Check className="h-3 w-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3 px-3 max-w-[320px]">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="truncate text-slate-300"
                                      title={r.value}
                                    >
                                      {r.value}
                                    </span>
                                    <button
                                      onClick={() =>
                                        copyToClipboard(r.value, valKey)
                                      }
                                      className="p-1 hover:text-white text-slate-400 shrink-0 transition-colors"
                                      title="Copy Value"
                                    >
                                      {copiedKey === valKey ? (
                                        <Check className="h-3 w-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                  {r.detectedValue && !isVerified && (
                                    <p className="text-[10px] text-amber-400 font-sans mt-0.5">
                                      Detected: {r.detectedValue}
                                    </p>
                                  )}
                                </td>
                                <td className="py-3 px-3 font-sans">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      isVerified
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }`}
                                  >
                                    {isVerified ? (
                                      <CheckCircle2 className="h-3 w-3" />
                                    ) : (
                                      <AlertTriangle className="h-3 w-3" />
                                    )}
                                    <span className="capitalize">{r.status}</span>
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right font-sans">
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        `${r.type}\t${r.name}\t${r.value}`,
                                        `all-${idx}`
                                      )
                                    }
                                    className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                                  >
                                    {copiedKey === `all-${idx}`
                                      ? "Copied!"
                                      : "Copy Record"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>
                        Last verified:{" "}
                        {d.lastCheckedAt
                          ? new Date(d.lastCheckedAt).toLocaleString()
                          : "Never"}
                      </span>
                      {d.resendDomainId && (
                        <span>Resend Domain ID: {d.resendDomainId}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="h-9 w-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Delete Sending Domain?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this sending domain? Campaigns configured with this sender domain will no longer be authenticated.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
