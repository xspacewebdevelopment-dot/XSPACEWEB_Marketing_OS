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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs text-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-blue-600" />
            Sending Domain Authentication
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Authenticate your corporate domain with SPF, DKIM, and DMARC to guarantee inbox placement and protect sender reputation.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onSyncResend}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-2xs hover:shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Sync domains from connected Resend account"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span>{isSyncing ? "Syncing..." : "Sync from Resend"}</span>
          </button>

          <button
            onClick={onAddDomain}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Sending Domain</span>
          </button>
        </div>
      </div>

      {/* DNS Setup Guide Accordion */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs text-slate-700">
        <button
          onClick={() => setGuideOpen(!guideOpen)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">How DNS Authentication Works</p>
              <p className="text-[11px] text-slate-500">
                Setup guide for Cloudflare, GoDaddy, AWS Route 53, and Namecheap
              </p>
            </div>
          </div>
          {guideOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {guideOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-bold text-blue-700 block mb-1">1. SPF (Sender Policy Framework)</span>
                <p className="text-[11px] text-slate-600">
                  Authorizes Resend mail servers to send on behalf of your domain. Configured via CNAME (<code className="text-blue-700 font-mono">send.yourdomain.com</code>) or TXT include.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-bold text-indigo-700 block mb-1">2. DKIM (DomainKeys Identified Mail)</span>
                <p className="text-[11px] text-slate-600">
                  Cryptographically signs every outbound email with a private key. Configured via TXT record at <code className="text-indigo-700 font-mono">resend._domainkey</code>.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="font-bold text-emerald-700 block mb-1">3. DMARC (Domain-based Reporting)</span>
                <p className="text-[11px] text-slate-600">
                  Instructs receiving servers (Gmail, Yahoo) how to handle unauthenticated messages. Configured via TXT at <code className="text-emerald-700 font-mono">_dmarc</code>.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <strong className="text-slate-800">DNS Propagation Note:</strong> After adding records in your registrar/DNS provider, changes typically take 5 to 30 minutes to propagate worldwide. NexaReach checks authoritative root nameservers directly.
            </p>
          </div>
        )}
      </div>

      {/* Domain Cards List */}
      {domains.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
          <Globe className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No sending domains configured</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Add your domain or sync existing domains from Resend to begin sending authenticated marketing campaigns.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onSyncResend}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs"
            >
              Sync from Resend
            </button>
            <button
              onClick={onAddDomain}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-xs"
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
                className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all"
              >
                {/* Domain Header Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-white">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isFullyVerified
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-amber-50 text-amber-600 border-amber-200"
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
                        <span className="font-bold text-sm text-slate-900 tracking-wide">
                          {d.domain}
                        </span>
                        {d.isDefault && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 flex items-center gap-1">
                            <Star className="h-2.5 w-2.5 fill-blue-600" /> Default Sending Domain
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                            isFullyVerified
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : d.status === "PARTIALLY_VERIFIED"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span>Region: <strong className="text-slate-700 font-mono">{d.region || "us-east-1"}</strong></span>
                        <span className="text-slate-300">•</span>
                        <span>
                          SPF:{" "}
                          <strong
                            className={
                              d.spfStatus === "VERIFIED"
                                ? "text-emerald-700 font-bold"
                                : "text-amber-700 font-semibold"
                            }
                          >
                            {d.spfStatus}
                          </strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>
                          DKIM:{" "}
                          <strong
                            className={
                              d.dkimStatus === "VERIFIED"
                                ? "text-emerald-700 font-bold"
                                : "text-amber-700 font-semibold"
                            }
                          >
                            {d.dkimStatus}
                          </strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>
                          DMARC:{" "}
                          <strong
                            className={
                              d.dmarcStatus === "VERIFIED"
                                ? "text-emerald-700 font-bold"
                                : "text-amber-700 font-semibold"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs hover:shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${
                          verifyingId === d.id ? "animate-spin text-blue-600" : "text-slate-500"
                        }`}
                      />
                      <span>{verifyingId === d.id ? "Verifying DNS..." : "Verify DNS Now"}</span>
                    </button>

                    {!d.isDefault && isFullyVerified && (
                      <button
                        onClick={() => handleSetDefault(d.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
                        title="Make Default"
                      >
                        Set Default
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteConfirmId(d.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Domain"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() =>
                        setExpandedDomainId(isExpanded ? null : d.id)
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : verifyNotice.type === "warning"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                  >
                    {verifyNotice.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                    <span>{verifyNotice.message}</span>
                  </div>
                )}

                {/* Expanded DNS Records Table */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4 bg-slate-50/60 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Required DNS Records for {d.domain}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Copy each record to your DNS management console
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Host / Name</th>
                            <th className="py-2.5 px-3">Value / Target</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {records.map((r, idx) => {
                            const isVerified = r.status === "verified";
                            const nameKey = `${d.id}-name-${idx}`;
                            const valKey = `${d.id}-val-${idx}`;

                            return (
                              <tr
                                key={idx}
                                className="hover:bg-slate-50/70 transition-colors"
                              >
                                <td className="py-3 px-3">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                                    {r.type}
                                  </span>
                                  <span className="ml-1.5 text-[10px] text-slate-500 font-sans">
                                    ({r.record})
                                  </span>
                                </td>
                                <td className="py-3 px-3 max-w-[200px] truncate text-slate-800">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate">{r.name}</span>
                                    <button
                                      onClick={() =>
                                        copyToClipboard(r.name, nameKey)
                                      }
                                      className="p-1 hover:text-blue-600 text-slate-400 transition-colors cursor-pointer"
                                      title="Copy Host"
                                    >
                                      {copiedKey === nameKey ? (
                                        <Check className="h-3 w-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3 px-3 max-w-[320px]">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="truncate text-slate-700"
                                      title={r.value}
                                    >
                                      {r.value}
                                    </span>
                                    <button
                                      onClick={() =>
                                        copyToClipboard(r.value, valKey)
                                      }
                                      className="p-1 hover:text-blue-600 text-slate-400 shrink-0 transition-colors cursor-pointer"
                                      title="Copy Value"
                                    >
                                      {copiedKey === valKey ? (
                                        <Check className="h-3 w-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                  {r.detectedValue && !isVerified && (
                                    <p className="text-[10px] text-amber-700 font-sans mt-0.5">
                                      Detected: {r.detectedValue}
                                    </p>
                                  )}
                                </td>
                                <td className="py-3 px-3 font-sans">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      isVerified
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
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
                                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
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

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>
                        Last verified:{" "}
                        <strong className="text-slate-700">
                          {d.lastCheckedAt
                            ? new Date(d.lastCheckedAt).toLocaleString()
                            : "Never"}
                        </strong>
                      </span>
                      {d.resendDomainId && (
                        <span>Resend Domain ID: <code className="font-mono text-slate-600">{d.resendDomainId}</code></span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Delete Sending Domain?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this sending domain? Campaigns configured with this sender domain will no longer be authenticated.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer disabled:opacity-50"
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
