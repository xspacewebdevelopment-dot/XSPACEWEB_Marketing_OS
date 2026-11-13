"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Sparkles,
  Plus,
  Search,
  RotateCw,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Volume2,
  ArrowRight,
  FolderDown,
  X,
  Loader2,
  Clock,
  ShieldAlert,
} from "lucide-react";

export interface VoiceTemplateItem {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  category: string;
  scriptText: string;
  language: string;
  voiceId: string;
  speed: number;
  tags: string[];
  isStarter: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function VoiceTemplatesPage() {
  const router = useRouter();

  const [templates, setTemplates] = useState<VoiceTemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);

  // Counts
  const [counts, setCounts] = useState<any>({
    all: 0,
    reminder: 0,
    notification: 0,
    transactional: 0,
    marketing: 0,
    survey: 0,
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<VoiceTemplateItem | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<VoiceTemplateItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingStarters, setIsAddingStarters] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("REMINDER");
  const [formScriptText, setFormScriptText] = useState("");
  const [formLanguage, setFormLanguage] = useState("en-US");
  const [formVoiceId, setFormVoiceId] = useState("alloy");
  const [formSpeed, setFormSpeed] = useState(1.0);
  const [formError, setFormError] = useState<string | null>(null);

  // Notice Toast
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const showToast = (type: "success" | "error", message: string) => {
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

  const fetchTemplates = useCallback(
    async (refresh = false) => {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (categoryFilter !== "ALL") params.set("category", categoryFilter);
        if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
        params.set("page", page.toString());
        params.set("limit", limit.toString());

        const res = await fetch(`/api/dashboard/voice-campaigns/templates?${params.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load voice templates");
        }

        setTemplates(data.templates || []);
        if (data.pagination) setTotal(data.pagination.total);
        if (data.counts) setCounts(data.counts);
      } catch (err: any) {
        setError(err.message || "Failed to load voice templates");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [categoryFilter, debouncedSearch, page, limit]
  );

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormName("");
    setFormDescription("");
    setFormCategory("REMINDER");
    setFormScriptText("");
    setFormLanguage("en-US");
    setFormVoiceId("alloy");
    setFormSpeed(1.0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tpl: VoiceTemplateItem) => {
    setEditingTemplate(tpl);
    setFormName(tpl.name);
    setFormDescription(tpl.description || "");
    setFormCategory(tpl.category);
    setFormScriptText(tpl.scriptText);
    setFormLanguage(tpl.language);
    setFormVoiceId(tpl.voiceId);
    setFormSpeed(tpl.speed || 1.0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError("Template name is required.");
      return;
    }
    if (!formScriptText.trim()) {
      setFormError("Script text is required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        category: formCategory,
        scriptText: formScriptText.trim(),
        language: formLanguage,
        voiceId: formVoiceId,
        speed: formSpeed,
      };

      const url = editingTemplate
        ? `/api/dashboard/voice-campaigns/templates/${editingTemplate.id}`
        : `/api/dashboard/voice-campaigns/templates`;
      const method = editingTemplate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save template");
      }

      showToast(
        "success",
        editingTemplate
          ? `Template "${formName}" updated.`
          : `Template "${formName}" created.`
      );
      setIsModalOpen(false);
      await fetchTemplates(true);
    } catch (err: any) {
      setFormError(err.message || "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/dashboard/voice-campaigns/templates/${templateToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete template");
      }
      showToast("success", `Template "${templateToDelete.name}" deleted.`);
      setTemplateToDelete(null);
      await fetchTemplates(true);
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete template");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSeedStarters = async () => {
    setIsAddingStarters(true);
    try {
      const res = await fetch("/api/dashboard/voice-campaigns/templates/starters", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add starter presets");
      }
      showToast("success", `Added ${data.count} curated starter templates.`);
      await fetchTemplates(true);
    } catch (err: any) {
      showToast("error", err.message || "Failed to add starter presets");
    } finally {
      setIsAddingStarters(false);
    }
  };

  const insertVariable = (tag: string) => {
    setFormScriptText((prev) => `${prev} ${tag}`.trimStart());
  };

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Toast Notice */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
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
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Voice Script Templates
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Workspace Presets
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Reusable speech copy blueprints with dynamic placeholders for appointment reminders, orders, and surveys.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSeedStarters}
            disabled={isAddingStarters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Add curated starter templates"
          >
            {isAddingStarters ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
            ) : (
              <FolderDown className="h-3.5 w-3.5 text-blue-600" />
            )}
            <span>Add Starter Presets</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Internal Blueprint Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white border border-slate-200 text-amber-600 shrink-0 mt-0.5">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-900">
            Internal Workspace Templates (Review Required Before Live Dispatch)
          </span>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Starter templates are editable example blueprints. Always ensure customer consent is verified and local quiet hours are respected before scheduling campaigns using these scripts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "ALL", label: "All Templates" },
            { key: "REMINDER", label: "Reminders" },
            { key: "NOTIFICATION", label: "Notifications" },
            { key: "TRANSACTIONAL", label: "Transactional" },
            { key: "SURVEY", label: "Surveys" },
            { key: "MARKETING", label: "Marketing" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setCategoryFilter(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                categoryFilter === tab.key
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => fetchTemplates(true)}
            disabled={isRefreshing || isLoading}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-48" />
          ))}
        </div>
      )}

      {!isLoading && templates.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No templates found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || categoryFilter !== "ALL"
              ? "No voice templates match your active filters."
              : "Save standard voice scripts as templates for your team."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={handleSeedStarters}
              disabled={isAddingStarters}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Add Starter Presets</span>
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Custom Template</span>
            </button>
          </div>
        </div>
      )}

      {!isLoading && templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    {tpl.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <Volume2 className="h-3 w-3 text-slate-400" />
                    <span className="capitalize">{tpl.voiceId}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {tpl.name}
                  </h3>
                  {tpl.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{tpl.description}</p>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap font-sans">
                  {tpl.scriptText}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(tpl)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    title="Edit Template"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setTemplateToDelete(tpl)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Delete Template"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Link
                  href={`/dashboard/voice-campaigns/compose?templateId=${tpl.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-all"
                >
                  <span>Use in Campaign</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTemplate ? "Edit Voice Template" : "New Voice Template"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {formError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Appointment Reminder v1"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Internal notes on when to use this template..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-800"
                  >
                    <option value="REMINDER">Reminder</option>
                    <option value="NOTIFICATION">Notification</option>
                    <option value="TRANSACTIONAL">Transactional</option>
                    <option value="SURVEY">Survey</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Voice Timbre</label>
                  <select
                    value={formVoiceId}
                    onChange={(e) => setFormVoiceId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-800 capitalize"
                  >
                    <option value="alloy">Alloy</option>
                    <option value="echo">Echo</option>
                    <option value="fable">Fable</option>
                    <option value="onyx">Onyx</option>
                    <option value="nova">Nova</option>
                    <option value="shimmer">Shimmer</option>
                  </select>
                </div>
              </div>

              {/* Dynamic placeholders toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-semibold text-slate-400">Insert:</span>
                {["{{firstName}}", "{{lastName}}", "{{company}}", "{{city}}", "{{appointmentTime}}"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => insertVariable(t)}
                    className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Voice Script Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={formScriptText}
                  onChange={(e) => setFormScriptText(e.target.value)}
                  rows={5}
                  placeholder="Hello {{firstName}}, this is a message from {{company}}..."
                  className="w-full p-3 text-xs rounded-lg border border-slate-200 text-slate-800 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Delete Template?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete template &ldquo;{templateToDelete.name}&rdquo;?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setTemplateToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
