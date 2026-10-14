"use client";

import { useState } from "react";
import { Globe, X, AlertTriangle, CheckCircle2, Server } from "lucide-react";

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDomainAdded: () => void;
}

export function AddDomainModal({
  isOpen,
  onClose,
  onDomainAdded,
}: AddDomainModalProps) {
  const [domainInput, setDomainInput] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time domain syntax check
  const trimmed = domainInput.trim().toLowerCase().replace(/^(?:https?:\/\/)?(?:mailto:)?/i, "").split("/")[0];
  const isValidSyntax = /^(?!:\/\/)(?:[a-zA-Z0-9-_]{1,63}\.)+[a-zA-Z]{2,}$/.test(trimmed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidSyntax) {
      setError("Please provide a valid domain name (e.g. example.com or mail.example.com).");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/dashboard/email-marketing/deliverability/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: trimmed,
          region,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setDomainInput("");
        onDomainAdded();
        onClose();
      } else {
        setError(json.error || "Failed to add domain.");
      }
    } catch {
      setError("Network error adding sending domain.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Add Sending Domain</h3>
              <p className="text-[11px] text-slate-500">Configure SPF, DKIM & DMARC authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Domain Name
            </label>
            <input
              type="text"
              placeholder="e.g. acme-marketing.com"
              value={domainInput}
              onChange={(e) => {
                setDomainInput(e.target.value);
                setError(null);
              }}
              required
              className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {domainInput.trim() && (
              <p className={`text-[11px] flex items-center gap-1 mt-1 font-medium ${
                isValidSyntax ? "text-emerald-700" : "text-amber-700"
              }`}>
                {isValidSyntax ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Valid domain format: {trimmed}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span>Incomplete domain (must include TLD like .com)</span>
                  </>
                )}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Sending Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="us-east-1">US East (N. Virginia) - us-east-1</option>
              <option value="eu-west-1">EU West (Ireland) - eu-west-1</option>
              <option value="ap-northeast-1">Asia Pacific (Tokyo) - ap-northeast-1</option>
              <option value="sa-east-1">South America (São Paulo) - sa-east-1</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
            <strong className="text-slate-800 block mb-0.5">Ownership Requirement:</strong>
            You must have access to update DNS records (TXT & CNAME) for this domain with your registrar or DNS provider.
          </div>

          {error && (
            <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isValidSyntax}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 shadow-xs cursor-pointer"
            >
              {submitting ? "Adding Domain..." : "Add Domain & View DNS"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
