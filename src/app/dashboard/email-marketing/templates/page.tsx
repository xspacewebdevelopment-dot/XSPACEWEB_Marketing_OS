"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  FileCode2,
  Sparkles,
  Copy,
  Edit3,
  Trash2,
  Eye,
  Send,
  MoreVertical,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  FolderOpen,
  Layout,
  ExternalLink,
} from "lucide-react";
import { STARTER_TEMPLATES, StarterTemplate } from "@/lib/templates/starter-templates";
import { PreviewTestModal } from "./components/PreviewTestModal";

interface TemplateItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  status: string;
  subject?: string | null;
  preheader?: string | null;
  thumbnail?: string | null;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const router = useRouter();

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCategory, setCreateCategory] = useState("CUSTOM");
  const [selectedStarterId, setSelectedStarterId] = useState<string>("starter-blank");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rename modal
  const [renameItem, setRenameItem] = useState<TemplateItem | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Delete modal
  const [deleteItem, setDeleteItem] = useState<TemplateItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview & Test modal
  const [previewTemplate, setPreviewTemplate] = useState<{
    id?: string;
    name: string;
    subject?: string | null;
    preheader?: string | null;
    html: string;
  } | null>(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);

  // Fetch templates from API
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (sortBy) params.set("sort", sortBy);

      const res = await fetch(`/api/dashboard/email-marketing/templates?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTemplates(json.data || []);
        }
      }
    } catch (err: any) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, sortBy]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4000);
  };

  // Quick clone starter template
  const handleUseStarter = async (starter: StarterTemplate) => {
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/dashboard/email-marketing/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${starter.name} (Custom)`,
          category: starter.category,
          starterId: starter.id,
          subject: starter.subject,
          preheader: starter.preheader,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create template");

      showNotification(`Created template from "${starter.name}"`);
      const editorUrl = `/dashboard/email-marketing/templates/${json.data.id}/editor`;
      if (typeof window !== "undefined") {
        const win = window.open(editorUrl, "_blank");
        if (!win) router.push(editorUrl);
      } else {
        router.push(editorUrl);
      }
      fetchTemplates();
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create new template modal submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/dashboard/email-marketing/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          category: createCategory,
          starterId: selectedStarterId === "starter-blank" ? null : selectedStarterId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create template");

      setIsCreateModalOpen(false);
      setCreateName("");
      showNotification("Template created successfully!");
      const editorUrl = `/dashboard/email-marketing/templates/${json.data.id}/editor`;
      if (typeof window !== "undefined") {
        const win = window.open(editorUrl, "_blank");
        if (!win) router.push(editorUrl);
      } else {
        router.push(editorUrl);
      }
      fetchTemplates();
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Duplicate template
  const handleDuplicate = async (item: TemplateItem) => {
    try {
      const res = await fetch(`/api/dashboard/email-marketing/templates/${item.id}/duplicate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to duplicate template");

      showNotification(`Duplicated as "${json.data.name}"`);
      fetchTemplates();
    } catch (err: any) {
      showNotification(err.message, "error");
    }
  };

  // Rename template
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameItem || !renameValue.trim()) return;

    try {
      const res = await fetch(`/api/dashboard/email-marketing/templates/${renameItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to rename template");

      showNotification(`Renamed to "${renameValue.trim()}"`);
      setRenameItem(null);
      fetchTemplates();
    } catch (err: any) {
      showNotification(err.message, "error");
    }
  };

  // Delete template
  const handleDeleteConfirm = async () => {
    if (!deleteItem || isDeleting) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/dashboard/email-marketing/templates/${deleteItem.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete template");

      showNotification(`Deleted template "${deleteItem.name}"`);
      setDeleteItem(null);
      fetchTemplates();
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Preview Modal
  const handleOpenPreview = async (item: TemplateItem) => {
    try {
      setLoadingPreviewId(item.id);
      const res = await fetch(`/api/dashboard/email-marketing/templates/${item.id}`);
      if (res.ok) {
        const json = await res.json();
        setPreviewTemplate({
          id: item.id,
          name: json.data.name,
          subject: json.data.subject,
          preheader: json.data.preheader,
          html: json.data.compiledHtml || "<p>Empty template</p>",
        });
      }
    } catch (err: any) {
      showNotification("Could not load preview", "error");
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const categories = [
    { id: "ALL", label: "All Templates" },
    { id: "NEWSLETTER", label: "Newsletters" },
    { id: "PROMOTIONAL", label: "Promotional" },
    { id: "PRODUCT", label: "Product Launch" },
    { id: "EVENT", label: "Events & Webinars" },
    { id: "WELCOME", label: "Welcome & Onboarding" },
    { id: "FOLLOWUP", label: "Follow-Up" },
    { id: "CUSTOM", label: "Custom" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Toast Notification */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="font-bold px-1.5">
            ×
          </button>
        </div>
      )}

      {/* A. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Email Templates
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              Core Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Design, customize, and deliver responsive email templates with our
            drag-and-drop editor, personalization tags, and live Resend testing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setSelectedStarterId("starter-blank");
              setCreateCategory("CUSTOM");
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
          >
            <Layout className="h-3.5 w-3.5" />
            <span>Blank Template</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Template</span>
          </button>
        </div>
      </div>

      {/* B. Curated Starter Templates Showcase */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Curated Starter Templates
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Click &quot;Use Template&quot; to clone into your workspace
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {STARTER_TEMPLATES.filter((s) => s.id !== "starter-blank")
            .slice(0, 4)
            .map((starter) => (
              <div
                key={starter.id}
                className="group rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="relative h-32 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-3 overflow-hidden">
                  <div
                    className="w-full h-full flex items-center justify-center opacity-85 group-hover:scale-105 transition-transform"
                    dangerouslySetInnerHTML={{ __html: starter.thumbnailSvg }}
                  />
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-slate-700 border border-slate-200 shadow-xs backdrop-blur-xs">
                    {starter.category}
                  </span>
                </div>

                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      {starter.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                      {starter.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleUseStarter(starter)}
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-colors"
                    >
                      <span>Use Template</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* C. Template Library & Filter Controls */}
      <div className="space-y-4 pt-4">
        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates by name, subject, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="updatedAt">Sort: Last Edited</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="createdAt">Sort: Created Date</option>
            </select>

            <button
              onClick={() => fetchTemplates()}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium ${
                categoryFilter === cat.id
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500">Loading your templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-16 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">
                No templates found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || categoryFilter !== "ALL"
                  ? "No templates match your search filter. Try clearing filters."
                  : "Get started by creating your first custom email template or selecting one of our curated starters."}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Template</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="group rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Thumbnail Preview Area */}
                <div
                  onClick={() => {
                    const editorUrl = `/dashboard/email-marketing/templates/${tpl.id}/editor`;
                    if (typeof window !== "undefined") {
                      const win = window.open(editorUrl, "_blank");
                      if (!win) router.push(editorUrl);
                    } else {
                      router.push(editorUrl);
                    }
                  }}
                  className="relative h-44 bg-slate-50 border-b border-slate-100 cursor-pointer overflow-hidden flex items-center justify-center p-3"
                  title="Click to open editor in a new window"
                >
                  {tpl.thumbnail ? (
                    <div
                      className="w-full h-full flex items-center justify-center group-hover:scale-102 transition-transform"
                      dangerouslySetInnerHTML={{ __html: tpl.thumbnail }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300 space-y-1">
                      <FileCode2 className="h-8 w-8" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        Email Template
                      </span>
                    </div>
                  )}

                  {/* Badges on top */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/95 text-slate-700 border border-slate-200 shadow-xs backdrop-blur-xs">
                      {tpl.category}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        tpl.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {tpl.status}
                    </span>
                  </div>
                </div>

                {/* Card Content & Action Bar */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {tpl.subject ? `Subject: ${tpl.subject}` : "No default subject set"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(tpl.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenPreview(tpl)}
                        disabled={loadingPreviewId === tpl.id}
                        className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Preview & Send Test"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(tpl)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setRenameItem(tpl);
                          setRenameValue(tpl.name);
                        }}
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Rename"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteItem(tpl)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Primary Edit Button */}
                  <Link
                    href={`/dashboard/email-marketing/templates/${tpl.id}/editor`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold shadow-xs transition-colors"
                    title="Open editor in a new window"
                  >
                    <span>Edit in New Window</span>
                    <ExternalLink className="h-3.5 w-3.5 text-blue-300" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE TEMPLATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Create Email Template
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. November Product Digest"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={createCategory}
                  onChange={(e) => setCreateCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CUSTOM">Custom</option>
                  <option value="NEWSLETTER">Newsletter</option>
                  <option value="PROMOTIONAL">Promotional</option>
                  <option value="PRODUCT">Product Launch</option>
                  <option value="EVENT">Event & Webinar</option>
                  <option value="WELCOME">Welcome & Onboarding</option>
                  <option value="FOLLOWUP">Follow-Up</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Starting Canvas
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-lg">
                  {STARTER_TEMPLATES.map((starter) => (
                    <button
                      key={starter.id}
                      type="button"
                      onClick={() => {
                        setSelectedStarterId(starter.id);
                        if (starter.category !== "CUSTOM") {
                          setCreateCategory(starter.category);
                        }
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                        selectedStarterId === starter.id
                          ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-600"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {starter.name}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {starter.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !createName.trim()}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isSubmitting ? "Creating..." : "Create & Open Editor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {renameItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Rename Template
            </h3>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameItem(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-rose-100 text-rose-600 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delete Template?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to permanently delete &quot;{deleteItem.name}&quot;?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW AND TEST EMAIL MODAL */}
      {previewTemplate && (
        <PreviewTestModal
          isOpen={true}
          onClose={() => setPreviewTemplate(null)}
          templateName={previewTemplate.name}
          templateId={previewTemplate.id}
          subject={previewTemplate.subject}
          preheader={previewTemplate.preheader}
          htmlContent={previewTemplate.html}
        />
      )}
    </div>
  );
}
