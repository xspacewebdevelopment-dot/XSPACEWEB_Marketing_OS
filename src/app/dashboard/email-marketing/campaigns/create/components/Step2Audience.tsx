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

        if (listsRes.ok) {
          const lJson = await listsRes.json();
          setAvailableLists(lJson.data || []);
        }
        if (segmentsRes.ok) {
          const sJson = await segmentsRes.json();
          setAvailableSegments(sJson.data || []);
        }
        if (contactsRes.ok) {
          const cJson = await contactsRes.json();
          setAvailableContacts(cJson.data || []);
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
        c.email.toLowerCase().includes(q) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q))
    );
  }, [availableContacts, contactSearch]);

  return (
    <div className="space-y-6 select-none">
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Step 2: Audience Selection & Exclusion</h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect contact lists, dynamic segments, or individual contacts with automated deduplication and suppression filtering.
          </p>
        </div>
        <button
          type="button"
          onClick={onRecalculate}
          disabled={calculating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-600 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${calculating ? "animate-spin text-blue-400" : ""}`} />
          <span>Recalculate</span>
        </button>
      </div>

      {/* Real-time Audience Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="p-3 rounded-xl bg-[#0a1829] border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Total Raw</span>
          <span className="text-sm font-bold text-white">{breakdown?.totalRaw ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-[#0a1829] border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Selected</span>
          <span className="text-sm font-bold text-slate-200">{breakdown?.selected ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-[#0a1829] border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Duplicates</span>
          <span className="text-sm font-bold text-amber-400">-{breakdown?.duplicates ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-[#0a1829] border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Suppressed</span>
          <span className="text-sm font-bold text-rose-400">-{breakdown?.suppressed ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-[#0a1829] border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Unsubscribed</span>
          <span className="text-sm font-bold text-red-400">-{breakdown?.unsubscribed ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-[#0a1829] border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Invalid/Risky</span>
          <span className="text-sm font-bold text-orange-400">-{breakdown?.invalidOrRisky ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Eligible Net</span>
          <span className="text-base font-extrabold text-blue-300">{breakdown?.eligible ?? 0}</span>
        </div>
      </div>

      {/* Audience Source Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-1 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveAudienceTab("lists")}
            className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 ${
              activeAudienceTab === "lists"
                ? "text-blue-400 border-blue-500 bg-blue-500/5"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Contact Lists ({selectedListIds.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAudienceTab("segments")}
            className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 ${
              activeAudienceTab === "segments"
                ? "text-blue-400 border-blue-500 bg-blue-500/5"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Dynamic Segments ({selectedSegmentIds.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAudienceTab("contacts")}
            className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 ${
              activeAudienceTab === "contacts"
                ? "text-blue-400 border-blue-500 bg-blue-500/5"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Individual Contacts ({selectedContactIds.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAudienceTab("exclusions")}
            className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 ${
              activeAudienceTab === "exclusions"
                ? "text-rose-400 border-rose-500 bg-rose-500/5"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <UserX className="h-3.5 w-3.5 text-rose-400" />
            <span>Exclusions ({excludedListIds.length})</span>
          </button>
        </div>

        {/* TAB 1: LISTS */}
        {activeAudienceTab === "lists" && (
          <div className="space-y-3">
            {availableLists.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-slate-800 bg-[#0a1829]/50 text-slate-400 text-xs">
                No contact lists created yet in this workspace. Create lists in the Lists & Segments module.
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
                          ? "bg-blue-600/15 border-blue-500 text-white shadow-xs"
                          : "bg-[#0a1829] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{list.name}</div>
                        {list.description && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {list.description}
                          </div>
                        )}
                        <div className="text-[10px] text-blue-400 mt-2 font-mono">
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
              <div className="p-8 text-center rounded-xl border border-slate-800 bg-[#0a1829]/50 text-slate-400 text-xs">
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
                          ? "bg-indigo-600/15 border-indigo-500 text-white shadow-xs"
                          : "bg-[#0a1829] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{seg.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {seg.description || "Dynamic conditions filter"}
                        </div>
                        <div className="text-[10px] text-indigo-400 mt-2 font-mono">
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search individual contacts by email, name or company..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full bg-[#0a1829] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-[#0a1829]/60 divide-y divide-slate-800/60">
              {filteredContacts.slice(0, 50).map((contact) => {
                const isChecked = selectedContactIds.includes(contact.id);
                return (
                  <div
                    key={contact.id}
                    onClick={() => toggleContact(contact.id)}
                    className="p-2.5 px-3 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <div className="truncate">
                        <span className="font-semibold text-white mr-2">{contact.email}</span>
                        {contact.name && (
                          <span className="text-slate-400 text-[11px]">({contact.name})</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {contact.verificationStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: EXCLUSIONS */}
        {activeAudienceTab === "exclusions" && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-[11px] text-rose-300 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
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
                        ? "bg-rose-950/30 border-rose-600/60 text-white"
                        : "bg-[#0a1829] border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isExcluded}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{list.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
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
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Sample Eligible Recipients Preview</span>
            </div>
            <span className="text-[10px] text-slate-400">
              Showing top {breakdown.sampleEligible.length} of {breakdown.eligible}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0a1829]/60 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0a1829] text-[10px] text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Email Address</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Company</th>
                  <th className="py-2 px-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {breakdown.sampleEligible.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-medium text-slate-200">{r.email}</td>
                    <td className="py-2 px-3 text-slate-400 font-sans">
                      {r.firstName || r.name || "—"}
                    </td>
                    <td className="py-2 px-3 text-slate-400 font-sans">{r.company || "—"}</td>
                    <td className="py-2 px-3 text-right">
                      <span className="text-emerald-400 font-semibold">{r.verificationStatus}</span>
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
