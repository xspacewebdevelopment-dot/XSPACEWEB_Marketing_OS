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
    <div
      className={`relative overflow-hidden rounded-2xl border p-6 shadow-xs transition-all ${
        overallColor === "emerald"
          ? "border-emerald-200/90 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50/60"
          : overallColor === "amber"
          ? "border-amber-200/90 bg-gradient-to-br from-amber-50/40 via-white to-slate-50/60"
          : "border-rose-200/90 bg-gradient-to-br from-rose-50/40 via-white to-slate-50/60"
      }`}
    >
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Status & Overview */}
        <div className="flex items-start gap-4 max-w-2xl">
          <div
            className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              overallColor === "emerald"
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : overallColor === "amber"
                ? "bg-amber-50 text-amber-600 border border-amber-200"
                : "bg-rose-50 text-rose-600 border border-rose-200"
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
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                Email Deliverability Control Center
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  overallColor === "emerald"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : overallColor === "amber"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {overallHealth}
              </span>
            </div>

            <h1 className="text-xl font-bold text-slate-900 mt-1.5 tracking-tight">
              {healthTitle}
            </h1>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {healthDesc}
            </p>

            {/* Live DNS Verification Badges */}
            <div className="flex items-center gap-2.5 mt-3 flex-wrap text-xs">
              <span className="text-slate-500 text-[11px] font-medium">Default Sending Domain:</span>
              {defaultDomain ? (
                <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800 shadow-2xs">
                  <Globe className="h-3.5 w-3.5 text-blue-600" />
                  <span className="font-mono text-slate-900 text-[11px] font-bold">
                    {defaultDomain.domain}
                  </span>
                  <div className="flex items-center gap-1.5 ml-1 text-[10px] font-mono">
                    <span className={spfVerified ? "text-emerald-700 font-bold" : "text-amber-700 font-semibold"}>
                      SPF {spfVerified ? "✓" : "⏳"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className={dkimVerified ? "text-emerald-700 font-bold" : "text-amber-700 font-semibold"}>
                      DKIM {dkimVerified ? "✓" : "⏳"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className={dmarcVerified ? "text-emerald-700 font-bold" : "text-amber-700 font-semibold"}>
                      DMARC {dmarcVerified ? "✓" : "⏳"}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-amber-700 italic">None configured</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quick Diagnostic Refresh */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs hover:shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span>{isRefreshing ? "Running Diagnostics..." : "Refresh Live Diagnostics"}</span>
          </button>

          <div className="text-[11px] text-slate-500 text-right">
            <span>Provider Engine: </span>
            <strong className="text-slate-800 font-mono">Resend + Reoon</strong>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Strict truthfulness: Zero simulated metrics
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
