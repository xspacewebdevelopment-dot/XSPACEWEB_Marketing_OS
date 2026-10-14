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

  const handleSelectWorkspaceTemplate = (tmpl: any) => {
    onChange({
      templateId: tmpl.id,
      compiledHtml: tmpl.compiledHtml || "",
      editorJson: tmpl.editorJson,
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
    <div className="space-y-6 select-none">
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Step 3: Template & Visual Design</h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose a saved workspace template, starter design, or launch the existing GrapesJS email editor to customize.
          </p>
        </div>

        {/* Action: Open in Studio */}
        <button
          type="button"
          onClick={handleOpenStudio}
          disabled={navigatingToEditor}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all shrink-0"
        >
          {navigatingToEditor ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Edit3 className="h-3.5 w-3.5" />
          )}
          <span>Edit in Email Studio &rarr;</span>
        </button>
      </div>

      {/* Selected Design Summary Banner */}
      {compiledHtml && (
        <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCode2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Design Source Attached</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ready to send
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
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
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview Email</span>
          </button>
        </div>
      )}

      {/* Tabs: Workspace Templates vs Curated Starters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("workspace")}
              className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === "workspace"
                  ? "text-blue-400 border-blue-500 bg-blue-500/5"
                  : "text-slate-400 border-transparent hover:text-slate-200"
              }`}
            >
              <FileCode2 className="h-3.5 w-3.5" />
              <span>Workspace Templates ({templates.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("starters")}
              className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === "starters"
                  ? "text-blue-400 border-blue-500 bg-blue-500/5"
                  : "text-slate-400 border-transparent hover:text-slate-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Curated Starters ({STARTER_TEMPLATES.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleBlankTemplate}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 pb-1"
          >
            <Plus className="h-3 w-3" />
            <span>Start with Blank Canvas</span>
          </button>
        </div>

        {/* WORKSPACE TEMPLATES */}
        {activeTab === "workspace" && (
          <div>
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-800 bg-[#0a1829]/50 text-slate-400 text-xs">
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
                          ? "bg-blue-600/15 border-blue-500 text-white shadow-xs"
                          : "bg-[#0a1829] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {tmpl.category}
                          </span>
                          {isSelected && (
                            <span className="h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white truncate">{tmpl.name}</h4>
                        {tmpl.subject && (
                          <p className="text-[10px] text-slate-400 truncate mt-1">
                            Subject: {tmpl.subject}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Updated {new Date(tmpl.updatedAt).toLocaleDateString()}</span>
                        <span className="text-blue-400 font-semibold">Select Design</span>
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
                className="p-3.5 rounded-xl border border-slate-800 bg-[#0a1829] text-slate-300 hover:border-slate-700 hover:bg-slate-800/40 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">
                      {starter.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{starter.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {starter.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Industry Best Practice</span>
                  <span className="text-indigo-400 font-semibold">Use Starter</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Embedded Live Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a1829] border border-slate-700 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Campaign Design Preview</h3>
              </div>

              {/* Desktop / Mobile Toggle */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 font-semibold ${
                    previewMode === "desktop" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 font-semibold ${
                    previewMode === "mobile" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Mobile</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
              >
                Close Preview
              </button>
            </div>

            {/* Iframe Preview Container */}
            <div className="flex-1 bg-slate-950 p-6 overflow-auto flex items-center justify-center">
              <div
                className={`bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-200 ${
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
