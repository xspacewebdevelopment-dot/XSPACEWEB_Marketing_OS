"use client";

import { Users, CheckCircle2, XCircle, AlertTriangle, ShieldBan, MailCheck } from "lucide-react";
import type { ContactStats } from "@/lib/types/contacts";

interface ContactsKPIsProps {
  stats: ContactStats | null;
  loading: boolean;
}

export function ContactsKPIs({ stats, loading }: ContactsKPIsProps) {
  const cards = [
    {
      title: "Total Contacts",
      value: stats?.totalContacts ?? 0,
      icon: Users,
      desc: "Workspace subscriber repository",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50 border-blue-200",
    },
    {
      title: "Valid Leads",
      value: stats?.validCount ?? 0,
      icon: CheckCircle2,
      desc: "Power-verified deliverable mailboxes",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-200",
    },
    {
      title: "Invalid Leads",
      value: stats?.invalidCount ?? 0,
      icon: XCircle,
      desc: "Dead & non-existent addresses",
      iconColor: "text-rose-600",
      iconBg: "bg-rose-50 border-rose-200",
    },
    {
      title: "Risky Leads",
      value: stats?.riskyCount ?? 0,
      icon: AlertTriangle,
      desc: "Disposable, catch-all & role accounts",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50 border-amber-200",
    },
    {
      title: "Suppressed Leads",
      value: stats?.suppressedCount ?? 0,
      icon: ShieldBan,
      desc: "Active campaign exclusion blocks",
      iconColor: "text-red-600",
      iconBg: "bg-red-50 border-red-200",
    },
    {
      title: "Opted-In Subscribed",
      value: stats?.subscribedCount ?? 0,
      icon: MailCheck,
      desc: "Active marketing consent documented",
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50 border-indigo-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs transition-all hover:shadow-md hover:border-slate-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{c.title}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${c.iconBg} ${c.iconColor}`}>
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
            <p className="text-[10px] text-slate-400 mt-1 truncate">{c.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
