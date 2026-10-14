"use client";

import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Globe,
  Radio,
  Layers,
  Send,
} from "lucide-react";

interface ExecutiveHealthBannerProps {
  data: {
    domains: {
      total: number;
      verified: number;
      defaultDomain: any;
    };
    listHealth: {
      totalVerified: number;
      validCount: number;
      invalidCount: number;
      listHealthPercentage: number | null;
      suppressionCount: number;
    };
    sendingHealth: {
      totalSent: number;
      deliveredCount: number;
      bouncedCount: number;
      complainedCount: number;
      hasWebhookConfirmation: boolean;
      bounceRate: string;
      isResendConfigured: boolean;
    };
    recommendations: any[];
  };
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function ExecutiveHealthBanner({
  data,
  onRefresh,
  isRefreshing,
}: ExecutiveHealthBannerProps) {
  const { domains, listHealth, sendingHealth, recommendations } = data;

  const defaultDomain = domains.defaultDomain;
  const isDomainVerified = defaultDomain?.status === "VERIFIED";
  const spfVerified = defaultDomain?.spfStatus === "VERIFIED";
  const dkimVerified = defaultDomain?.dkimStatus === "VERIFIED";
  const dmarcVerified = defaultDomain?.dmarcStatus === "VERIFIED";

  const criticalIssuesCount = recommendations.filter((r) => r.severity === "CRITICAL").length;
  const warningIssuesCount = recommendations.filter((r) => r.severity === "WARNING").length;

  let overallHealth = "OPTIMAL";
  let overallColor = "emerald";
  let healthTitle = "Deliverability Health Optimal";
  let healthDesc = "Authenticated sending infrastructure and verified list hygiene meet top-tier inbox placement standards.";

  if (!sendingHealth.isResendConfigured || domains.total === 0 || criticalIssuesCount > 0) {
    overallHealth = "ATTENTION REQUIRED";
    overallColor = "rose";
    healthTitle = `${criticalIssuesCount > 0 ? criticalIssuesCount : "Critical"} Configuration Issues Detected`;
    healthDesc = "Missing domain authentication or high invalid addresses detected. Review actionable checks below.";
  } else if (warningIssuesCount > 0 || !isDomainVerified) {
    overallHealth = "GOOD (ACTION RECOMMENDED)";
    overallColor = "amber";
    healthTitle = "Domain Partially Configured";
    healthDesc = "Complete SPF, DKIM, and DMARC verification to achieve maximum inbox reach across Yahoo and Google.";
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#071321] via-[#091b2f] to-[#040d17] p-6 shadow-xl text-slate-100">
      {/* Background Glow Effect */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Status & Overview */}
        <div className="flex items-start gap-4 max-w-2xl">
          <div
            className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              overallColor === "emerald"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10"
                : overallColor === "amber"
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-amber-500/10"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-rose-500/10"
            }`}
          >
            {overallColor === "emerald" ? (
              <ShieldCheck className="h-6 w-6" />
            ) : overallColor === "amber" ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <ShieldAlert className="h-6 w-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Email Deliverability Control Center
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  overallColor === "emerald"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : overallColor === "amber"
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                }`}
              >
                {overallHealth}
              </span>
            </div>

            <h1 className="text-xl font-bold text-white mt-1.5 tracking-tight">
              {healthTitle}
            </h1>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {healthDesc}
            </p>

            {/* Live DNS Verification Badges */}
            <div className="flex items-center gap-2.5 mt-3 flex-wrap text-xs">
              <span className="text-slate-400 text-[11px]">Default Sending Domain:</span>
              {defaultDomain ? (
                <div className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
                  <Globe className="h-3.5 w-3.5 text-blue-400" />
                  <span className="font-mono text-white text-[11px] font-semibold">
                    {defaultDomain.domain}
                  </span>
                  <div className="flex items-center gap-1.5 ml-1 text-[10px] font-mono">
                    <span className={spfVerified ? "text-emerald-400 font-bold" : "text-amber-400"}>
                      SPF {spfVerified ? "✓" : "⏳"}
                    </span>
                    <span>•</span>
                    <span className={dkimVerified ? "text-emerald-400 font-bold" : "text-amber-400"}>
                      DKIM {dkimVerified ? "✓" : "⏳"}
                    </span>
                    <span>•</span>
                    <span className={dmarcVerified ? "text-emerald-400 font-bold" : "text-amber-400"}>
                      DMARC {dmarcVerified ? "✓" : "⏳"}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-amber-400 italic">None configured</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quick Diagnostic Refresh */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
            <span>{isRefreshing ? "Running Diagnostics..." : "Refresh Live Diagnostics"}</span>
          </button>

          <div className="text-[11px] text-slate-400 text-right">
            <span>Provider Engine: </span>
            <strong className="text-slate-200 font-mono">Resend + Reoon</strong>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Strict truthfulness: Zero simulated metrics
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
