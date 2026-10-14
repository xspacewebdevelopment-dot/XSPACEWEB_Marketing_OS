"use client";

import { useEffect, useState, useCallback } from "react";
import { CampaignKPIs } from "./components/CampaignKPIs";
import { CampaignFilterBar } from "./components/CampaignFilterBar";
import { CampaignPerformanceChart } from "./components/CampaignPerformanceChart";
import { CampaignsTable } from "./components/CampaignsTable";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function CampaignsDashboardPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [kpis, setKpis] = useState<{
    totalCampaigns: number;
    emailsSubmitted: number;
    delivered: number;
    opens: number;
    clicks: number;
    bounces: number;
    tabs: {
      all: number;
      drafts: number;
      scheduled: number;
      sending: number;
      sent: number;
      failed: number;
      archived: number;
    };
  }>({
    totalCampaigns: 0,
    emailsSubmitted: 0,
    delivered: 0,
    opens: 0,
    clicks: 0,
    bounces: 0,
    tabs: {
      all: 0,
      drafts: 0,
      scheduled: 0,
      sending: 0,
      sent: 0,
      failed: 0,
      archived: 0,
    },
  });

  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotice = (type: "success" | "error", message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  const fetchCampaigns = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (currentTab !== "ALL") {
        if (currentTab === "ARCHIVED") {
          params.set("archived", "true");
        } else {
          params.set("status", currentTab);
        }
      }
      if (selectedType !== "ALL") params.set("type", selectedType);
      if (search.trim()) params.set("search", search.trim());
      params.set("page", page.toString());
      params.set("limit", "10");

      const res = await fetch(`/api/dashboard/email-marketing/campaigns?${params.toString()}`);
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        if (json?.error) {
          showNotice("error", json.error);
        }
        setCampaigns([]);
        return;
      }

      setCampaigns(json?.data || []);
      setPagination(json?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      if (json?.kpis) {
        setKpis({
          totalCampaigns: json.kpis.totalCampaigns ?? 0,
          emailsSubmitted: json.kpis.emailsSubmitted ?? 0,
          delivered: json.kpis.delivered ?? 0,
          opens: json.kpis.opens ?? 0,
          clicks: json.kpis.clicks ?? 0,
          bounces: json.kpis.bounces ?? 0,
          tabs: {
            all: json.kpis.tabs?.all ?? 0,
            drafts: json.kpis.tabs?.drafts ?? 0,
            scheduled: json.kpis.tabs?.scheduled ?? 0,
            sending: json.kpis.tabs?.sending ?? 0,
            sent: json.kpis.tabs?.sent ?? 0,
            failed: json.kpis.tabs?.failed ?? 0,
            archived: json.kpis.tabs?.archived ?? 0,
          },
        });
      }
    } catch (err: any) {
      console.warn("fetchCampaigns caught:", err);
      setCampaigns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentTab, selectedType, search, page]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Actions
  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/email-marketing/campaigns/${id}/duplicate`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        showNotice("success", "Campaign duplicated as a new draft.");
        fetchCampaigns();
      } else {
        showNotice("error", json.error || "Failed to duplicate campaign");
      }
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/email-marketing/campaigns/${id}/archive`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        showNotice("success", "Campaign moved to archive.");
        fetchCampaigns();
      } else {
        showNotice("error", json.error || "Failed to archive campaign");
      }
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this campaign?")) return;
    try {
      const res = await fetch(`/api/dashboard/email-marketing/campaigns/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok) {
        showNotice("success", "Campaign deleted permanently.");
        fetchCampaigns();
      } else {
        showNotice("error", json.error || "Failed to delete campaign");
      }
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  const handlePause = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/email-marketing/campaigns/${id}/pause`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        showNotice("success", "Campaign sending paused.");
        fetchCampaigns();
      } else {
        showNotice("error", json.error || "Failed to pause campaign");
      }
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  const handleResume = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/email-marketing/campaigns/${id}/resume`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        showNotice("success", "Campaign sending resumed.");
        fetchCampaigns();
      } else {
        showNotice("error", json.error || "Failed to resume campaign");
      }
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this campaign? Pending unsent emails will not be dispatched.")) return;
    try {
      const res = await fetch(`/api/dashboard/email-marketing/campaigns/${id}/cancel`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok) {
        showNotice("success", "Campaign cancelled.");
        fetchCampaigns();
      } else {
        showNotice("error", json.error || "Failed to cancel campaign");
      }
    } catch (err: any) {
      showNotice("error", err.message);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notice && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Email Campaigns
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              Core Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Build, test, schedule and dispatch high-converting email campaigns with durable Inngest batching and real-time suppression exclusion.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <CampaignKPIs kpis={kpis} loading={loading} />

      {/* Filter Bar with Tabs */}
      <CampaignFilterBar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setPage(1);
        }}
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        selectedType={selectedType}
        onTypeChange={(val) => {
          setSelectedType(val);
          setPage(1);
        }}
        tabCounts={kpis.tabs}
        onRefresh={fetchCampaigns}
        refreshing={refreshing}
      />

      {/* Performance Chart if campaigns exist */}
      {!loading && campaigns.length > 0 && (
        <CampaignPerformanceChart campaigns={campaigns} />
      )}

      {/* Campaigns Table */}
      <CampaignsTable
        campaigns={campaigns}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onPause={handlePause}
        onResume={handleResume}
        onCancel={handleCancel}
      />
    </div>
  );
}
