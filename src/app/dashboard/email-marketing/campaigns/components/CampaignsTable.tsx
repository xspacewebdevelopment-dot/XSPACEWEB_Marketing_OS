"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MoreVertical,
  Play,
  Pause,
  XCircle,
  Copy,
  Archive,
  Trash2,
  BarChart2,
  Activity,
  Edit2,
  Calendar,
  Send,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  CAMPAIGN_TYPE_LABELS,
  CAMPAIGN_STATUS_BADGES,
  CampaignType,
  CampaignStatus,
} from "@/lib/types/campaigns";

interface CampaignItem {
  id: string;
  name: string;
  description?: string | null;
  type: CampaignType;
  status: CampaignStatus;
  fromName: string;
  fromEmail: string;
  subject: string;
  totalRecipients: number;
  submittedCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  isArchived: boolean;
}

interface CampaignsTableProps {
  campaigns: CampaignItem[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onDuplicate: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}

export function CampaignsTable({
  campaigns,
  loading,
  pagination,
  onPageChange,
  onDuplicate,
  onArchive,
  onDelete,
  onPause,
  onResume,
  onCancel,
}: CampaignsTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const handleAction = async (action: () => Promise<void>, campaignId: string) => {
    try {
      setActionInProgress(campaignId);
      setActiveMenuId(null);
      await action();
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#09192d]/50 p-12 text-center">
        <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400 font-medium">Loading campaign records...</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#09192d]/50 p-12 text-center space-y-3">
        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <Send className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-white">No campaigns found</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No email campaigns match your current filters. Create a new campaign to begin reaching your audience.
        </p>
        <Link
          href="/dashboard/email-marketing/campaigns/create"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-colors"
        >
          Create First Campaign
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#09192d]/60 overflow-hidden select-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-[#0a1829]/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Campaign & Subject</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Recipients</th>
              <th className="py-3 px-3 text-right">Submitted</th>
              <th className="py-3 px-3 text-right">Delivered</th>
              <th className="py-3 px-3 text-right">Open Rate</th>
              <th className="py-3 px-3 text-right">Click Rate</th>
              <th className="py-3 px-4">Timing</th>
              <th className="py-3 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {campaigns.map((camp) => {
              const badge = CAMPAIGN_STATUS_BADGES[camp.status] || {
                label: camp.status,
                color: "text-slate-300",
                bg: "bg-slate-800",
                border: "border-slate-700",
              };

              const deliveryRate =
                camp.submittedCount > 0
                  ? ((camp.deliveredCount / camp.submittedCount) * 100).toFixed(1) + "%"
                  : "—";

              const openRate =
                camp.deliveredCount > 0
                  ? ((camp.openedCount / camp.deliveredCount) * 100).toFixed(1) + "%"
                  : camp.submittedCount > 0 && camp.openedCount > 0
                  ? ((camp.openedCount / camp.submittedCount) * 100).toFixed(1) + "%"
                  : "—";

              const clickRate =
                camp.openedCount > 0
                  ? ((camp.clickedCount / camp.openedCount) * 100).toFixed(1) + "%"
                  : "—";

              const isBusy = actionInProgress === camp.id;

              return (
                <tr
                  key={camp.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  {/* Name & Subject */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex flex-col">
                      <Link
                        href={
                          camp.status === "DRAFT"
                            ? `/dashboard/email-marketing/campaigns/create?id=${camp.id}`
                            : `/dashboard/email-marketing/campaigns/${camp.id}`
                        }
                        className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate"
                      >
                        {camp.name}
                      </Link>
                      <span className="text-[11px] text-slate-400 truncate mt-0.5" title={camp.subject}>
                        {camp.subject}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        From: {camp.fromName} &lt;{camp.fromEmail}&gt;
                      </span>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="text-slate-300 font-medium">
                      {CAMPAIGN_TYPE_LABELS[camp.type] || camp.type}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.color} ${badge.border}`}
                    >
                      {camp.status === "SENDING" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                      )}
                      {badge.label}
                    </span>
                  </td>

                  {/* Recipients */}
                  <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                    {camp.totalRecipients.toLocaleString()}
                  </td>

                  {/* Submitted */}
                  <td className="py-3.5 px-3 text-right font-mono text-blue-400 font-medium">
                    {camp.submittedCount.toLocaleString()}
                  </td>

                  {/* Delivered */}
                  <td className="py-3.5 px-3 text-right font-mono">
                    {camp.deliveredCount > 0 ? (
                      <span className="text-emerald-400">{camp.deliveredCount.toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Open Rate */}
                  <td className="py-3.5 px-3 text-right font-mono">
                    <span className={openRate !== "—" ? "text-purple-400 font-medium" : "text-slate-400"}>
                      {openRate}
                    </span>
                  </td>

                  {/* Click Rate */}
                  <td className="py-3.5 px-3 text-right font-mono">
                    <span className={clickRate !== "—" ? "text-teal-400 font-medium" : "text-slate-400"}>
                      {clickRate}
                    </span>
                  </td>

                  {/* Timing */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                    {camp.completedAt ? (
                      <span>Sent {new Date(camp.completedAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                    ) : camp.scheduledAt ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(camp.scheduledAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    ) : (
                      <span>Created {new Date(camp.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                    )}
                  </td>

                  {/* Actions Dropdown */}
                  <td className="py-3.5 px-3 text-center relative whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {/* Primary Quick Action */}
                      {camp.status === "DRAFT" ? (
                        <Link
                          href={`/dashboard/email-marketing/campaigns/create?id=${camp.id}`}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 border border-slate-700/60"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/email-marketing/campaigns/${camp.id}`}
                          className="px-2 py-1 rounded bg-blue-950/40 hover:bg-blue-900/40 text-blue-300 text-[11px] font-medium flex items-center gap-1 border border-blue-800/40"
                        >
                          <Activity className="h-3 w-3" />
                          <span>Monitor</span>
                        </Link>
                      )}

                      {/* Dropdown Menu Toggle */}
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === camp.id ? null : camp.id)}
                        disabled={isBusy}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>

