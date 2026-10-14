"use client";

import {
  Globe,
  ShieldCheck,
  Users,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Radio,
  ArrowRight,
} from "lucide-react";

interface MetricCardsProps {
  data: {
    domains: {
      total: number;
      verified: number;
      pending: number;
      defaultDomain: any;
    };
    listHealth: {
      contactsCount: number;
      totalVerified: number;
      validCount: number;
      invalidCount: number;
      catchAllCount: number;
      listHealthPercentage: number | null;
      suppressionCount: number;
    };
    sendingHealth: {
      totalSent: number;
      deliveredCount: number;
      bouncedCount: number;
      complainedCount: number;
      deliveryRate: string | null;
      bounceRate: string;
      complaintRate: string;
      hasWebhookConfirmation: boolean;
    };
  };
  onNavigateTab: (tab: string) => void;
}

export function MetricCards({ data, onNavigateTab }: MetricCardsProps) {
  const { domains, listHealth, sendingHealth } = data;

  const defaultDomain = domains.defaultDomain;
  const isDefaultVerified = defaultDomain?.status === "VERIFIED";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Sending Domains Card */}
      <div
        onClick={() => onNavigateTab("domains")}
        className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between shadow-2xs"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Sending Domains</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {domains.verified}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {domains.total} Verified
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
            {defaultDomain ? defaultDomain.domain : "No domain added"}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isDefaultVerified
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {isDefaultVerified ? "Active" : "Needs DNS"}
          </span>
        </div>
      </div>

      {/* 2. DNS Authentication Protocols Card */}
      <div
        onClick={() => onNavigateTab("domains")}
        className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between shadow-2xs"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">DNS Protocols</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
              defaultDomain?.spfStatus === "VERIFIED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}>
              SPF {defaultDomain?.spfStatus === "VERIFIED" ? "✓" : "—"}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
              defaultDomain?.dkimStatus === "VERIFIED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}>
              DKIM {defaultDomain?.dkimStatus === "VERIFIED" ? "✓" : "—"}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
              defaultDomain?.dmarcStatus === "VERIFIED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            }`}>
              DMARC {defaultDomain?.dmarcStatus === "VERIFIED" ? "✓" : "—"}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px]">DMARC Policy:</span>
          <span className="font-mono text-slate-800 text-[11px] font-semibold">
            {defaultDomain?.dmarcStatus === "VERIFIED" ? "v=DMARC1 (Active)" : "Missing / None"}
          </span>
        </div>
      </div>

      {/* 3. Email List Quality Card */}
      <div
        onClick={() => onNavigateTab("list-health")}
        className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between shadow-2xs"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">List Quality</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {listHealth.listHealthPercentage !== null ? `${listHealth.listHealthPercentage}%` : "—"}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Valid Mailboxes
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 font-medium">
            {listHealth.totalVerified} verified contacts
          </span>
          {listHealth.invalidCount > 0 ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {listHealth.invalidCount} Invalid
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              0 Invalid
            </span>
          )}
        </div>
      </div>

      {/* 4. Sending Health Card */}
      <div
        onClick={() => onNavigateTab("sending-health")}
        className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between shadow-2xs"
      >
        <div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Sending Health</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {sendingHealth.bounceRate}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Bounce Rate
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 font-medium">
            {sendingHealth.totalSent} sends logged
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              parseFloat(sendingHealth.bounceRate) < 2
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {parseFloat(sendingHealth.bounceRate) < 2 ? "Healthy" : "Attention"}
          </span>
        </div>
      </div>
    </div>
  );
}
