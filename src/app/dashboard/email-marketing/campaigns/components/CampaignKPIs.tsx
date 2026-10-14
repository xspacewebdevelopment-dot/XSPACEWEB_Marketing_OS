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
      desc: "All active, scheduled & sent campaigns",
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Emails Submitted",
      value: kpis?.emailsSubmitted ?? 0,
      icon: MailCheck,
      desc: "Accepted by Resend API dispatch",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Delivered (Confirmed)",
      value: kpis?.delivered ?? 0,
      icon: CheckCircle2,
      desc: kpis?.delivered === 0 ? "Awaiting webhook event tracking" : "Confirmed recipient delivery events",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Opens (Tracked)",
      value: kpis?.opens ?? 0,
      icon: Eye,
      desc: kpis?.opens === 0 ? "Tracking events ingested via provider" : "Verified recipient open events",
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Clicks (Tracked)",
      value: kpis?.clicks ?? 0,
      icon: MousePointerClick,
      desc: kpis?.clicks === 0 ? "Unique link interaction events" : "Verified link click interactions",
      color: "text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/20",
    },
    {
      title: "Bounces (Tracked)",
      value: kpis?.bounces ?? 0,
      icon: AlertOctagon,
      desc: "Hard/soft bounces recorded",
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 select-none">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-[#09192d]/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-400 truncate">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg border ${card.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${card.color}`} />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-white tracking-tight">
                {loading ? (
                  <div className="h-6 w-12 bg-slate-800/80 animate-pulse rounded" />
                ) : (
                  card.value.toLocaleString()
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {card.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
