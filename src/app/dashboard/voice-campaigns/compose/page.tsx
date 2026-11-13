"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Sparkles, Loader2, PhoneCall } from "lucide-react";
import { VoiceComposerTab } from "../components/VoiceComposerTab";

function VoiceComposeContent() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId") || searchParams.get("id");
  const templateId = searchParams.get("templateId");
  const [phoneContactsCount, setPhoneContactsCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function loadContactsInfo() {
      try {
        const res = await fetch("/api/dashboard/contacts?limit=1");
        if (res.ok) {
          const json = await res.json();
          if (isMounted && typeof json.totalCount === "number") {
            setPhoneContactsCount(json.totalCount);
          }
        }
      } catch {
        // ignore
      }
    }
    loadContactsInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/voice-campaigns/campaigns"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Back to Campaigns"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Voice Campaign Composer
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Live Studio
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              5-step wizard with voice-specific consent validation and speech synthesis preview.
            </p>
          </div>
        </div>
      </div>

      <VoiceComposerTab
        phoneContactsCount={phoneContactsCount}
        initialDraftId={draftId}
        initialTemplateId={templateId}
      />
    </div>
  );
}

export default function VoiceComposePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <VoiceComposeContent />
    </Suspense>
  );
}
