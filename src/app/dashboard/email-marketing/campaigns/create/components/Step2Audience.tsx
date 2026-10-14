"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Layers,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldBan,
  Search,
  UserX,
  RefreshCw,
  Eye,
  Check,
  ShieldAlert,
} from "lucide-react";
import type { AudienceConfig, AudienceBreakdown } from "@/lib/types/campaigns";

interface Step2AudienceProps {
  audienceConfig: AudienceConfig;
  onChange: (config: AudienceConfig) => void;
  breakdown: AudienceBreakdown | null;
  calculating: boolean;
  onRecalculate: () => void;
}

export function Step2Audience({
  audienceConfig,
  onChange,
  breakdown,
  calculating,
  onRecalculate,
}: Step2AudienceProps) {
  // Available resources in workspace
  const [availableLists, setAvailableLists] = useState<any[]>([]);
  const [availableSegments, setAvailableSegments] = useState<any[]>([]);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);

  // Tab: Lists, Segments, Individual Contacts, Exclusions
  const [activeAudienceTab, setActiveAudienceTab] = useState<"lists" | "segments" | "contacts" | "exclusions">("lists");

  // Contacts search query inside modal/selector
  const [contactSearch, setContactSearch] = useState("");

  // Load lists, segments, and contacts from workspace
  useEffect(() => {
    async function loadWorkspaceAudienceSources() {
      try {
        setLoadingResources(true);
        const [listsRes, segmentsRes, contactsRes] = await Promise.all([
          fetch("/api/dashboard/lists"),
          fetch("/api/dashboard/segments"),
          fetch("/api/dashboard/contacts?limit=100"),
        ]);

        let listsCount = 0;
        let contactsCount = 0;

        if (listsRes.ok) {
          const lJson = await listsRes.json();
          const lists = lJson.lists || lJson.data || [];
          setAvailableLists(lists);
          listsCount = lists.length;
        }
        if (segmentsRes.ok) {
          const sJson = await segmentsRes.json();
          setAvailableSegments(sJson.segments || sJson.data || []);
        }
        if (contactsRes.ok) {
          const cJson = await contactsRes.json();
          const contacts = cJson.contacts || cJson.data || [];
          setAvailableContacts(contacts);
          contactsCount = contacts.length;
        }

        // If no static lists exist, but individual contacts exist, auto-switch to contacts tab
        if (listsCount === 0 && contactsCount > 0) {
          setActiveAudienceTab("contacts");
        }
      } catch (err) {
        console.error("Failed to load audience resources:", err);
      } finally {
        setLoadingResources(false);
      }
    }

    loadWorkspaceAudienceSources();
  }, []);

  const selectedListIds = audienceConfig.listIds || [];
  const selectedSegmentIds = audienceConfig.segmentIds || [];
  const selectedContactIds = audienceConfig.contactIds || [];
  const excludedListIds = audienceConfig.excludedListIds || [];
  const excludedContactIds = audienceConfig.excludedContactIds || [];

  const toggleList = (id: string) => {
    const next = selectedListIds.includes(id)
      ? selectedListIds.filter((x) => x !== id)
      : [...selectedListIds, id];
    onChange({ ...audienceConfig, listIds: next });
  };

  const toggleSegment = (id: string) => {
    const next = selectedSegmentIds.includes(id)
      ? selectedSegmentIds.filter((x) => x !== id)
      : [...selectedSegmentIds, id];
    onChange({ ...audienceConfig, segmentIds: next });
  };

  const toggleContact = (id: string) => {
    const next = selectedContactIds.includes(id)
      ? selectedContactIds.filter((x) => x !== id)
      : [...selectedContactIds, id];
    onChange({ ...audienceConfig, contactIds: next });
  };

  const toggleExcludedList = (id: string) => {
    const next = excludedListIds.includes(id)
      ? excludedListIds.filter((x) => x !== id)
      : [...excludedListIds, id];
    onChange({ ...audienceConfig, excludedListIds: next });
  };

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return availableContacts;
    const q = contactSearch.toLowerCase();
    return availableContacts.filter(
      (c) =>
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.firstName && c.firstName.toLowerCase().includes(q)) ||
        (c.lastName && c.lastName.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q))
    );
  }, [availableContacts, contactSearch]);

  return (
    <div className="space-y-6 select-none p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Step 2: Audience Selection & Exclusion</h2>
          <p className="text-xs text-slate-500 mt-1">
            Connect contact lists, dynamic segments, or individual contacts with automated deduplication and suppression filtering.
          </p>
        </div>
        <button
          type="button"
          onClick={onRecalculate}
          disabled={calculating}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${calculating ? "animate-spin text-blue-600" : ""}`} />
          <span>Recalculate</span>
        </button>
      </div>

      {/* Real-time Audience Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 font-medium block">Total Raw</span>
          <span className="text-sm font-bold text-slate-900">{breakdown?.totalRaw ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-500 font-medium block">Selected</span>
          <span className="text-sm font-bold text-slate-900">{breakdown?.selected ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
          <span className="text-[10px] text-amber-700 font-medium block">Duplicates</span>
          <span className="text-sm font-bold text-amber-700">-{breakdown?.duplicates ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200">
          <span className="text-[10px] text-rose-700 font-medium block">Suppressed</span>
          <span className="text-sm font-bold text-rose-700">-{breakdown?.suppressed ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200">
          <span className="text-[10px] text-rose-700 font-medium block">Unsubscribed</span>
          <span className="text-sm font-bold text-rose-700">-{breakdown?.unsubscribed ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-200">
          <span className="text-[10px] text-orange-700 font-medium block">Invalid/Risky</span>
          <span className="text-sm font-bold text-orange-700">-{breakdown?.invalidOrRisky ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Eligible Net</span>
          <span className="text-base font-extrabold text-blue-700">{breakdown?.eligible ?? 0}</span>
        </div>
      </div>

      {/* Audience Source Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-1 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveAudienceTab("lists")}
            className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeAudienceTab === "lists"
                ? "text-blue-600 border-blue-600 bg-blue-50/50"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Contact Lists ({availableLists.length})</span>
            {selectedListIds.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full font-bold">
                {selectedListIds.length} selected
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveAudienceTab("segments")}
            className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeAudienceTab === "segments"
                ? "text-blue-600 border-blue-600 bg-blue-50/50"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Dynamic Segments ({availableSegments.length})</span>
            {selectedSegmentIds.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full font-bold">
                {selectedSegmentIds.length} selected
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveAudienceTab("contacts")}
            className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeAudienceTab === "contacts"
                ? "text-blue-600 border-blue-600 bg-blue-50/50"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Individual Contacts ({availableContacts.length})</span>
            {selectedContactIds.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full font-bold">
                {selectedContactIds.length} selected
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveAudienceTab("exclusions")}
            className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
              activeAudienceTab === "exclusions"
                ? "text-rose-600 border-rose-600 bg-rose-50/50"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            <UserX className="h-3.5 w-3.5 text-rose-600" />
            <span>Exclusions</span>
            {(excludedListIds.length > 0 || excludedContactIds.length > 0) && (
              <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded-full font-bold">
                {excludedListIds.length + excludedContactIds.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: LISTS */}
        {activeAudienceTab === "lists" && (
          <div className="space-y-3">
            {availableLists.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs space-y-3">
                <p className="font-semibold text-slate-800">No static contact lists found in this workspace.</p>
                {availableContacts.length > 0 ? (
                  <div className="pt-1 space-y-3">
                    <p className="text-slate-500">
                      You have <strong>{availableContacts.length} individual contacts</strong> in your workspace directory. You can select them directly in the Individual Contacts tab.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveAudienceTab("contacts")}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition shadow-xs cursor-pointer inline-flex items-center gap-2"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Switch to Individual Contacts ({availableContacts.length})
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-500">
                    Create lists in the Lists & Segments module or add contacts to get started.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {availableLists.map((list) => {
                  const isChecked = selectedListIds.includes(list.id);
                  return (
                    <div
                      key={list.id}
                      onClick={() => toggleList(list.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked
                          ? "bg-blue-50/70 border-blue-400 text-slate-900 shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate text-slate-900">{list.name}</div>
                        {list.description && (
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {list.description}
                          </div>
                        )}
                        <div className="text-[10px] text-blue-600 font-semibold mt-2 font-mono">
                          {list.contactCount || 0} members
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SEGMENTS */}
        {activeAudienceTab === "segments" && (
          <div className="space-y-3">
            {availableSegments.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs">
                No dynamic segments defined yet. Define automated rule-based segments in Lists & Segments.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {availableSegments.map((seg) => {
                  const isChecked = selectedSegmentIds.includes(seg.id);
                  return (
                    <div
                      key={seg.id}
                      onClick={() => toggleSegment(seg.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked
                          ? "bg-indigo-50/70 border-indigo-400 text-slate-900 shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate text-slate-900">{seg.name}</div>
                        {seg.description && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {seg.description}
                          </div>
                        )}
                        <div className="text-[10px] text-indigo-600 font-semibold mt-2 font-mono">
                          {seg.matchingCount ?? 0} matching contacts
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CONTACTS */}
        {activeAudienceTab === "contacts" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search individual contacts by email, name or company..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs"
                />
              </div>
              {filteredContacts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const allFilteredIds = filteredContacts.map((c) => c.id);
                    const allSelected = allFilteredIds.every((id) =>
                      selectedContactIds.includes(id)
                    );
                    if (allSelected) {
                      // Deselect all filtered
                      onChange({
                        ...audienceConfig,
                        contactIds: selectedContactIds.filter(
                          (id) => !allFilteredIds.includes(id)
                        ),
                      });
                    } else {
                      // Select all filtered (union)
                      const next = Array.from(
                        new Set([...selectedContactIds, ...allFilteredIds])
                      );
                      onChange({ ...audienceConfig, contactIds: next });
                    }
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition shadow-xs shrink-0 cursor-pointer"
                >
                  {filteredContacts.every((c) => selectedContactIds.includes(c.id))
                    ? "Deselect All"
                    : `Select All (${filteredContacts.length})`}
                </button>
              )}
            </div>

            {availableContacts.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs">
                No contacts found in this workspace. Add contacts in the Contacts module first.
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs">
                No contacts match your search query &quot;{contactSearch}&quot;.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 shadow-xs">
                {filteredContacts.slice(0, 100).map((contact) => {
                  const isChecked = selectedContactIds.includes(contact.id);
                  const displayName =
                    contact.name ||
                    [contact.firstName, contact.lastName].filter(Boolean).join(" ");
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleContact(contact.id)}
                      className={`p-2.5 px-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors text-xs ${
                        isChecked ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <div className="truncate">
                          <span className="font-semibold text-slate-900 mr-2">{contact.email}</span>
                          {displayName && (
                            <span className="text-slate-500 text-[11px] mr-2">({displayName})</span>
                          )}
                          {contact.company && (
                            <span className="text-slate-400 text-[10px] hidden sm:inline">
                              • {contact.company}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {contact.verificationStatus === "VALID" ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            Valid
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                            {contact.verificationStatus || "Unverified"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EXCLUSIONS */}
        {activeAudienceTab === "exclusions" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p>
                Audience Exclusions guarantee that contacts belonging to any selected exclusion list are strictly omitted from this campaign, even if they appear in other chosen lists or segments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableLists.map((list) => {
                const isExcluded = excludedListIds.includes(list.id);
                return (
                  <div
                    key={list.id}
                    onClick={() => toggleExcludedList(list.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isExcluded
                        ? "bg-rose-50 border-rose-300 text-rose-900 shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isExcluded}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate text-slate-900">{list.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Exclude {list.contactCount || 0} members from send
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Eligible Recipients Sample Preview */}
      {breakdown && breakdown.sampleEligible.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Sample Eligible Recipients Preview</span>
            </div>
            <span className="text-[10px] text-slate-500">
              Showing top {breakdown.sampleEligible.length} of {breakdown.eligible}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] text-slate-600 uppercase border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3.5">Email Address</th>
                  <th className="py-2.5 px-3.5">Name</th>
                  <th className="py-2.5 px-3.5">Company</th>
                  <th className="py-2.5 px-3.5 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {breakdown.sampleEligible.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3.5 font-medium text-slate-900">{r.email}</td>
                    <td className="py-2 px-3.5 text-slate-600 font-sans">
                      {r.firstName || r.name || "—"}
                    </td>
                    <td className="py-2 px-3.5 text-slate-600 font-sans">{r.company || "—"}</td>
                    <td className="py-2 px-3.5 text-right">
                      <span className="text-emerald-700 font-semibold">{r.verificationStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
