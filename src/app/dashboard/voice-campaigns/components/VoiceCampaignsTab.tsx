"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PhoneCall,
  Plus,
  Search,
  Filter,
  RotateCw,
  Copy,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Radio,
  FileText,
  Volume2,
} from "lucide-react";

export function VoiceCampaignsTab() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Status Counts
  const [counts, setCounts] = useState<{
    all: number;
    draft: number;
    ready_for_review: number;
    scheduled: number;
    queued: number;
    completed: number;
    cancelled: number;
    failed: number;
  }>({
    all: 0,
    draft: 0,
    ready_for_review: 0,
    scheduled: 0,
    queued: 0,
    completed: 0,
    cancelled: 0,
    failed: 0,
  });

  // Modal / Drawer State
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Toast Notice
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCampaigns = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/dashboard/voice-campaigns/campaigns?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load voice campaigns");
      }

      setCampaigns(data.campaigns || []);
      if (data.pagination) {
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch campaigns");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, debouncedSearch, page, limit]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Duplicate Campaign
  const handleDuplicate = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/dashboard/voice-campaigns/campaigns/${id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to duplicate campaign");
      }
      showToast("success", `Campaign duplicated as draft "${data.campaign.name}"`);
      await fetchCampaigns(true);
    } catch (err: any) {
      showToast("error", err.message || "Failed to duplicate");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cancel Scheduled Campaign
  const handleCancel = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/dashboard/voice-campaigns/campaigns/${id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel scheduled campaign");
      }
      showToast("info", "Scheduled campaign cancelled successfully.");
      await fetchCampaigns(true);
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(data.campaign);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to cancel");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Draft
  const handleDeleteDraft = async () => {
    if (!campaignToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/dashboard/voice-campaigns/campaigns/${campaignToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete campaign draft");
      }
      showToast("success", `Campaign draft "${campaignToDelete.name}" deleted.`);
      setCampaignToDelete(null);
      await fetchCampaigns(true);
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete draft");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="h-3 w-3 text-slate-500" />
            Draft
          </span>
        );
      case "READY_FOR_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Ready for Review
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Calendar className="h-3 w-3 text-amber-600" />
            Scheduled
          </span>
        );
      case "QUEUED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Queued
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : notice.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <span>{notice.message}</span>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-700 font-bold ml-4">
            ×
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Voice Campaigns</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, schedule, and review automated voice call campaigns with strict consent controls.
          </p>
        </div>

        <Link
          href="/dashboard/voice-campaigns/compose"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Create Campaign</span>
        </Link>
      </div>

      {/* Filter and Status Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { key: "ALL", label: "All Campaigns", count: counts.all },
              { key: "DRAFT", label: "Drafts", count: counts.draft },
              { key: "SCHEDULED", label: "Scheduled", count: counts.scheduled },
              { key: "QUEUED", label: "Queued", count: counts.queued },
              { key: "COMPLETED", label: "Completed", count: counts.completed },
              { key: "CANCELLED", label: "Cancelled", count: counts.cancelled },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.key
                    ? "bg-slate-900 text-white font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === tab.key ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box & Refresh */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => fetchCampaigns(true)}
              disabled={isRefreshing || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shrink-0"
              title="Refresh Campaigns"
            >
              <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading && (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Loading campaigns...
          </div>
        )}

        {!isLoading && campaigns.length === 0 && (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
              <PhoneCall className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No campaigns found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {statusFilter !== "ALL" || debouncedSearch
                ? "No campaigns match your active search or status filters."
                : "Create your first voice campaign to automate customer phone outreach."}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {(statusFilter !== "ALL" || debouncedSearch) && (
                <button
                  onClick={() => {
                    setStatusFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs"
                >
                  Clear Filters
                </button>
              )}
              <Link
                href="/dashboard/voice-campaigns/compose"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Create Campaign</span>
              </Link>
            </div>
          </div>
        )}

        {!isLoading && campaigns.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Audience</th>
                  <th className="py-3 px-4">Voice / Language</th>
                  <th className="py-3 px-4">Schedule / Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex flex-col">
                        <button
                          onClick={() => setSelectedCampaign(c)}
                          className="text-left font-semibold hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          {c.name}
                        </button>
                        {c.description && (
                          <span className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                            {c.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {c.purpose}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-mono">
                        <span className="font-semibold text-slate-900">{c.eligibleCount || 0}</span>
                        <span className="text-slate-400 text-[10px]"> / {c.totalRecipients || 0}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase">{c.audienceType}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="capitalize">{c.voiceId}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({c.language})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {c.scheduledAt ? (
                        <div className="text-amber-700 font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(c.scheduledAt)}</span>
                        </div>
                      ) : (
                        formatDate(c.createdAt)
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details Drawer/Modal */}
                        <button
                          onClick={() => setSelectedCampaign(c)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Edit Draft */}
                        {(c.status === "DRAFT" || c.status === "READY_FOR_REVIEW") && (
                          <Link
                            href={`/dashboard/voice-campaigns/compose?id=${c.id}`}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit Campaign"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Link>
                        )}

                        {/* Cancel Scheduled */}
                        {(c.status === "SCHEDULED" || c.status === "READY_FOR_REVIEW" || c.status === "QUEUED") && (
                          <button
                            onClick={() => handleCancel(c.id)}
                            disabled={actionLoadingId === c.id}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                            title="Cancel Scheduled Run"
                          >
                            Cancel
                          </button>
                        )}

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(c.id)}
                          disabled={actionLoadingId === c.id}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                          title="Duplicate as New Draft"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Draft */}
                        {c.status === "DRAFT" && (
                          <button
                            onClick={() => setCampaignToDelete(c)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Draft"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page <span className="font-semibold text-slate-800">{page}</span> of{" "}
              <span className="font-semibold text-slate-800">{totalPages}</span> ({total} campaigns)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Details Drawer/Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedCampaign.name}</h3>
                  {getStatusBadge(selectedCampaign.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID: <span className="font-mono text-[10px]">{selectedCampaign.id}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Campaign Properties */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Purpose</span>
                <span className="font-semibold text-slate-800">{selectedCampaign.purpose}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Audience Mode</span>
                <span className="font-semibold text-slate-800 uppercase">{selectedCampaign.audienceType}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Eligible Recipients</span>
                <span className="font-semibold text-emerald-700 font-mono">
                  {selectedCampaign.eligibleCount || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Voice Timbre</span>
                <span className="font-semibold text-slate-800 capitalize">{selectedCampaign.voiceId}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Language</span>
                <span className="font-semibold text-slate-800 font-mono">{selectedCampaign.language}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Speed / Pitch</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {selectedCampaign.speed}x / {selectedCampaign.pitch}x
                </span>
              </div>
            </div>

            {/* Script Text */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">
                Rendered Voice Script
              </span>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedCampaign.scriptText}
              </div>
            </div>

            {/* Telemetry note */}
            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Internal Mode: All recipients, status events, and dry-run jobs remain safe inside your database. No actual calls are placed.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedCampaign(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
              {(selectedCampaign.status === "DRAFT" || selectedCampaign.status === "READY_FOR_REVIEW") && (
                <Link
                  href={`/dashboard/voice-campaigns/compose?id=${selectedCampaign.id}`}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Edit in Composer
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Campaign Draft?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to permanently delete &ldquo;{campaignToDelete.name}&rdquo;?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
              This action cannot be undone. All configured audience eligibility snapshots and draft script parameters will be erased.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCampaignToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDraft}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
