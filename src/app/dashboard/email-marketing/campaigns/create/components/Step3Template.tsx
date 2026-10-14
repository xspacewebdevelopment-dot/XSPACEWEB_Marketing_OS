"use client";

import { useState, useEffect } from "react";
import {
  FileCode2,
  Sparkles,
  Edit3,
  Eye,
  Check,
  ExternalLink,
  Smartphone,
  Monitor,
  Plus,
  RefreshCw,
} from "lucide-react";
import { STARTER_TEMPLATES, StarterTemplate } from "@/lib/templates/starter-templates";
import { wrapInEmailContainer } from "@/lib/templates/compiler";

interface Step3TemplateProps {
  campaignId?: string;
  templateId?: string | null;
  compiledHtml?: string | null;
  editorJson?: any;
  onChange: (data: {
    templateId?: string | null;
    compiledHtml?: string | null;
    editorJson?: any;
  }) => void;
  onSaveDraftBeforeEdit: () => Promise<string | null>; // Returns saved campaign ID
}

export function Step3Template({
  campaignId,
  templateId,
  compiledHtml,
  editorJson,
  onChange,
  onSaveDraftBeforeEdit,
}: Step3TemplateProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"workspace" | "starters">("workspace");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [navigatingToEditor, setNavigatingToEditor] = useState(false);

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
        console.error("Failed to load templates:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

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

    onChange({
      templateId: tmpl.id,
      compiledHtml: html,
      editorJson: json,
    });
  };

  const handleSelectStarterTemplate = (starter: StarterTemplate) => {
    const wrapped = wrapInEmailContainer(starter.compiledHtml, {
      title: starter.name,
      preheader: starter.preheader,
    });
    onChange({
      templateId: null,
      compiledHtml: wrapped,
      editorJson: starter.editorJson,
    });
  };

  const handleBlankTemplate = () => {
    const blankStarter = STARTER_TEMPLATES.find((s) => s.id === "starter-blank");
    const wrapped = wrapInEmailContainer(blankStarter?.compiledHtml || "<p>Hello</p>", {
      title: "Custom Campaign",
    });
    onChange({
      templateId: null,
      compiledHtml: wrapped,
      editorJson: blankStarter?.editorJson || null,
    });
  };

  // Launch existing GrapesJS email studio with returnUrl to return seamlessly to wizard Step 3
  const handleOpenStudio = async () => {
    try {
      setNavigatingToEditor(true);
      const savedCampaignId = await onSaveDraftBeforeEdit();
      const targetCampId = savedCampaignId || campaignId;

      let targetTemplateId = templateId;

      // If campaign does not yet have a linked template, clone/create a campaign-specific draft template
      if (!targetTemplateId) {
        const createTmplRes = await fetch("/api/dashboard/email-marketing/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Campaign Design (${new Date().toLocaleDateString()})`,
            compiledHtml: compiledHtml || "",
            editorJson: editorJson || null,
            category: "CUSTOM",
          }),
        });
        if (createTmplRes.ok) {
          const json = await createTmplRes.json();
          targetTemplateId = json.data?.id;
          onChange({ templateId: targetTemplateId });
        }
      }

      if (targetTemplateId) {
        const returnUrl = `/dashboard/email-marketing/campaigns/create?id=${targetCampId}&step=3`;
        window.location.href = `/dashboard/email-marketing/templates/${targetTemplateId}/editor?returnUrl=${encodeURIComponent(
          returnUrl
        )}`;
      }
    } catch (err) {
      console.error("Failed to launch studio:", err);
      setNavigatingToEditor(false);
    }
  };

  return (
    <div className="space-y-6 select-none p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Step 3: Template & Visual Design</h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose a saved workspace template, starter design, or launch the existing GrapesJS email editor to customize.
          </p>
        </div>

        {/* Action: Open in Studio */}
        <button
          type="button"
          onClick={handleOpenStudio}
          disabled={navigatingToEditor}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-xs shadow-blue-500/20 transition-all shrink-0 cursor-pointer"
        >
          {navigatingToEditor ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Edit3 className="h-4 w-4" />
          )}
          <span>Edit in Email Studio &rarr;</span>
        </button>
      </div>

      {/* Selected Design Summary Banner */}
      {compiledHtml && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
              <FileCode2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>Design Source Attached</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">
                  Ready to send
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Campaign has valid HTML and responsive layout compiled.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPreviewHtml(compiledHtml);
              setPreviewOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview Email</span>
          </button>
        </div>
      )}

      {/* Tabs: Workspace Templates vs Curated Starters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("workspace")}
              className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === "workspace"
                  ? "text-blue-600 border-blue-600 bg-blue-50/50"
                  : "text-slate-600 border-transparent hover:text-slate-900"
              }`}
            >
              <FileCode2 className="h-3.5 w-3.5" />
              <span>Workspace Templates ({templates.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("starters")}
              className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === "starters"
                  ? "text-blue-600 border-blue-600 bg-blue-50/50"
                  : "text-slate-600 border-transparent hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Curated Starters ({STARTER_TEMPLATES.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleBlankTemplate}
            className="text-xs text-slate-600 hover:text-blue-600 font-medium flex items-center gap-1 pb-1 cursor-pointer transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Start with Blank Canvas</span>
          </button>
        </div>

        {/* WORKSPACE TEMPLATES */}
        {activeTab === "workspace" && (
          <div>
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs">
                No templates saved yet. Choose a curated starter to start.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((tmpl) => {
                  const isSelected = templateId === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => handleSelectWorkspaceTemplate(tmpl)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-400 text-slate-900 shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {tmpl.category}
                          </span>
                          {isSelected && (
                            <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{tmpl.name}</h4>
                        {tmpl.subject && (
                          <p className="text-[10px] text-slate-500 truncate mt-1">
                            Subject: {tmpl.subject}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Updated {new Date(tmpl.updatedAt).toLocaleDateString()}</span>
                        <span className={isSelected ? "text-blue-700 font-bold" : "text-blue-600 font-semibold"}>
                          {isSelected ? "Selected ✓" : "Select Design"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CURATED STARTER TEMPLATES */}
        {activeTab === "starters" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {STARTER_TEMPLATES.map((starter) => (
              <div
                key={starter.id}
                onClick={() => handleSelectStarterTemplate(starter)}
                className="p-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {starter.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{starter.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {starter.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Industry Best Practice</span>
                  <span className="text-indigo-600 font-semibold">Use Starter</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Embedded Live Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Campaign Design Preview</h3>
              </div>

              {/* Desktop / Mobile Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 font-semibold cursor-pointer ${
                    previewMode === "desktop" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 font-semibold cursor-pointer ${
                    previewMode === "mobile" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Mobile</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>

            {/* Iframe Preview Container */}
            <div className="flex-1 bg-slate-100 p-6 overflow-auto flex items-center justify-center">
              <div
                className={`bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-200 border border-slate-200 ${
                  previewMode === "mobile" ? "w-[375px] h-[667px]" : "w-[650px] h-full"
                }`}
              >
                <iframe
                  title="Email Preview"
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
