"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function executeUnsubscribe() {
      if (!token) {
        setError("Invalid or missing unsubscribe link. Please verify the URL in your email.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/campaigns/unsubscribe?token=${encodeURIComponent(token)}`);
        const json = await res.json();

        if (res.ok && json.success) {
          setSuccess(true);
          setEmail(json.data?.email || null);
          setCampaignName(json.data?.campaignName || null);
        } else {
          setError(json.error || "Unable to process unsubscribe request.");
        }
      } catch (err: any) {
        setError(err.message || "A network error occurred.");
      } finally {
        setLoading(false);
      }
    }

    executeUnsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#070f1e] flex flex-col items-center justify-center p-4 select-none text-slate-200">
      <div className="max-w-md w-full bg-[#0a1829] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        {/* Brand header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide text-white">NEXAREACH</span>
        </div>

        {loading && (
          <div className="py-10 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
            <p className="text-sm text-slate-300 font-medium">Processing your unsubscribe request...</p>
          </div>
        )}

        {!loading && success && (
          <div className="text-center space-y-5">
            <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">Successfully Unsubscribed</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                {email ? (
                  <>
                    <strong className="text-slate-200">{email}</strong> has been removed from all marketing lists and added to the permanent suppression registry.
                  </>
                ) : (
                  "You have been successfully opted out and will receive no further marketing emails from this sender."
                )}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-slate-300 font-medium">
                <Mail className="h-3.5 w-3.5 text-blue-400" />
                <span>Immediate Status Update</span>
              </div>
              <p>Opt-out recorded in real-time. Unsubscribe compliance status: Active.</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="text-center space-y-5">
            <div className="h-14 w-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">Unsubscribe Notice</h1>
              <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
            </div>

            <p className="text-[11px] text-slate-400">
              If you continue receiving unwanted communications, please contact support or reply directly with &quot;UNSUBSCRIBE&quot;.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <span className="text-[10px] text-slate-400">
            Powered by NexaReach Marketing OS &bull; Privacy & Email Compliance
          </span>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070f1e] flex flex-col items-center justify-center p-4 text-slate-200">
          <div className="max-w-md w-full bg-[#0a1829] border border-slate-800 rounded-2xl p-8 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
            <p className="text-sm text-slate-300">Loading unsubscribe preferences...</p>
          </div>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}

