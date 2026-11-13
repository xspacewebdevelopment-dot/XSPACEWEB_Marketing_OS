"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Sparkles,
  Smartphone,
  Plus,
  Search,
  RotateCw,
  Edit2,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  FolderDown,
  X,
  Loader2,
  Tag,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Send,
  Image as ImageIcon,
} from "lucide-react";
import { calculateSmsEncoding } from "@/lib/sms/gsm";

export interface SmsTemplateItem {
  id: string;
  workspaceId: string;
  userId?: string | null;
  name: string;
  description?: string | null;
  protocol: "SMS" | "RCS";
  category: "TRANSACTIONAL" | "PROMOTIONAL" | "ALERTS" | "MARKETING" | "GENERAL";
  messageText: string;
  rcsCardTitle?: string | null;
  rcsMediaUrl?: string | null;
  rcsActionLabel?: string | null;
  rcsActionUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
}

const PRESET_BANNERS = [
  {
    name: "Gradient Blue",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Product Launch",
    url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Special Invitation",
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80",
  },
];

const VARIABLE_TAGS = [
  "{{firstName}}",
  "{{lastName}}",
  "{{company}}",
  "{{otpCode}}",
  "{{time}}",
  "{{orderId}}",
  "{{trackingUrl}}",
  "{{promoCode}}",
  "{{optOutUrl}}",
];

