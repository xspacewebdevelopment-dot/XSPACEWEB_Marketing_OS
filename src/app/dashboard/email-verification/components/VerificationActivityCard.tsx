"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  Database,
  Plus,
  Upload,
} from "lucide-react";

export interface DayMetric {
  dateKey: string;
  label: string;
  dayOfWeek: string;
  valid: number;
  invalid: number;
  risky: number;
  unknown: number;
  total: number;
}

export interface VerificationActivityProps {
  totalVerified: number;
  validCount: number;
  invalidCount: number;
  riskyCount: number;
  unknownCount: number;
  validityRate: string;
  singleCount: number;
  bulkCount: number;
  averageScore: number | null;
  disposableCount: number;
  roleBasedCount: number;
  freeEmailCount: number;
  sevenDaysData: DayMetric[];
  fourteenDaysData: DayMetric[];
  lastVerifiedAt: string | null;
}

export function VerificationActivityCard({
  totalVerified,
  validCount,
  invalidCount,
  riskyCount,
  unknownCount,
  validityRate,
  singleCount,
  bulkCount,
  averageScore,
  disposableCount,
  roleBasedCount,
  freeEmailCount,
  sevenDaysData,
  fourteenDaysData,
  lastVerifiedAt,
}: VerificationActivityProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "health" | "engine">("timeline");
  const [timelineRange, setTimelineRange] = useState<"7d" | "14d">("7d");
  const [hoveredDay, setHoveredDay] = useState<DayMetric | null>(null);

  const currentChartData = timelineRange === "7d" ? sevenDaysData : fourteenDaysData;
  const maxDailyCount = Math.max(...currentChartData.map((d) => d.total), 1);
  const periodTotal = currentChartData.reduce((acc, curr) => acc + curr.total, 0);

  // If there are zero records in the database
  if (totalVerified === 0) {
    return (
      <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Verification Activity
            </h2>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Real-time Database Metric
          </span>
        </div>

        <div className="my-8 py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <Activity className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-semibold text-slate-900">
              No verification activity recorded yet
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Activity timelines will chart your list health, validity rates, and engine metrics once you run your first single or bulk verification job.
            </p>
          </div>
          <div className="pt-2 flex items-center gap-3">
            <Link
              href="/dashboard/email-verification/single"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Verify Single</span>
            </Link>
            <Link
              href="/dashboard/email-verification/bulk"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Bulk Verify</span>
            </Link>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Database Status: Connected to Neon PostgreSQL</span>
          </div>
          <span className="font-medium text-slate-700">0 records in workspace</span>
        </div>
      </div>
    );
  }

  // Active state with real database records
  return (
    <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
      {/* Card Header with View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Verification Activity
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Real-time workspace telemetry & list health analytics
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/60 self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "timeline"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Timeline</span>
          </button>
          <button
            onClick={() => setActiveTab("health")}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "health"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>List Health</span>
          </button>
          <button
            onClick={() => setActiveTab("engine")}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "engine"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Engine</span>
          </button>
        </div>
      </div>

      {/* Main Body Content based on Active Tab */}
      <div className="py-5">
        {/* TAB 1: TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            {/* Timeline Controls & Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-700">
                  <span className="font-bold text-slate-900">{periodTotal}</span> verifications in period
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">
                  Peak: <strong className="text-slate-700">{maxDailyCount}</strong> / day
                </span>
                {lastVerifiedAt && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">
                      Last active: <strong className="text-slate-700">{lastVerifiedAt}</strong>
                    </span>
                  </>
                )}
              </div>

              {/* 7d vs 14d toggle */}
              <div className="flex items-center gap-1 border border-slate-200 rounded-md p-0.5 bg-slate-50 text-[11px]">
                <button
                  onClick={() => setTimelineRange("7d")}
                  className={`px-2 py-0.5 rounded transition-all ${
                    timelineRange === "7d"
                      ? "bg-white font-semibold text-blue-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setTimelineRange("14d")}
                  className={`px-2 py-0.5 rounded transition-all ${
                    timelineRange === "14d"
                      ? "bg-white font-semibold text-blue-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  14 Days
                </button>
              </div>
            </div>

            {/* Interactive Stacked Bar Chart */}
            <div className="relative pt-6 pb-2">
              {/* Hover Tooltip Box */}
              {hoveredDay && (
                <div className="absolute top-0 right-2 z-10 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-lg shadow-lg flex items-center gap-3 pointer-events-none animate-in fade-in duration-150">
                  <span className="font-semibold text-slate-200 border-r border-slate-700 pr-2">
                    {hoveredDay.label}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Valid: {hoveredDay.valid}
                  </span>
                  <span className="flex items-center gap-1 text-rose-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                    Invalid: {hoveredDay.invalid}
                  </span>
                  {hoveredDay.risky > 0 && (
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                      Risky: {hoveredDay.risky}
                    </span>
                  )}
                  <span className="font-bold text-white pl-1 border-l border-slate-700">
                    Total: {hoveredDay.total}
                  </span>
                </div>
              )}

              {/* Chart Grid & Bars Container */}
              <div className="h-44 w-full flex items-end gap-2 sm:gap-3 px-1 border-b border-slate-200">
                {currentChartData.map((day) => {
                  const hasData = day.total > 0;
                  // Calculate heights proportionally to maxDailyCount
                  const validPercent = (day.valid / maxDailyCount) * 100;
                  const invalidPercent = (day.invalid / maxDailyCount) * 100;
                  const riskyPercent = (day.risky / maxDailyCount) * 100;
                  const unknownPercent = (day.unknown / maxDailyCount) * 100;

                  return (
                    <div
                      key={day.dateKey}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="group flex-1 h-full flex flex-col justify-end items-center cursor-pointer relative"
                    >
                      {/* Bar Column */}
                      <div className="w-full max-w-[36px] flex flex-col justify-end h-full">
                        {hasData ? (
                          <div className="w-full flex flex-col rounded-t-md overflow-hidden shadow-xs group-hover:ring-2 group-hover:ring-blue-400 transition-all">
                            {/* Segment: Unknown */}
                            {unknownPercent > 0 && (
                              <div
                                style={{ height: `${Math.max(unknownPercent, 4)}%` }}
                                className="w-full bg-slate-400"
                              />
                            )}
                            {/* Segment: Risky */}
                            {riskyPercent > 0 && (
                              <div
                                style={{ height: `${Math.max(riskyPercent, 4)}%` }}
                                className="w-full bg-amber-500"
                              />
                            )}
                            {/* Segment: Invalid */}
                            {invalidPercent > 0 && (
                              <div
                                style={{ height: `${Math.max(invalidPercent, 4)}%` }}
                                className="w-full bg-rose-500"
                              />
                            )}
                            {/* Segment: Valid */}
                            {validPercent > 0 && (
                              <div
                                style={{ height: `${Math.max(validPercent, 4)}%` }}
                                className="w-full bg-emerald-500"
                              />
                            )}
                          </div>
                        ) : (
                          /* Zero count placeholder bar */
                          <div className="w-full h-1 bg-slate-200 rounded-full group-hover:bg-slate-300 transition-colors" />
                        )}
                      </div>

                      {/* X-Axis Date Label */}
                      <div className="pt-2 text-center select-none">
                        <span className="block text-[10px] font-semibold text-slate-700">
                          {day.dayOfWeek}
                        </span>
                        <span className="block text-[9px] text-slate-400">
                          {day.label.split(" ")[1]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500"></span>
                    <span>Valid ({validCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-rose-500"></span>
                    <span>Invalid ({invalidCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-500"></span>
                    <span>Risky ({riskyCount})</span>
                  </div>
                  {unknownCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-slate-400"></span>
                      <span>Unknown ({unknownCount})</span>
                    </div>
                  )}
                </div>

                <Link
                  href="/dashboard/email-verification/results"
                  className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
                >
                  <span>Filter in Results</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIST HEALTH */}
        {activeTab === "health" && (
          <div className="space-y-5">
            {/* Multi-segment Deliverability Health Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">
                  Deliverability Health Breakdown
                </span>
                <span className="font-bold text-indigo-600">
                  {validityRate}% Clean List Rate
                </span>
              </div>

              {/* Segmented bar */}
              <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {validCount > 0 && (
                  <div
                    style={{ width: `${(validCount / totalVerified) * 100}%` }}
                    className="bg-emerald-500 transition-all"
                    title={`Valid: ${validCount}`}
                  />
                )}
                {invalidCount > 0 && (
                  <div
                    style={{ width: `${(invalidCount / totalVerified) * 100}%` }}
                    className="bg-rose-500 transition-all"
                    title={`Invalid: ${invalidCount}`}
                  />
                )}
                {riskyCount > 0 && (
                  <div
                    style={{ width: `${(riskyCount / totalVerified) * 100}%` }}
                    className="bg-amber-500 transition-all"
                    title={`Risky: ${riskyCount}`}
                  />
                )}
                {unknownCount > 0 && (
                  <div
                    style={{ width: `${(unknownCount / totalVerified) * 100}%` }}
                    className="bg-slate-400 transition-all"
                    title={`Unknown: ${unknownCount}`}
                  />
                )}
              </div>
            </div>

            {/* Quality Category Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Valid Category */}
              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-900">
                      Deliverable & Safe
                    </h4>
                    <span className="text-xs font-extrabold text-emerald-700">
                      {validCount}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700/90 leading-tight">
                    Verified mailbox existence with active SMTP handshake. Zero bounce risk.
                  </p>
                </div>
              </div>

              {/* Invalid Category */}
              <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                  <XCircle className="h-4 w-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-rose-900">
                      Suppressed & Invalid
                    </h4>
                    <span className="text-xs font-extrabold text-rose-700">
                      {invalidCount}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700/90 leading-tight">
                    Mailbox not found or syntax error. Prevented from damaging your sender score.
                  </p>
                </div>
              </div>

              {/* Risky Category */}
              <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-900">
                      Risky / Catch-All
                    </h4>
                    <span className="text-xs font-extrabold text-amber-700">
                      {riskyCount}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700/90 leading-tight">
                    Domain accepts all mail or uses temporary disposable domains.
                  </p>
                </div>
              </div>

              {/* Quality Score Indicator */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">
                      Average Lead Quality
                    </h4>
                    <span className="text-xs font-extrabold text-indigo-600">
                      {averageScore !== null ? `${averageScore}/100` : "N/A"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Confidence score calculated across active mailbox audits.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ENGINE & RISK SIGNALS */}
        {activeTab === "engine" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  Single Verifies
                </span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {singleCount}
                </div>
                <span className="text-[10px] text-slate-500">
                  Live API checks
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  Bulk Batch Emails
                </span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {bulkCount}
                </div>
                <span className="text-[10px] text-slate-500">
                  File upload checks
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  Disposable Flagged
                </span>
                <div className="text-lg font-bold text-rose-600 mt-1">
                  {disposableCount}
                </div>
                <span className="text-[10px] text-slate-500">
                  Burner inboxes
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  Role-based Emails
                </span>
                <div className="text-lg font-bold text-amber-600 mt-1">
                  {roleBasedCount}
                </div>
                <span className="text-[10px] text-slate-500">
                  admin@, info@
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/60 text-xs text-blue-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  Automatic suppression is active: all {invalidCount} invalid emails are blocked from campaign sends.
                </span>
              </div>
              <Link
                href="/dashboard/email-verification/suppression"
                className="font-semibold text-blue-700 hover:text-blue-800 text-[11px] underline shrink-0 ml-2"
              >
                Suppression List
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer with Live Database Status */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-600">Database Status: Connected to Neon PostgreSQL</span>
        </div>
        <span className="font-semibold text-slate-800">
          {totalVerified.toLocaleString()} {totalVerified === 1 ? "record" : "records"} in workspace
        </span>
      </div>
    </div>
  );
}
