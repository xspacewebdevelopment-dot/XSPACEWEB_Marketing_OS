"use client";

import React from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  ChevronLeft,
} from "lucide-react";
import { SmsSettingsTab } from "../components/SmsSettingsTab";

export default function SmsSettingsPage() {
  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/sms-rcs"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Back to Overview"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                SMS & RCS Settings & Preferences
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Workspace Preferences
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Preferred sender handles, composition defaults, timezone scheduling, and RCS brand profile.
            </p>
          </div>
        </div>
      </div>

      <SmsSettingsTab />
    </div>
  );
}
