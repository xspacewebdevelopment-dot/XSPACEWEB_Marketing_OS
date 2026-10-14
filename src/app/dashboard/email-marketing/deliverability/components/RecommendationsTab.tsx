"use client";

import { useState } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Info,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { DeliverabilityRecommendation } from "@/lib/services/deliverability";

interface RecommendationsTabProps {
  recommendations: DeliverabilityRecommendation[];
  onNavigateTab: (tab: string) => void;
}

export function RecommendationsTab({
  recommendations,
  onNavigateTab,
}: RecommendationsTabProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");

  const filtered =
    filterSeverity === "ALL"
      ? recommendations
      : recommendations.filter((r) => r.severity === filterSeverity);

  const criticalCount = recommendations.filter((r) => r.severity === "CRITICAL").length;
  const warningCount = recommendations.filter((r) => r.severity === "WARNING").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-blue-400" />
              Actionable Deliverability Checks & Remediation
            </h2>
            {criticalCount > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">
                {criticalCount} Critical Action{criticalCount > 1 ? "s" : ""} Required
              </span>
            ) : warningCount > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                {warningCount} Warning{warningCount > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                All Checks Optimal
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized deliverability remediation steps based on actual DNS authentication checks, list hygiene stats, and provider sending metrics.
          </p>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1.5 shrink-0">
          {["ALL", "CRITICAL", "WARNING", "RECOMMENDED"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterSeverity === sev
                  ? "bg-slate-700 text-white font-semibold"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Cards List */}
      <div className="space-y-4">
        {filtered.map((rec) => {
          const isCritical = rec.severity === "CRITICAL";
          const isWarning = rec.severity === "WARNING";
          const isOptimal = rec.severity === "OPTIMAL";

          const badgeStyles = isCritical
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
            : isWarning
            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
            : isOptimal
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-blue-500/10 text-blue-400 border-blue-500/20";

          return (
            <div
              key={rec.id}
              className={`rounded-xl border p-5 bg-slate-900/90 shadow-sm transition-all ${
                isCritical
                  ? "border-rose-900/40 hover:border-rose-700/60"
                  : isWarning
                  ? "border-amber-900/40 hover:border-amber-700/60"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${badgeStyles}`}
                  >
                    {isCritical ? (
                      <AlertOctagon className="h-5 w-5" />
                    ) : isWarning ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : isOptimal ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Info className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-white">{rec.title}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${badgeStyles}`}
                      >
                        {rec.severity}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                </div>

                {/* Direct Action Link */}
                {rec.actionUrl && (
                  <div className="shrink-0 self-end sm:self-auto">
                    {rec.actionUrl.startsWith("#") ? (
                      <button
                        onClick={() => onNavigateTab(rec.actionUrl!.replace("#", ""))}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-sm transition-colors"
                      >
                        <span>{rec.actionLabel || "Fix Issue"}</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <a
                        href={rec.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:text-white border border-slate-700 transition-colors"
                      >
                        <span>{rec.actionLabel || "Learn More"}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Impact & Remediation Details */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/70">
                  <span className="font-semibold text-rose-400 block mb-1">
                    Deliverability Impact:
                  </span>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{rec.impact}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/70">
                  <span className="font-semibold text-emerald-400 block mb-1">
                    How to Fix:
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{rec.remediation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