export default function SmsTemplatesPage() {
  const router = useRouter();

  // State: Templates Data
  const [templates, setTemplates] = useState<SmsTemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [protocolFilter, setProtocolFilter] = useState<"ALL" | "SMS" | "RCS">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Counts
  const [counts, setCounts] = useState<{ all: number; sms: number; rcs: number }>({
    all: 0,
    sms: 0,
    rcs: 0,
  });

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplateItem | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<SmsTemplateItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAddingStarters, setIsAddingStarters] = useState<boolean>(false);

  // Form State for Create/Edit Modal
  const [formName, setFormName] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formProtocol, setFormProtocol] = useState<"SMS" | "RCS">("SMS");
  const [formCategory, setFormCategory] = useState<string>("GENERAL");
  const [formMessageText, setFormMessageText] = useState<string>("");
  const [formRcsCardTitle, setFormRcsCardTitle] = useState<string>("");
  const [formRcsActionLabel, setFormRcsActionLabel] = useState<string>("");
  const [formRcsActionUrl, setFormRcsActionUrl] = useState<string>("");
  const [formRcsMediaUrl, setFormRcsMediaUrl] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

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

  // Fetch templates from API
  const fetchTemplates = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (protocolFilter !== "ALL") params.set("protocol", protocolFilter);
        if (categoryFilter !== "ALL") params.set("category", categoryFilter);
        if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
        params.set("page", page.toString());
        params.set("limit", limit.toString());

        const res = await fetch(`/api/dashboard/sms-rcs/templates?${params.toString()}`);
        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success) {
          if (res.status === 401) {
            setError("Your session has expired. Please sign in to view templates.");
          } else {
            setError(data?.error || "Failed to load templates.");
          }
          setTemplates([]);
          return;
        }

        setTemplates(data.templates || []);
        if (data.pagination) {
          setTotal(data.pagination.total ?? 0);
          setTotalPages(data.pagination.totalPages ?? 1);
        }
        if (data.counts) {
          setCounts({
            all: data.counts.all ?? 0,
            sms: data.counts.sms ?? 0,
            rcs: data.counts.rcs ?? 0,
          });
        }
      } catch (err: any) {
        setError(err.message || "Network error loading templates.");
        setTemplates([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [protocolFilter, categoryFilter, debouncedSearch, page, limit]
  );

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormName("");
    setFormDescription("");
    setFormProtocol("SMS");
    setFormCategory("GENERAL");
    setFormMessageText("");
    setFormRcsCardTitle("");
    setFormRcsActionLabel("");
    setFormRcsActionUrl("");
    setFormRcsMediaUrl("");
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (tpl: SmsTemplateItem) => {
    setEditingTemplate(tpl);
    setFormName(tpl.name);
    setFormDescription(tpl.description || "");
    setFormProtocol(tpl.protocol);
    setFormCategory(tpl.category);
    setFormMessageText(tpl.messageText);
    setFormRcsCardTitle(tpl.rcsCardTitle || "");
    setFormRcsActionLabel(tpl.rcsActionLabel || "");
    setFormRcsActionUrl(tpl.rcsActionUrl || "");
    setFormRcsMediaUrl(tpl.rcsMediaUrl || "");
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  // Submit Create or Edit Form
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError("Template name is required.");
      return;
    }
    if (!formMessageText.trim()) {
      setFormError("Message body text is required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        protocol: formProtocol,
        category: formCategory,
        messageText: formMessageText.trim(),
        rcsCardTitle: formProtocol === "RCS" ? formRcsCardTitle.trim() || null : null,
        rcsActionLabel: formProtocol === "RCS" ? formRcsActionLabel.trim() || null : null,
        rcsActionUrl: formProtocol === "RCS" ? formRcsActionUrl.trim() || null : null,
        rcsMediaUrl: formProtocol === "RCS" ? formRcsMediaUrl.trim() || null : null,
      };

      const url = editingTemplate
        ? `/api/dashboard/sms-rcs/templates/${editingTemplate.id}`
        : `/api/dashboard/sms-rcs/templates`;
      const method = editingTemplate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setFormError(data?.error || "Failed to save template.");
        return;
      }

      showToast(
        "success",
        editingTemplate
          ? `Template "${formName}" updated successfully.`
          : `Template "${formName}" created successfully.`
      );
      setIsCreateModalOpen(false);
      await fetchTemplates();
    } catch {
      setFormError("Network error while saving template.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Template
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/dashboard/sms-rcs/templates/${templateToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        showToast("error", data?.error || "Failed to delete template.");
        return;
      }

      showToast("success", `Template "${templateToDelete.name}" deleted permanently.`);
      setTemplateToDelete(null);
      await fetchTemplates();
    } catch {
      showToast("error", "Network error while deleting template.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Explicit Opt-in: Add Starter Presets
  const handleAddStarterTemplates = async () => {
    setIsAddingStarters(true);
    try {
      const res = await fetch(`/api/dashboard/sms-rcs/templates/starters`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        showToast("error", data?.error || "Failed to add starter templates.");
        return;
      }

      showToast("success", `Added ${data.count} curated starter templates to your workspace.`);
      await fetchTemplates();
    } catch {
      showToast("error", "Network error while adding starter templates.");
    } finally {
      setIsAddingStarters(false);
    }
  };

  // Insert Variable helper in textarea
  const insertVariable = (tag: string) => {
    setFormMessageText((prev) => `${prev} ${tag}`.trimStart());
  };

  // Helper date formatter
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

  const isFiltered =
    protocolFilter !== "ALL" || categoryFilter !== "ALL" || debouncedSearch.trim() !== "";

  // Live GSM character calculation for current form
  const formEncoding = useMemo(() => {
    return calculateSmsEncoding(formMessageText);
  }, [formMessageText]);

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
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                SMS & RCS Message Templates
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Workspace Presets
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Reusable standard SMS text formats and rich interactive RCS brand cards for your workspace.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleAddStarterTemplates}
            disabled={isAddingStarters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Add starter templates to workspace"
          >
            {isAddingStarters ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
            ) : (
              <FolderDown className="h-3.5 w-3.5 text-blue-600" />
            )}
            <span>Add Starter Presets</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Transparency / Compliance Notice Banner */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white border border-slate-200 text-amber-600 shrink-0 mt-0.5 shadow-2xs">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">
              Internal Workspace Templates (No Provider Approval Claimed)
            </span>
            <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Internal Classification
            </span>
          </div>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Templates saved here are internal workspace blueprints stored in your database for fast message composition and brand consistency. Categories (Transactional, Promotional, Alerts, etc.) are internal classification tags only. Saved templates are <strong>not automatically registered, compliant, or approved</strong> by mobile carriers, 10DLC registries, or RCS Business Messaging providers.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Channel Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {(
              [
                { key: "ALL", label: "All Templates", count: counts.all },
                { key: "SMS", label: "SMS Text", count: counts.sms },
                { key: "RCS", label: "RCS Rich Cards", count: counts.rcs },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setProtocolFilter(tab.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  protocolFilter === tab.key
                    ? "bg-slate-900 text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    protocolFilter === tab.key
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Category Filter, Search & Refresh */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
            {/* Category Dropdown */}
            <div className="relative shrink-0">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="TRANSACTIONAL">Transactional</option>
                <option value="PROMOTIONAL">Promotional</option>
                <option value="ALERTS">Alerts</option>
                <option value="MARKETING">Marketing</option>
                <option value="GENERAL">General</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates..."
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
              onClick={() => fetchTemplates(true)}
              disabled={isRefreshing || isLoading}
              title="Refresh Templates"
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shrink-0"
            >
              <RotateCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {isFiltered && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="font-medium">Active Filters:</span>
            {protocolFilter !== "ALL" && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Channel: {protocolFilter}
              </span>
            )}
            {categoryFilter !== "ALL" && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Category: {categoryFilter}
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
                setProtocolFilter("ALL");
                setCategoryFilter("ALL");
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
          <h3 className="text-sm font-semibold text-rose-900">Unable to Load Templates</h3>
          <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={() => fetchTemplates(false)}
            className="mt-4 px-4 py-1.5 text-xs font-semibold text-rose-800 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs animate-pulse space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 bg-slate-100 rounded-full" />
                <div className="h-4 w-20 bg-slate-100 rounded-md" />
              </div>
              <div className="h-4 w-3/4 bg-slate-100 rounded-md" />
              <div className="h-20 bg-slate-50 border border-slate-100 rounded-lg" />
              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <div className="h-4 w-24 bg-slate-100 rounded-md" />
                <div className="h-4 w-24 bg-slate-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE - NO TEMPLATES IN WORKSPACE */}
      {!isLoading && !error && templates.length === 0 && !isFiltered && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-inner">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            No SMS or RCS Templates Saved Yet
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            Create reusable message formats for your team to quickly launch campaigns with consistent copy, variable tags, and rich RCS cards.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleAddStarterTemplates}
              disabled={isAddingStarters}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isAddingStarters ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>Add Starter Presets</span>
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Custom Template</span>
            </button>
          </div>
        </div>
      )}

      {/* EMPTY STATE - NO RESULTS FOR CURRENT FILTERS */}
      {!isLoading && !error && templates.length === 0 && isFiltered && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center shadow-xs">
          <div className="h-12 w-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No Matching Templates</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            No saved templates match your search criteria or selected channel/category.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setProtocolFilter("ALL");
                setCategoryFilter("ALL");
                setSearchQuery("");
                setPage(1);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Template</span>
            </button>
          </div>
        </div>
      )}

      {/* TEMPLATE GRID */}
      {!isLoading && !error && templates.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map((tpl) => {
              const encoding = calculateSmsEncoding(tpl.messageText);

              return (
                <div
                  key={tpl.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group"
                >
                  <div>
                    {/* Channel & Category Header */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            tpl.protocol === "RCS"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {tpl.protocol === "RCS" ? (
                            <Sparkles className="h-3 w-3 text-indigo-600" />
                          ) : (
                            <Smartphone className="h-3 w-3 text-blue-600" />
                          )}
                          <span>{tpl.protocol}</span>
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/70">
                          {tpl.category}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {encoding.characterCount} chars • {encoding.segments} seg
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xs font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {tpl.name}
                    </h3>
                    {tpl.description && (
                      <p className="text-[11px] text-slate-500 mb-2.5 line-clamp-1">
                        {tpl.description}
                      </p>
                    )}

                    {/* Message Preview */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 text-xs text-slate-700 leading-relaxed font-sans mb-3 break-words whitespace-pre-wrap max-h-36 overflow-y-auto">
                      {tpl.messageText}
                    </div>

                    {/* RCS Card Details Preview */}
                    {tpl.protocol === "RCS" && (
                      <div className="mb-3 space-y-1.5 p-2 rounded-lg bg-indigo-50/50 border border-indigo-100/80 text-[11px]">
                        {tpl.rcsCardTitle && (
                          <div className="font-semibold text-indigo-900 truncate">
                            Card: {tpl.rcsCardTitle}
                          </div>
                        )}
                        {tpl.rcsActionLabel && (
                          <div className="text-indigo-700 flex items-center justify-between text-[10px] font-medium pt-1 border-t border-indigo-100/60">
                            <span>Button Action:</span>
                            <span className="font-semibold px-2 py-0.5 rounded bg-white border border-indigo-200">
                              {tpl.rcsActionLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Metadata & Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Updated {formatDate(tpl.updatedAt)}</span>
                      <span className="font-medium text-slate-500">Workspace Blueprint</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {/* Secondary Actions: Edit & Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(tpl)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Edit Template"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateToDelete(tpl)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Template"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Primary Action: Use in Composer */}
                      <button
                        type="button"
                        onClick={() => {
                          router.push(`/dashboard/sms-rcs/compose?templateId=${tpl.id}`);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                      >
                        <span>Use in Composer</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 bg-white rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shadow-xs">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {total === 0 ? 0 : (page - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(page * limit, total)}
              </span>{" "}
              of <span className="font-semibold text-slate-700">{total}</span> templates
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

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-modal-title"
            className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 id="template-modal-title" className="text-sm font-bold text-slate-900">
                    {editingTemplate ? "Edit Message Template" : "Create Message Template"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Save a reusable SMS text format or rich RCS business card blueprint.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTemplate} className="mt-4 space-y-4">
              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Messaging Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormProtocol("SMS")}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formProtocol === "SMS"
                        ? "bg-blue-50 border-blue-300 text-blue-700 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Standard SMS Text</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormProtocol("RCS")}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formProtocol === "RCS"
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Interactive RCS Card</span>
                  </button>
                </div>
              </div>

              {/* Template Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Template Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Account Security Code"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Internal Classification
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 cursor-pointer"
                  >
                    <option value="GENERAL">General</option>
                    <option value="TRANSACTIONAL">Transactional</option>
                    <option value="PROMOTIONAL">Promotional</option>
                    <option value="ALERTS">Alerts</option>
                    <option value="MARKETING">Marketing</option>
                  </select>
                </div>
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Short context about when to use this template..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                />
              </div>

              {/* Message Body & Variable Helper */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Message Body <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formEncoding.characterCount} chars • {formEncoding.segments} segment(s) (
                    {formEncoding.encoding})
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter message text with placeholders like {{firstName}}..."
                  value={formMessageText}
                  onChange={(e) => setFormMessageText(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 leading-relaxed font-sans"
                />

                {/* Variable Tag Chips */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-600">Insert Tag:</span>
                  {VARIABLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertVariable(tag)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-mono text-slate-700 transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* RCS Specific Fields */}
              {formProtocol === "RCS" && (
                <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>RCS Rich Card Content</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-indigo-950 mb-1">
                        Card Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Special Feature Announcement"
                        value={formRcsCardTitle}
                        onChange={(e) => setFormRcsCardTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-indigo-950 mb-1">
                        Action Button Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Explore Features"
                        value={formRcsActionLabel}
                        onChange={(e) => setFormRcsActionLabel(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-950 mb-1">
                      Action URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://nexareach.com/promo"
                      value={formRcsActionUrl}
                      onChange={(e) => setFormRcsActionUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-950 mb-1">
                      Media Banner URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={formRcsMediaUrl}
                      onChange={(e) => setFormRcsMediaUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono"
                    />
                    {/* Preset Banner Selector */}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] text-indigo-700 font-medium">Presets:</span>
                      {PRESET_BANNERS.map((banner) => (
                        <button
                          key={banner.name}
                          type="button"
                          onClick={() => setFormRcsMediaUrl(banner.url)}
                          className="text-[10px] px-2 py-0.5 rounded bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          {banner.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSaving}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingTemplate ? "Update Template" : "Save Template"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-template-title"
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 id="delete-template-title" className="text-base font-semibold text-slate-900">
                  Delete Message Template?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to permanently delete{" "}
                  <span className="font-semibold text-slate-800">
                    &ldquo;{templateToDelete.name}&rdquo;
                  </span>
                  ? This action will remove the template from your workspace database. Existing drafts or campaigns will not be affected.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTemplate}
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
                    <span>Delete Template</span>
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
