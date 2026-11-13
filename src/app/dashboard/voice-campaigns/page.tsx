"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PhoneCall, Plus } from "lucide-react";
import { VoiceOverviewTab } from "./components/VoiceOverviewTab";

export default function VoiceCampaignsOverviewPage() {
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
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Voice Campaigns Overview
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Marketing OS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated speech campaigns, audience compliance, voice synthesis studio, and delivery tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/voice-campaigns/compose"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create Campaign</span>
          </Link>
        </div>
      </div>

      <VoiceOverviewTab phoneContactsCount={phoneContactsCount} />
    </div>
  );
}
