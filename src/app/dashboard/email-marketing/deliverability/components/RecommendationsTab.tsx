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
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-blue-600" />
              Actionable Deliverability Checks & Remediation
            </h2>
            {criticalCount > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                {criticalCount} Critical Action{criticalCount > 1 ? "s" : ""} Required
              </span>
            ) : warningCount > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                {warningCount} Warning{warningCount > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                All Checks Optimal
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prioritized deliverability remediation steps based on actual DNS authentication checks, list hygiene stats, and provider sending metrics.
          </p>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
          {["ALL", "CRITICAL", "WARNING", "RECOMMENDED"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterSeverity === sev
                  ? "bg-white text-blue-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
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
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : isWarning
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : isOptimal
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-blue-50 text-blue-700 border-blue-200";

          return (
            <div
              key={rec.id}
              className={`rounded-2xl border p-5 bg-white shadow-xs transition-all hover:shadow-sm ${
                isCritical
                  ? "border-rose-200/90 hover:border-rose-300"
                  : isWarning
                  ? "border-amber-200/90 hover:border-amber-300"
                  : "border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${badgeStyles}`}
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
                      <h3 className="font-bold text-sm text-slate-900">{rec.title}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${badgeStyles}`}
                      >
                        {rec.severity}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-xs transition-colors cursor-pointer"
                      >
                        <span>{rec.actionLabel || "Fix Issue"}</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <a
                        href={rec.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
                      >
                        <span>{rec.actionLabel || "Learn More"}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Impact & Remediation Details */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-rose-50/40 border border-rose-100">
                  <span className="font-bold text-rose-700 block mb-1">
                    Deliverability Impact:
                  </span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{rec.impact}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="font-bold text-slate-800 block mb-1">
                    How to Fix:
                  </span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{rec.remediation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
