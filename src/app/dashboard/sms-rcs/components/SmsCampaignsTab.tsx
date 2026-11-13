"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Smartphone,
  Sparkles,
  Plus,
  Search,
  RotateCw,
  Edit2,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  FileText,
  Archive,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  X,
  Loader2,
  Check,
} from "lucide-react";

export interface SmsBroadcastItem {
  id: string;
  workspaceId: string;
  userId?: string | null;
  name: string;
  protocol: "SMS" | "RCS";
  status: "DRAFT" | "SCHEDULED" | "SENT" | "ARCHIVED";
  senderId: string;
  messageText: string;
  rcsCardTitle?: string | null;
  rcsActionLabel?: string | null;
  rcsActionUrl?: string | null;
  rcsMediaUrl?: string | null;
  rcsSuggestion?: string | null;
  audienceType: "ALL" | "LIST" | "TEST";
  listId?: string | null;
  testPhone?: string | null;
  encoding: "GSM-7" | "UCS-2";
  characterCount: number;
  segments: number;
  totalRecipients: number;
  totalSegments: number;
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
}

interface StatusCounts {
  all: number;
  draft: number;
  scheduled: number;
  sent: number;
  archived: number;
}

type StatusFilter = "ALL" | "DRAFT" | "SCHEDULED" | "SENT" | "ARCHIVED";
type ProtocolFilter = "ALL" | "SMS" | "RCS";

