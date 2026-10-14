"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  Filter,
  Plus,
  Upload,
  Download,
  Search,
  MoreVertical,
  Users,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

import { CreateListModal } from "./components/CreateListModal";
import { EditListModal } from "./components/EditListModal";
import { ListMembersDrawer } from "./components/ListMembersDrawer";
import { SegmentBuilderModal } from "./components/SegmentBuilderModal";
import { SegmentPreviewDrawer } from "./components/SegmentPreviewDrawer";
import { BulkImportContactsModal } from "../contacts/components/BulkImportContactsModal";

import type { ContactListSummary, SegmentSummary } from "@/lib/types/contacts";

export default function ListsSegmentsPage() {
  const [activeTab, setActiveTab] = useState<"lists" | "segments">("lists");

  // Lists state
  const [lists, setLists] = useState<ContactListSummary[]>([]);
  const [listSearch, setListSearch] = useState("");
  const [loadingLists, setLoadingLists] = useState(true);

  // Segments state
  const [segments, setSegments] = useState<SegmentSummary[]>([]);
  const [segmentSearch, setSegmentSearch] = useState("");
  const [loadingSegments, setLoadingSegments] = useState(true);

  // Modals state
  const [showCreateList, setShowCreateList] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingList, setEditingList] = useState<ContactListSummary | null>(null);
  const [viewingList, setViewingList] = useState<ContactListSummary | null>(null);

  const [showSegmentBuilder, setShowSegmentBuilder] = useState(false);
  const [editingSegment, setEditingSegment] = useState<SegmentSummary | null>(null);
  const [previewingSegment, setPreviewingSegment] = useState<SegmentSummary | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Lists
  const fetchLists = useCallback(async () => {
    setLoadingLists(true);
    try {
      const res = await fetch("/api/dashboard/lists");
      const data = await res.json();
      if (res.ok && data.lists) {
        setLists(data.lists);
      }
    } catch (e) {
      console.error("Failed to fetch lists", e);
    } finally {
      setLoadingLists(false);
    }
  }, []);

  // Fetch Segments
  const fetchSegments = useCallback(async () => {
    setLoadingSegments(true);
    try {
      const res = await fetch("/api/dashboard/segments");
      const data = await res.json();
      if (res.ok && data.segments) {
        setSegments(data.segments);
      }
    } catch (e) {
      console.error("Failed to fetch segments", e);
    } finally {
      setLoadingSegments(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
    fetchSegments();
  }, [fetchLists, fetchSegments]);

  // Delete List
  const handleDeleteList = async (listId: string) => {
    if (!window.confirm("Are you sure you want to delete this list? Contacts will not be deleted.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/dashboard/lists/${listId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchLists();
      }
    } catch (e) {
      alert("Failed to delete list");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Segment
  const handleDeleteSegment = async (segmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this dynamic segment?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/dashboard/segments/${segmentId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchSegments();
      }
    } catch (e) {
      alert("Failed to delete segment");
    } finally {
      setActionLoading(false);
    }
  };

  // Export List
  const handleExportList = async (list: ContactListSummary) => {
    try {
      const res = await fetch("/api/dashboard/contacts/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: list.id, format: "csv" }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${list.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_contacts.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export list");
    }
  };

  const filteredLists = lists.filter(
    (l) =>
      l.name.toLowerCase().includes(listSearch.toLowerCase()) ||
      (l.description && l.description.toLowerCase().includes(listSearch.toLowerCase()))
  );

  const filteredSegments = segments.filter(
    (s) =>
      s.name.toLowerCase().includes(segmentSearch.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(segmentSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lists & Segments</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {lists.length} Lists · {segments.length} Segments
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organize audience members into static lists or dynamic rule-based query segments
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {activeTab === "lists" ? (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-xs font-semibold text-purple-700 shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-purple-600" />
                <span>Import to List</span>
              </button>
              <button
                onClick={() => setShowCreateList(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create List</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setEditingSegment(null);
                setShowSegmentBuilder(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Segment</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex p-1 bg-slate-100 border border-slate-200 rounded-xl w-fit shadow-xs">
        <button
          onClick={() => setActiveTab("lists")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeTab === "lists"
              ? "bg-white text-blue-600 shadow-xs border border-slate-200/60 font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          Static Lists ({lists.length})
        </button>
        <button
          onClick={() => setActiveTab("segments")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeTab === "segments"
              ? "bg-white text-blue-600 shadow-xs border border-slate-200/60 font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Filter className="w-4 h-4" />
          Dynamic Segments ({segments.length})
        </button>
      </div>

      {/* TAB 1: LISTS */}
      {activeTab === "lists" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Search contact lists..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 shadow-xs"
            />
          </div>

          {/* Lists Grid */}
          {loadingLists ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Loading contact lists from PostgreSQL...</p>
            </div>
          ) : filteredLists.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-white shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">No contact lists found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {listSearch ? "No lists match your search query." : "Create your first list to start grouping audience members."}
              </p>
              {!listSearch && (
                <button
                  onClick={() => setShowCreateList(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create List</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLists.map((list) => (
                <div
                  key={list.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between transition-all hover:shadow-md group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {list.name}
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            Created {new Date(list.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700">
                        {list.contactCount} contacts
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                      {list.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => setViewingList(list)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      View Members
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleExportList(list)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        title="Export List"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingList(list)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        title="Edit List"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        title="Delete List"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SEGMENTS */}
      {activeTab === "segments" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={segmentSearch}
              onChange={(e) => setSegmentSearch(e.target.value)}
              placeholder="Search dynamic segments..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 shadow-xs"
            />
          </div>

          {/* Segments Grid */}
          {loadingSegments ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Loading dynamic segments from PostgreSQL...</p>
            </div>
          ) : filteredSegments.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-white shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Filter className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">No dynamic segments found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {segmentSearch ? "No segments match your search query." : "Build rule-based query segments to target audiences dynamically."}
              </p>
              {!segmentSearch && (
                <button
                  onClick={() => {
                    setEditingSegment(null);
                    setShowSegmentBuilder(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Segment</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSegments.map((segment) => (
                <div
                  key={segment.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between transition-all hover:shadow-md group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                          <Filter className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {segment.name}
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            {segment.conditions?.conditions?.length || 0} rule(s) · {segment.conditions?.matchType || "AND"}
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700">
                        {segment.matchingCount} matches
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                      {segment.description || "Dynamic segment matching specific rule criteria."}
                    </p>

                    {/* Preview of rules */}
                    <div className="flex flex-wrap gap-1">
                      {segment.conditions?.conditions?.slice(0, 2).map((c, ci) => (
                        <span
                          key={ci}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-50 border border-slate-200 text-slate-700 font-mono"
                        >
                          {c.field} {c.operator} {String(c.value)}
                        </span>
                      ))}
                      {(segment.conditions?.conditions?.length || 0) > 2 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 border border-slate-200">
                          +{(segment.conditions?.conditions?.length || 0) - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => setPreviewingSegment(segment)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview Matches
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingSegment(segment);
                          setShowSegmentBuilder(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        title="Edit Segment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSegment(segment.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        title="Delete Segment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals & Drawers */}
      <CreateListModal
        isOpen={showCreateList}
        onClose={() => setShowCreateList(false)}
        onSuccess={fetchLists}
      />

      <EditListModal
        isOpen={!!editingList}
        onClose={() => setEditingList(null)}
        list={editingList}
        onSuccess={fetchLists}
      />

      <ListMembersDrawer
        isOpen={!!viewingList}
        onClose={() => setViewingList(null)}
        list={viewingList}
        onListUpdated={fetchLists}
      />

      <SegmentBuilderModal
        isOpen={showSegmentBuilder}
        onClose={() => {
          setShowSegmentBuilder(false);
          setEditingSegment(null);
        }}
        lists={lists}
        segment={editingSegment}
        onSuccess={fetchSegments}
      />

      <SegmentPreviewDrawer
        isOpen={!!previewingSegment}
        onClose={() => setPreviewingSegment(null)}
        segment={previewingSegment}
      />

      <BulkImportContactsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        lists={lists}
        onSuccess={() => {
          fetchLists();
        }}
      />
    </div>
  );
}
