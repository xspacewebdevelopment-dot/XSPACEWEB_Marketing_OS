"use client";

import { BarChart3, Activity, PieChart, Layers } from "lucide-react";

interface CampaignPerformanceChartProps {
  campaigns: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    totalRecipients: number;
    submittedCount: number;
    deliveredCount: number;
    openedCount: number;
    clickedCount: number;
    createdAt: string;
  }>;
}

export function CampaignPerformanceChart({ campaigns }: CampaignPerformanceChartProps) {
  if (campaigns.length === 0) return null;

  // Real aggregate calculations across current campaigns
  const totalSubmitted = campaigns.reduce((acc, c) => acc + c.submittedCount, 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + c.deliveredCount, 0);
  const totalOpens = campaigns.reduce((acc, c) => acc + c.openedCount, 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + c.clickedCount, 0);

  // Group by campaign type
  const typeCounts: Record<string, number> = {};
  for (const c of campaigns) {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  }

  // Calculate real rates based only on submitted emails
  const deliveryRate = totalSubmitted > 0 ? ((totalDelivered / totalSubmitted) * 100).toFixed(1) : "0.0";
  const openRate = totalDelivered > 0 ? ((totalOpens / totalDelivered) * 100).toFixed(1) : "0.0";
  const clickRate = totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) : "0.0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
      {/* 1. Real Funnel Performance Overview */}
      <div className="md:col-span-2 p-4 rounded-xl bg-[#09192d]/60 border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Submission & Engagement Funnel
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">Strictly Stored Records</span>
        </div>

        <div className="space-y-3">
          {/* Funnel Step 1: Emails Submitted */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Total Emails Submitted via Resend</span>
              <span className="font-semibold text-white">{totalSubmitted.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: totalSubmitted > 0 ? "100%" : "0%" }}
              />
            </div>
          </div>

          {/* Funnel Step 2: Confirmed Deliveries */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Confirmed Deliveries (Webhooks)</span>
              <span className="font-semibold text-emerald-400">
                {totalDelivered.toLocaleString()} ({deliveryRate}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: totalSubmitted > 0 ? `${Math.min(100, (totalDelivered / totalSubmitted) * 100)}%` : "0%",
                }}
              />
            </div>
          </div>

          {/* Funnel Step 3: Verified Opens */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Verified Opens</span>
              <span className="font-semibold text-purple-400">
                {totalOpens.toLocaleString()} ({openRate}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{
                  width: totalDelivered > 0 ? `${Math.min(100, (totalOpens / totalDelivered) * 100)}%` : "0%",
                }}
              />
            </div>
          </div>

          {/* Funnel Step 4: Link Clicks */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Link Clicks</span>
              <span className="font-semibold text-teal-400">
                {totalClicks.toLocaleString()} ({clickRate}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all"
                style={{
                  width: totalOpens > 0 ? `${Math.min(100, (totalClicks / totalOpens) * 100)}%` : "0%",
                }}
              />
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
          * NexaReach OS policy: Delivery, open and click metrics strictly mirror confirmed event callbacks. Unrecorded engagement is never fabricated or simulated.
        </div>
      </div>

      {/* 2. Campaign Distribution by Type */}
      <div className="p-4 rounded-xl bg-[#09192d]/60 border border-slate-800/80 space-y-4 flex flex-col justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Campaigns By Type
          </h3>
        </div>

        <div className="space-y-2.5 flex-1 justify-center flex flex-col">
          {Object.entries(typeCounts).map(([type, count]) => {
            const pct = Math.round((count / campaigns.length) * 100);
            return (
              <div key={type} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {type.replace("_", " ")}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Active In Workspace</span>
          <span className="font-bold text-white">{campaigns.length} total</span>
        </div>
      </div>
    </div>
  );
}