export function SmsCampaignsTab() {
  const router = useRouter();

  // State
  const [campaigns, setCampaigns] = useState<SmsBroadcastItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Status Tab Counts
  const [counts, setCounts] = useState<StatusCounts>({
    all: 0,
    draft: 0,
    scheduled: 0,
    sent: 0,
    archived: 0,
  });

  // Delete Draft Confirmation Modal State
  const [draftToDelete, setDraftToDelete] = useState<SmsBroadcastItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Toast Notification
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setNotice({ type, text });
    setTimeout(() => {
      setNotice(null);
    }, 4500);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch campaigns from server-side authenticated API
  const fetchCampaigns = useCallback(
    async (showRefreshSpinner = false) => {
      if (showRefreshSpinner) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        if (protocolFilter !== "ALL") params.set("protocol", protocolFilter);
        if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
        params.set("page", page.toString());
        params.set("limit", limit.toString());

        const res = await fetch(`/api/dashboard/sms-rcs/campaigns?${params.toString()}`);
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success) {
          if (res.status === 401) {
            setError("Your session has expired. Please sign in to view campaigns.");
          } else {
            setError(data?.error || "Failed to load SMS & RCS campaigns. Please try again.");
          }
          setCampaigns([]);
          return;
        }

        setCampaigns(data.broadcasts || []);
        if (data.pagination) {
          setTotal(data.pagination.total ?? 0);
          setTotalPages(data.pagination.totalPages ?? 1);
        }

        if (data.counts) {
          setCounts({
            all: data.counts.all ?? 0,
            draft: data.counts.draft ?? 0,
            scheduled: data.counts.scheduled ?? 0,
            sent: data.counts.sent ?? 0,
            archived: data.counts.archived ?? 0,
          });
        }
      } catch (err: any) {
        setError(err.message || "Network error loading campaigns.");
        setCampaigns([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [statusFilter, protocolFilter, debouncedSearch, page, limit]
  );

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Handle Draft Deletion
  const handleDeleteDraft = async () => {
    if (!draftToDelete) return;

    if (draftToDelete.status !== "DRAFT") {
      showToast("error", "Only draft campaigns can be deleted.");
      setDraftToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/dashboard/sms-rcs/campaigns/${draftToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        showToast("error", data?.error || "Failed to delete broadcast draft.");
        return;
      }

      showToast("success", `Draft "${draftToDelete.name}" deleted permanently.`);
      setDraftToDelete(null);
      // Refresh list to update database records and tab counts
      await fetchCampaigns();
    } catch {
      showToast("error", "Network connection error while deleting draft.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Status Filter Tabs Definition
  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: counts.all },
    { key: "DRAFT", label: "Drafts", count: counts.draft },
    { key: "SCHEDULED", label: "Scheduled", count: counts.scheduled },
    { key: "SENT", label: "Sent", count: counts.sent },
    { key: "ARCHIVED", label: "Archived", count: counts.archived },
  ];

  // Helper date formatters
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Helper status badge styles
  const renderStatusBadge = (status: SmsBroadcastItem["status"]) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Draft
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="h-3 w-3 text-sky-500" />
            Scheduled
          </span>
        );
      case "SENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="h-3 w-3 text-emerald-600" />
            Sent
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Archive className="h-3 w-3 text-slate-500" />
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Helper channel pill styles
  const renderChannelPill = (protocol: "SMS" | "RCS") => {
    if (protocol === "RCS") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
          <Sparkles className="h-3 w-3 text-indigo-500" />
          <span>RCS Card</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
        <Smartphone className="h-3 w-3 text-blue-600" />
        <span>SMS Text</span>
      </span>
    );
  };

  const isFiltered =
    statusFilter !== "ALL" || protocolFilter !== "ALL" || debouncedSearch.trim() !== "";

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : notice.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : notice.type === "error" ? (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-700 px-1 font-bold text-sm cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              SMS & RCS Broadcast Campaigns
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Live Database
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage text campaigns, edit message drafts, and review telecom segment estimations for your workspace.
          </p>
        </div>

        {/* Create Campaign action */}
        <Link
          href="/dashboard/sms-rcs/compose"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Create Campaign</span>
        </Link>
      </div>

      {/* Controls Bar: Tabs, Channel Filter, Search, and Refresh */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.key
                    ? "bg-slate-900 text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === tab.key
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search, Channel Filter & Refresh */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
            {/* Channel Protocol Filter */}
            <div className="relative shrink-0">
              <select
                value={protocolFilter}
                onChange={(e) => {
                  setProtocolFilter(e.target.value as ProtocolFilter);
                  setPage(1);
                }}
                className="pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Channels</option>
                <option value="SMS">SMS Only</option>
                <option value="RCS">RCS Only</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by campaign name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={() => fetchCampaigns(true)}
              disabled={isRefreshing || isLoading}
              title="Refresh Campaigns"
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shrink-0"
            >
              <RotateCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Active Filters Summary (if filtered) */}
        {isFiltered && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="font-medium">Active Filters:</span>
            {statusFilter !== "ALL" && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Status: {statusFilter}
              </span>
            )}
            {protocolFilter !== "ALL" && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Channel: {protocolFilter}
              </span>
            )}
            {debouncedSearch.trim() && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Search: &ldquo;{debouncedSearch.trim()}&rdquo;
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setProtocolFilter("ALL");
                setSearchQuery("");
                setPage(1);
              }}
              className="text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer ml-auto"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-6 text-center">
          <div className="h-10 w-10 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-rose-900">Unable to Load Campaigns</h3>
          <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={() => fetchCampaigns(false)}
            className="mt-4 px-4 py-1.5 text-xs font-semibold text-rose-800 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-800">
            Loading Campaigns from Database...
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Querying workspace broadcasts, status segments, and recipient quotas.
          </p>
        </div>
      )}

      {/* EMPTY STATE - NO CAMPAIGNS IN WORKSPACE */}
      {!isLoading && !error && campaigns.length === 0 && !isFiltered && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-inner">
            <Smartphone className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            No SMS or RCS Campaigns Yet
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            You haven&apos;t created any text broadcasts for this workspace. Use the Composer to draft standard SMS alerts or rich interactive RCS brand cards.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard/sms-rcs/compose"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Broadcast</span>
            </Link>
            <Link
              href="/dashboard/sms-rcs/templates"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <span>Explore SMS Templates</span>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto text-left">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-500" />
                GSM-7 Segments
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                Automatic calculation of telecom character limits and multipart concatenation.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                RCS Rich Media
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                Send interactive cards with banners, brand badges, and action buttons.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-emerald-500" />
                Audience Targeting
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                Target full contact lists or validate phone formats before broadcasting.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EMPTY STATE - NO RESULTS FOR CURRENT FILTERS */}
      {!isLoading && !error && campaigns.length === 0 && isFiltered && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center shadow-xs">
          <div className="h-12 w-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No Matching Campaigns</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            No broadcasts match the currently selected filters or search terms. Try refining your criteria or reset filters.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setProtocolFilter("ALL");
                setSearchQuery("");
                setPage(1);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
            <Link
              href="/dashboard/sms-rcs/compose"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Campaign</span>
            </Link>
          </div>
        </div>
      )}

      {/* RESPONSIVE DATA TABLE */}
      {!isLoading && !error && campaigns.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Campaign Name</th>
                  <th className="py-3.5 px-4">Channel</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Recipients</th>
                  <th className="py-3.5 px-4">Est. Segments</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((camp) => {
                  const isDraft = camp.status === "DRAFT";

                  return (
                    <tr
                      key={camp.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Campaign Name & Details */}
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 truncate">
                              {camp.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-slate-100 text-slate-600 shrink-0">
                              {camp.senderId}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                            {camp.protocol === "RCS" && camp.rcsCardTitle
                              ? `[RCS Card] ${camp.rcsCardTitle}`
                              : camp.messageText || "No message body"}
                          </p>
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderChannelPill(camp.protocol)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(camp.status)}
                      </td>

                      {/* Recipient Count */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-semibold">
                            {camp.totalRecipients.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {camp.audienceType === "TEST"
                              ? "(Test Phone)"
                              : camp.audienceType === "LIST"
                              ? "(List)"
                              : "(All)"}
                          </span>
                        </div>
                      </td>

                      {/* Message Segments */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col text-[11px]">
                          <span className="font-semibold text-slate-800">
                            {camp.totalSegments > 0
                              ? `${camp.totalSegments.toLocaleString()} total segs`
                              : `${camp.segments} seg / msg`}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {camp.characterCount} chars • {camp.encoding}
                          </span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                        {formatDate(camp.createdAt)}
                      </td>

                      {/* Last Updated Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                        {formatDateTime(camp.updatedAt)}
                      </td>

                      {/* Actions: ONLY draft records can be edited or deleted */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        {isDraft ? (
                          <div className="inline-flex items-center gap-1.5">
                            {/* Edit Draft */}
                            <button
                              type="button"
                              onClick={() => {
                                router.push(`/dashboard/sms-rcs/compose?draftId=${camp.id}`);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors cursor-pointer"
                              title="Open draft in composer"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>Edit</span>
                            </button>

                            {/* Delete Draft */}
                            <button
                              type="button"
                              onClick={() => setDraftToDelete(camp)}
                              className="inline-flex items-center gap-1 p-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Delete this draft"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 italic">
                            Non-editable
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {total === 0 ? 0 : (page - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(page * limit, total)}
              </span>{" "}
              of <span className="font-semibold text-slate-700">{total}</span> broadcasts
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-medium text-slate-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DRAFT MODAL */}
      {draftToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3
                  id="delete-dialog-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Delete Campaign Draft?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-800">
                    &ldquo;{draftToDelete.name}&rdquo;
                  </span>
                  ? This draft will be permanently removed from your workspace database and cannot be recovered.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDraftToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDraft}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Draft</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
