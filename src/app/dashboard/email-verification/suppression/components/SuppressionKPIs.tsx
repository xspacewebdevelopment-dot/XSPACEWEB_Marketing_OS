"use client";

import { ShieldBan, UserX, Bot, UserMinus, AlertOctagon, MailWarning } from "lucide-react";
import type { SuppressionStats } from "@/lib/types/suppression";

interface SuppressionKPIsProps {
  stats: SuppressionStats | null;
  loading: boolean;
}

export function SuppressionKPIs({ stats, loading }: SuppressionKPIsProps) {
  const cards = [
    {
      title: "Total Suppressed",
      value: stats?.totalSuppressed ?? 0,
      icon: ShieldBan,
      desc: "Guaranteed send-blocked addresses",
      color: "text-rose-600 bg-rose-50 border-rose-200",
      accent: "from-rose-500/10 to-transparent",
    },
    {
      title: "Manual Blocks",
      value: stats?.manualCount ?? 0,
      icon: UserX,
      desc: "Added by workspace team members",
      color: "text-blue-600 bg-blue-50 border-blue-200",
      accent: "from-blue-500/10 to-transparent",
    },
    {
      title: "Automated Triggers",
      value: stats?.autoCount ?? 0,
      icon: Bot,
      desc: "Registered via delivery events",
      color: "text-purple-600 bg-purple-50 border-purple-200",
      accent: "from-purple-500/10 to-transparent",
    },
    {
      title: "Unsubscribed",
      value: stats?.unsubscribedCount ?? 0,
      icon: UserMinus,
      desc: "Documented recipient opt-outs",
      color: "text-amber-600 bg-amber-50 border-amber-200",
      accent: "from-amber-500/10 to-transparent",
    },
    {
      title: "Hard Bounces",
      value: stats?.hardBouncedCount ?? 0,
      icon: AlertOctagon,
      desc: "Permanent mailbox delivery failures",
      color: "text-red-600 bg-red-50 border-red-200",
      accent: "from-red-500/10 to-transparent",
    },
    {
      title: "Spam Complaints",
      value: stats?.complaintCount ?? 0,
      icon: MailWarning,
      desc: "Inbox provider abuse complaints",
      color: "text-orange-600 bg-orange-50 border-orange-200",
      accent: "from-orange-500/10 to-transparent",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs relative overflow-hidden transition-all hover:shadow-md"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${c.accent} rounded-bl-full pointer-events-none`} />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">{c.title}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${c.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            {loading ? (
              <div className="h-7 w-16 bg-slate-100 animate-pulse rounded-md my-1" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {c.value.toLocaleString()}
              </div>
            )}
            <p className="text-[10px] text-slate-500 mt-1 truncate">{c.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
