"use client";

import React from "react";
import Link from "next/link";
import {
  Smartphone,
  Radio,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Sliders,
  Send,
  MessageSquare,
  HelpCircle,
  Cpu,
  Layers,
} from "lucide-react";

interface SmsOverviewTabProps {
  phoneContactsCount?: number;
}

export function SmsOverviewTab({
  phoneContactsCount = 0,
}: SmsOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Architecture Stage Notice */}
      <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-violet-900/10 border border-blue-200/80 rounded-xl p-5 text-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-blue-600 text-white shadow-sm mt-0.5">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  SMS & RCS Business Messaging Engine
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wide">
                  Step 1 • Shell Active
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Send critical transactional alerts, high-conversion text broadcasts, and verified interactive
                RCS rich cards with branding, buttons, and carousels — directly connected to your NexaReach workspace contacts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard/sms-rcs/compose"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Open Composer</span>
            </Link>
            <Link
              href="/dashboard/sms-rcs/settings"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
              <span>Sender Config</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Verified KPI Metric Cards (Non-fabricated data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Dispatches */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Dispatches</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">0</span>
            <span className="text-[11px] font-medium text-slate-400">messages</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            No live messages sent yet
          </p>
        </div>

        {/* Card 2: Delivery Rate */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Carrier Delivery Rate</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">—</span>
            <span className="text-[11px] font-medium text-slate-400">accuracy</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Awaiting carrier dispatches
          </p>
        </div>

        {/* Card 3: RCS Rich Interactions */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">RCS Rich Interactions</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">0</span>
            <span className="text-[11px] font-medium text-slate-400">taps & reads</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            Suggested replies & action clicks
          </p>
        </div>

        {/* Card 4: Phone Contacts Ready */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Phone-Ready Contacts</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{phoneContactsCount}</span>
            <span className="text-[11px] font-medium text-slate-400">recipients</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            In active workspace database
          </p>
        </div>
      </div>

      {/* Feature Architecture & Capability Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Capability 1: Standard SMS Engine */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <MessageSquare className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Standard SMS Protocol</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Direct universal delivery across all mobile networks worldwide. Automatically calculates GSM 7-bit encoding
              (160 chars) and UCS-2 Unicode (70 chars per segment) with multi-part concatenation tracking.
            </p>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>GSM 7-bit & UCS-2 automatic segment parsing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>Dynamic template tags (e.g. <code>{"{{firstName}}"}</code>)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>Opt-out compliance tracking (STOP / UNSUBSCRIBE)</span>
              </li>
            </ul>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/dashboard/sms-rcs/compose"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group"
            >
              <span>Draft an SMS message</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Capability 2: RCS Business Messaging */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">RCS Rich Business Messaging</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Next-generation messaging protocol for Android & iOS 18+. Delivers app-like rich cards, media carousels,
              verified brand badges, and suggested action buttons without requiring a third-party app.
            </p>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span>Verified sender checkmark & brand logo header</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span>Interactive action buttons (Open URL, Call, Calendar)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span>Automated fallback to SMS when RCS is unavailable</span>
              </li>
            </ul>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/dashboard/sms-rcs/compose"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 group"
            >
              <span>Preview RCS Rich Card</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Capability 3: Tenant & Compliance Safety */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Tenant Isolation & Safety</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Strict multi-tenant architecture isolated at the database level. Every message draft, campaign, and
              recipient list is strictly bound to your active workspace in Neon PostgreSQL.
            </p>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Database-level tenant scoping per workspace</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Integration with verified contacts database</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Pre-send opt-out and suppression guarding</span>
              </li>
            </ul>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/dashboard/sms-rcs/settings"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 group"
            >
              <span>Review Sender Configuration</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
