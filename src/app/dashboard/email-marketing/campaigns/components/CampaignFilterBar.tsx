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
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs transition-colors"
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
            className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors"
            title="Refresh campaigns list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>

        {/* Create Campaign Action */}
        <Link
          href="/dashboard/email-marketing/campaigns/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-xs shadow-blue-500/20 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Campaign</span>
        </Link>
      </div>

      {/* Tabs list with counter badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium border border-transparent"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive
                    ? "bg-blue-200/60 text-blue-800"
                    : "bg-slate-100 text-slate-600"
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
