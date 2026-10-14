"use client";

import { Send, CheckCircle2, Eye, MousePointerClick, AlertOctagon, MailCheck } from "lucide-react";

interface CampaignKPIsProps {
  kpis: {
    totalCampaigns: number;
    emailsSubmitted: number;
    delivered: number;
    opens: number;
    clicks: number;
    bounces: number;
  } | null;
  loading: boolean;
}

export function CampaignKPIs({ kpis, loading }: CampaignKPIsProps) {
  const cards = [
    {
      title: "Total Campaigns",
      value: kpis?.totalCampaigns ?? 0,
      icon: Send,
      desc: "All active, scheduled & sent",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50 border-blue-100",
    },
    {
      title: "Emails Submitted",
      value: kpis?.emailsSubmitted ?? 0,
      icon: MailCheck,
      desc: "Accepted by Resend API",
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50 border-indigo-100",
    },
    {
      title: "Delivered (Confirmed)",
      value: kpis?.delivered ?? 0,
      icon: CheckCircle2,
      desc: kpis?.delivered === 0 ? "Awaiting webhook events" : "Confirmed recipient deliveries",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-100",
    },
    {
      title: "Opens (Tracked)",
      value: kpis?.opens ?? 0,
      icon: Eye,
      desc: kpis?.opens === 0 ? "Ingested via provider" : "Verified recipient opens",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50 border-purple-100",
    },
    {
      title: "Clicks (Tracked)",
      value: kpis?.clicks ?? 0,
      icon: MousePointerClick,
      desc: kpis?.clicks === 0 ? "Unique link interactions" : "Verified link clicks",
      iconColor: "text-teal-600",
      iconBg: "bg-teal-50 border-teal-100",
    },
    {
      title: "Bounces (Tracked)",
      value: kpis?.bounces ?? 0,
      icon: AlertOctagon,
      desc: "Hard/soft bounces recorded",
      iconColor: "text-rose-600",
      iconBg: "bg-rose-50 border-rose-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 select-none">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 truncate">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg border ${card.iconBg}`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? (
                  <div className="h-7 w-12 bg-slate-100 animate-pulse rounded" />
                ) : (
                  card.value.toLocaleString()
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-1">
                {card.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
