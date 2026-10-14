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
        className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Sending Domains</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {domains.verified}
            </span>
            <span className="text-xs text-slate-400">
              / {domains.total} Verified
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
            {defaultDomain ? defaultDomain.domain : "No domain added"}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isDefaultVerified
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            {isDefaultVerified ? "Active" : "Needs DNS"}
          </span>
        </div>
      </div>

      {/* 2. DNS Authentication Protocols Card */}
      <div
        onClick={() => onNavigateTab("domains")}
        className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">DNS Protocols</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
              defaultDomain?.spfStatus === "VERIFIED"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}>
              SPF {defaultDomain?.spfStatus === "VERIFIED" ? "✓" : "—"}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
              defaultDomain?.dkimStatus === "VERIFIED"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}>
              DKIM {defaultDomain?.dkimStatus === "VERIFIED" ? "✓" : "—"}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
              defaultDomain?.dmarcStatus === "VERIFIED"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}>
              DMARC {defaultDomain?.dmarcStatus === "VERIFIED" ? "✓" : "—"}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">DMARC Policy:</span>
          <span className="font-mono text-white text-[11px] font-semibold">
            {defaultDomain?.dmarcStatus === "VERIFIED" ? "v=DMARC1 (Active)" : "Missing / None"}
          </span>
        </div>
      </div>

      {/* 3. Email List Quality Card */}
      <div
        onClick={() => onNavigateTab("list-health")}
        className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">List Quality</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {listHealth.listHealthPercentage !== null ? `${listHealth.listHealthPercentage}%` : "—"}
            </span>
            <span className="text-xs text-slate-400">
              Valid Mailboxes
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            {listHealth.totalVerified} verified contacts
          </span>
          {listHealth.invalidCount > 0 ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {listHealth.invalidCount} Invalid
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              0 Invalid
            </span>
          )}
        </div>
      </div>

      {/* 4. Sending Health Card */}
      <div
        onClick={() => onNavigateTab("sending-health")}
        className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Sending Health</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {sendingHealth.bounceRate}%
            </span>
            <span className="text-xs text-slate-400">
              Bounce Rate
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            {sendingHealth.totalSent} sends logged
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              parseFloat(sendingHealth.bounceRate) < 2
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
            }`}
          >
            {parseFloat(sendingHealth.bounceRate) < 2 ? "Healthy" : "Attention"}
          </span>
        </div>
      </div>
    </div>
  );
}
