"use client";

import { Search, Plus, Filter, RefreshCw } from "lucide-react";
import Link from "next/link";
import { CAMPAIGN_TYPE_LABELS, CampaignType } from "@/lib/types/campaigns";

interface CampaignFilterBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  selectedType: string;
  onTypeChange: (val: string) => void;
  tabCounts: {
    all: number;
    drafts: number;
    scheduled: number;
    sending: number;
    sent: number;
    failed: number;
    archived: number;
  };
  onRefresh: () => void;
  refreshing: boolean;
}

export function CampaignFilterBar({
  currentTab,
  onTabChange,
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  tabCounts,
  onRefresh,
  refreshing,
}: CampaignFilterBarProps) {
  const tabs = [
    { id: "ALL", label: "All Campaigns", count: tabCounts.all },
    { id: "DRAFT", label: "Drafts", count: tabCounts.drafts },
    { id: "SCHEDULED", label: "Scheduled", count: tabCounts.scheduled },
    { id: "SENDING", label: "Sending", count: tabCounts.sending },
    { id: "COMPLETED", label: "Sent", count: tabCounts.sent },
    { id: "FAILED", label: "Failed", count: tabCounts.failed },
    { id: "ARCHIVED", label: "Archived", count: tabCounts.archived },
  ];

  return (
    <div className="space-y-4 select-none">
      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search & Type filter */}
        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search campaigns by name, subject, or sender..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#09192d]/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="bg-[#09192d]/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-blue-500 transition-colors"
            >
              <option value="ALL">All Types</option>
              {Object.entries(CAMPAIGN_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg border border-slate-800 bg-[#09192d]/80 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Refresh campaigns list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>

        {/* Create Campaign Action */}
        <Link
          href="/dashboard/email-marketing/campaigns/create"
          className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-all shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Campaign</span>
        </Link>
      </div>

      {/* Tabs list with counter badges */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-800/80 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
