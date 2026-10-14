"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCode2,
  Sparkles,
  Edit3,
  Check,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Eye,
} from "lucide-react";
import { STARTER_TEMPLATES, StarterTemplate } from "@/lib/templates/starter-templates";
import { wrapInEmailContainer } from "@/lib/templates/compiler";

interface TemplatePickerSegmentProps {
  selectedTemplateId: string | null;
  selectedHtml: string | null;
  campaignId: string | null;
  onSaveDraftBeforeEdit: () => Promise<string | null>;
  onSelect: (data: {
    templateId: string | null;
    compiledHtml: string;
    editorJson?: any;
    subject?: string;
    preheader?: string;
  }) => void;
}

export function TemplatePickerSegment({
  selectedTemplateId,
  selectedHtml,
  campaignId,
  onSaveDraftBeforeEdit,
  onSelect,
}: TemplatePickerSegmentProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"workspace" | "starters">("workspace");
  const [searchQuery, setSearchQuery] = useState("");
  const [navigatingStudioId, setNavigatingStudioId] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/email-marketing/templates");
        if (res.ok) {
          const json = await res.json();
          setTemplates(json.data || []);
        }
      } catch (err) {
        console.warn("Failed to load templates:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  // When clicking "Edit in Studio" on ANY template card
  const handleEditTemplateInStudio = async (tmpl: any, isStarter = false) => {
    try {
      setNavigatingStudioId(tmpl.id);
      const savedCampaignId = await onSaveDraftBeforeEdit();
      const currentCampId = savedCampaignId || campaignId || "";

      let targetTemplateId = tmpl.id;

      // If it's a starter template or has no DB id, create a template record in the workspace
      if (isStarter || !tmpl.id || tmpl.id.startsWith("starter-")) {
        const createRes = await fetch("/api/dashboard/email-marketing/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${tmpl.name} (Customized)`,
            compiledHtml: tmpl.compiledHtml,
            editorJson: tmpl.editorJson,
            category: tmpl.category || "CUSTOM",
            subject: tmpl.subject,
            preheader: tmpl.preheader,
          }),
        });

        if (createRes.ok) {
          const json = await createRes.json();
          targetTemplateId = json.data?.id;
          onSelect({
            templateId: targetTemplateId,
            compiledHtml: tmpl.compiledHtml,
            editorJson: tmpl.editorJson,
            subject: tmpl.subject,
            preheader: tmpl.preheader,
          });
        }
      }

      const returnUrl = `/dashboard/email-marketing/campaigns/create${
        currentCampId ? `?id=${currentCampId}` : ""
      }`;

      window.location.href = `/dashboard/email-marketing/templates/${targetTemplateId}/editor?returnUrl=${encodeURIComponent(
        returnUrl
      )}`;
    } catch (err) {
      console.error("Could not navigate to studio:", err);
      setNavigatingStudioId(null);
    }
  };

  const handleSelectWorkspaceTemplate = async (tmpl: any) => {
    let html = tmpl.compiledHtml || "";
    let json = tmpl.editorJson || null;

    if (!html || html.trim().length < 10) {
      try {
        const res = await fetch(`/api/dashboard/email-marketing/templates/${tmpl.id}`);
        if (res.ok) {
          const tJson = await res.json();
          if (tJson.data?.compiledHtml) {
            html = tJson.data.compiledHtml;
            json = tJson.data.editorJson;
          }
        }
      } catch (err) {
        console.warn("Could not fetch full template html:", err);
      }
    }

    onSelect({
      templateId: tmpl.id,
      compiledHtml: html,
      editorJson: json,
      subject: tmpl.subject,
      preheader: tmpl.preheader,
    });
  };

  const handleSelectStarterTemplate = (starter: StarterTemplate) => {
    const wrapped = wrapInEmailContainer(starter.compiledHtml, {
      title: starter.name,
      preheader: starter.preheader,
    });
    onSelect({
      templateId: null,
      compiledHtml: wrapped,
      editorJson: starter.editorJson,
      subject: starter.subject,
      preheader: starter.preheader,
    });
  };

  const handleBlankTemplate = () => {
    const blankStarter = STARTER_TEMPLATES.find((s) => s.id === "starter-blank");
    const wrapped = wrapInEmailContainer(blankStarter?.compiledHtml || "<p>Hello</p>", {
      title: "Custom Broadcast",
    });
    onSelect({
      templateId: null,
      compiledHtml: wrapped,
      editorJson: blankStarter?.editorJson || null,
      subject: "Important Announcement",
    });
  };

  const filteredWorkspace = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStarters = STARTER_TEMPLATES.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
            <FileCode2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">2. Select Email Template</h2>
            <p className="text-xs text-slate-500">Pick a design and click Edit in Studio anytime to customize.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleBlankTemplate}
          className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer transition-colors shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Blank Canvas</span>
        </button>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("workspace")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "workspace"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            My Workspace ({templates.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("starters")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "starters"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Curated Starters ({STARTER_TEMPLATES.length})
          </button>
        </div>

        <div className="relative sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500 font-medium"
          />
        </div>
      </div>

      {/* WORKSPACE TEMPLATES GRID */}
      {activeTab === "workspace" && (
        <div>
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
              <span>Loading saved templates...</span>
            </div>
          ) : filteredWorkspace.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
              No matching templates found. Check Curated Starters or start with a Blank Canvas.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredWorkspace.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                const isNavigating = navigatingStudioId === tmpl.id;

                return (
                  <div
                    key={tmpl.id}
                    className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? "bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    <div
                      onClick={() => handleSelectWorkspaceTemplate(tmpl)}
                      className="p-3.5 cursor-pointer flex-1"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                          {tmpl.category || "CUSTOM"}
                        </span>
                        {isSelected && (
                          <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 truncate">{tmpl.name}</h4>
                      {tmpl.subject && (
                        <p className="text-[10px] text-slate-500 truncate mt-1">
                          Subj: {tmpl.subject}
                        </p>
                      )}
                    </div>

                    {/* Card Actions: Direct Edit Link + Select Button */}
                    <div className="px-3.5 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditTemplateInStudio(tmpl, false)}
                        disabled={isNavigating}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                        title="Edit template HTML & layout in visual studio"
                      >
                        <Edit3 className="h-3 w-3 text-slate-500" />
                        <span>{isNavigating ? "Opening..." : "Edit in Studio"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectWorkspaceTemplate(tmpl)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected ? "Selected ✓" : "Select"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CURATED STARTER TEMPLATES GRID */}
      {activeTab === "starters" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStarters.map((starter) => {
            const isSelected =
              !selectedTemplateId &&
              selectedHtml &&
              selectedHtml.includes(starter.name);
            const isNavigating = navigatingStudioId === starter.id;

            return (
              <div
                key={starter.id}
                className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? "bg-indigo-50/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div
                  onClick={() => handleSelectStarterTemplate(starter)}
                  className="p-3.5 cursor-pointer flex-1"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {starter.category}
                    </span>
                    {isSelected && (
                      <span className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 truncate">{starter.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {starter.description}
                  </p>
                </div>

                {/* Card Actions: Direct Edit Link + Select Button */}
                <div className="px-3.5 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditTemplateInStudio(starter, true)}
                    disabled={isNavigating}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-indigo-600 hover:underline cursor-pointer transition-colors"
                    title="Customize this starter in the visual studio"
                  >
                    <Edit3 className="h-3 w-3 text-slate-500" />
                    <span>{isNavigating ? "Opening..." : "Edit in Studio"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectStarterTemplate(starter)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected ? "Selected ✓" : "Select"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