                      {/* Context Menu Popup */}
                      {activeMenuId === camp.id && (
                        <div
                          className="absolute right-3 top-10 w-44 bg-[#0a1829] border border-slate-700 rounded-lg shadow-xl z-30 py-1 text-left text-xs divide-y divide-slate-800/80"
                          onMouseLeave={() => setActiveMenuId(null)}
                        >
                          <div className="py-1">
                            {camp.status === "DRAFT" && (
                              <Link
                                href={`/dashboard/email-marketing/campaigns/create?id=${camp.id}`}
                                className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-200 hover:bg-slate-800/80 transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-blue-400" />
                                <span>Continue Editing</span>
                              </Link>
                            )}

                            <Link
                              href={`/dashboard/email-marketing/campaigns/${camp.id}`}
                              className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-200 hover:bg-slate-800/80 transition-colors"
                            >
                              <Activity className="h-3.5 w-3.5 text-indigo-400" />
                              <span>Live Monitor</span>
                            </Link>

                            <Link
                              href={`/dashboard/email-marketing/campaigns/${camp.id}/report`}
                              className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-200 hover:bg-slate-800/80 transition-colors"
                            >
                              <BarChart2 className="h-3.5 w-3.5 text-emerald-400" />
                              <span>View Report</span>
                            </Link>
                          </div>

                          {/* State Actions */}
                          <div className="py-1">
                            {camp.status === "SENDING" && (
                              <button
                                onClick={() => handleAction(() => onPause(camp.id), camp.id)}
                                className="w-full px-3 py-1.5 flex items-center gap-2 text-orange-300 hover:bg-slate-800/80 transition-colors text-left"
                              >
                                <Pause className="h-3.5 w-3.5 text-orange-400" />
                                <span>Pause Sending</span>
                              </button>
                            )}

                            {camp.status === "PAUSED" && (
                              <button
                                onClick={() => handleAction(() => onResume(camp.id), camp.id)}
                                className="w-full px-3 py-1.5 flex items-center gap-2 text-emerald-300 hover:bg-slate-800/80 transition-colors text-left"
                              >
                                <Play className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Resume Sending</span>
                              </button>
                            )}

                            {(camp.status === "SCHEDULED" ||
                              camp.status === "SENDING" ||
                              camp.status === "PAUSED") && (
                              <button
                                onClick={() => handleAction(() => onCancel(camp.id), camp.id)}
                                className="w-full px-3 py-1.5 flex items-center gap-2 text-rose-300 hover:bg-slate-800/80 transition-colors text-left"
                              >
                                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                                <span>Cancel Campaign</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleAction(() => onDuplicate(camp.id), camp.id)}
                              className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-300 hover:bg-slate-800/80 transition-colors text-left"
                            >
                              <Copy className="h-3.5 w-3.5 text-slate-400" />
                              <span>Duplicate Campaign</span>
                            </button>

                            {!camp.isArchived && camp.status === "COMPLETED" && (
                              <button
                                onClick={() => handleAction(() => onArchive(camp.id), camp.id)}
                                className="w-full px-3 py-1.5 flex items-center gap-2 text-slate-300 hover:bg-slate-800/80 transition-colors text-left"
                              >
                                <Archive className="h-3.5 w-3.5 text-slate-400" />
                                <span>Archive</span>
                              </button>
                            )}
                          </div>

                          {/* Delete option for Drafts or Cancelled */}
                          {(camp.status === "DRAFT" ||
                            camp.status === "CANCELLED" ||
                            camp.isArchived) && (
                            <div className="py-1">
                              <button
                                onClick={() => handleAction(() => onDelete(camp.id), camp.id)}
                                className="w-full px-3 py-1.5 flex items-center gap-2 text-rose-400 hover:bg-rose-950/30 transition-colors text-left"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Campaign</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-[#0a1829]/60">
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} campaigns
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-slate-300"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-mono text-slate-200">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-slate-300"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
