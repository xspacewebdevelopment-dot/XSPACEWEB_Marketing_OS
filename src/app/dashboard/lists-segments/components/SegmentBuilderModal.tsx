"use client";

import { useState, useEffect } from "react";
import {
  X,
  Filter,
  Plus,
  Trash2,
  Loader2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Users,
  Sparkles,
} from "lucide-react";
import type {
  ContactListSummary,
  SegmentSummary,
  SegmentConditionGroup,
  SegmentCondition,
  SegmentFilterField,
  SegmentOperator,
} from "@/lib/types/contacts";

interface SegmentBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  lists: ContactListSummary[];
  segment: SegmentSummary | null;
  onSuccess: () => void;
}

export function SegmentBuilderModal({
  isOpen,
  onClose,
  lists,
  segment,
  onSuccess,
}: SegmentBuilderModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [matchType, setMatchType] = useState<"AND" | "OR">("AND");
  const [conditions, setConditions] = useState<SegmentCondition[]>([
    { field: "verificationStatus", operator: "equals", value: "VALID" },
  ]);

  // Live match state
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [sampleContacts, setSampleContacts] = useState<any[]>([]);
  const [calculatingCount, setCalculatingCount] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (segment) {
      setName(segment.name);
      setDescription(segment.description || "");
      if (segment.conditions) {
        setMatchType(segment.conditions.matchType || "AND");
        setConditions(
          segment.conditions.conditions && segment.conditions.conditions.length > 0
            ? segment.conditions.conditions
            : [{ field: "verificationStatus", operator: "equals", value: "VALID" }]
        );
      }
    } else {
      setName("");
      setDescription("");
      setMatchType("AND");
      setConditions([{ field: "verificationStatus", operator: "equals", value: "VALID" }]);
    }
  }, [segment, isOpen]);

  // Recalculate live count when conditions or matchType change
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setCalculatingCount(true);
      try {
        const payloadGroup: SegmentConditionGroup = {
          matchType,
          conditions,
        };
        const res = await fetch("/api/dashboard/segments/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conditions: payloadGroup }),
        });
        const data = await res.json();
        if (res.ok) {
          setLiveCount(data.matchingCount);
          setSampleContacts(data.sampleContacts || []);
        }
      } catch (e) {
        console.error("Preview evaluation failed", e);
      } finally {
        setCalculatingCount(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, matchType, conditions]);

  if (!isOpen) return null;

  const handleAddCondition = () => {
    setConditions((prev) => [
      ...prev,
      { field: "verificationStatus", operator: "equals", value: "VALID" },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    if (conditions.length <= 1) return;
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCondition = (index: number, updates: Partial<SegmentCondition>) => {
    setConditions((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        const updated = { ...c, ...updates };

        // Reset default values if field changed
        if (updates.field && updates.field !== c.field) {
          if (updates.field === "verificationStatus") {
            updated.operator = "equals";
            updated.value = "VALID";
          } else if (updates.field === "subscriptionStatus") {
            updated.operator = "equals";
            updated.value = "SUBSCRIBED";
          } else if (updates.field === "listId") {
            updated.operator = "equals";
            updated.value = lists[0]?.id || "";
          } else if (updates.field === "tag" || updates.field === "company" || updates.field === "email") {
            updated.operator = "contains";
            updated.value = "";
          }
        }
        return updated;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    const payloadConditions: SegmentConditionGroup = {
      matchType,
      conditions,
    };

    try {
      const url = segment ? `/api/dashboard/segments/${segment.id}` : "/api/dashboard/segments";
      const method = segment ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          conditions: payloadConditions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save segment");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {segment ? "Edit Dynamic Segment" : "Create Dynamic Segment"}
              </h2>
              <p className="text-xs text-slate-500">
                Rule-based audience dynamically populated from database queries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Segment Name & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Segment Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Valid Enterprise Decision Makers"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Verified valid emails in tech sector"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Filter Logic Switcher */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Filter Logic:</span>
              <div className="flex p-0.5 bg-slate-200/70 border border-slate-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMatchType("AND")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                    matchType === "AND"
                      ? "bg-white text-blue-600 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Match ALL (AND)
                </button>
                <button
                  type="button"
                  onClick={() => setMatchType("OR")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                    matchType === "OR"
                      ? "bg-white text-blue-600 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Match ANY (OR)
                </button>
              </div>
            </div>

            {/* Condition Rows */}
            <div className="space-y-2.5 pt-2">
              {conditions.map((cond, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs"
                >
                  {/* Field Selector */}
                  <select
                    value={cond.field}
                    onChange={(e) => handleUpdateCondition(idx, { field: e.target.value as SegmentFilterField })}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-500 shrink-0 cursor-pointer"
                  >
                    <option value="verificationStatus">Verification Status</option>
                    <option value="subscriptionStatus">Marketing Consent</option>
                    <option value="listId">List Membership</option>
                    <option value="company">Company</option>
                    <option value="tag">Tag</option>
                    <option value="email">Email</option>
                  </select>

                  {/* Operator Selector */}
                  <select
                    value={cond.operator}
                    onChange={(e) => handleUpdateCondition(idx, { operator: e.target.value as SegmentOperator })}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-500 shrink-0 cursor-pointer"
                  >
                    {cond.field === "verificationStatus" || cond.field === "subscriptionStatus" ? (
                      <>
                        <option value="equals">is equal to</option>
                        <option value="not_equals">is not equal to</option>
                      </>
                    ) : cond.field === "listId" ? (
                      <>
                        <option value="equals">belongs to list</option>
                        <option value="not_equals">not in list</option>
                      </>
                    ) : (
                      <>
                        <option value="contains">contains</option>
                        <option value="not_contains">does not contain</option>
                        <option value="equals">is exactly</option>
                      </>
                    )}
                  </select>

                  {/* Value Input */}
                  <div className="flex-1">
                    {cond.field === "verificationStatus" ? (
                      <select
                        value={cond.value}
                        onChange={(e) => handleUpdateCondition(idx, { value: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-500 cursor-pointer"
                      >
                        <option value="VALID">VALID (Passed Reoon)</option>
                        <option value="INVALID">INVALID (Hard bounce)</option>
                        <option value="RISKY">RISKY (Catch-all / Disposables)</option>
                        <option value="UNVERIFIED">UNVERIFIED</option>
                      </select>
                    ) : cond.field === "subscriptionStatus" ? (
                      <select
                        value={cond.value}
                        onChange={(e) => handleUpdateCondition(idx, { value: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-500 cursor-pointer"
                      >
                        <option value="SUBSCRIBED">Subscribed (Explicit opt-in)</option>
                        <option value="PENDING">Pending Consent</option>
                        <option value="UNSUBSCRIBED">Unsubscribed</option>
                      </select>
                    ) : cond.field === "listId" ? (
                      <select
                        value={cond.value}
                        onChange={(e) => handleUpdateCondition(idx, { value: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-500 cursor-pointer"
                      >
                        {lists.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={cond.value}
                        onChange={(e) => handleUpdateCondition(idx, { value: e.target.value })}
                        placeholder="Value to match..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
                      />
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    disabled={conditions.length <= 1}
                    onClick={() => handleRemoveCondition(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg transition cursor-pointer"
                    title="Remove rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddCondition}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 mt-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Rule
            </button>
          </div>

          {/* Live Matching Count Badge & Sample Preview Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Live Matching Audience</p>
                <div className="flex items-center gap-2">
                  {calculatingCount ? (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-blue-600" /> Calculating...
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-slate-900">
                      {liveCount !== null ? `${liveCount} contacts match this segment` : "—"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {sampleContacts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                {showPreview ? "Hide Preview" : "Preview Matches"}
              </button>
            )}
          </div>

          {/* Sample Contacts Preview Accordion */}
          {showPreview && sampleContacts.length > 0 && (
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in duration-150">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Sample Matches (Up to 10)
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {sampleContacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{c.name || c.email}</p>
                      {c.name && <p className="text-[10px] text-slate-500 font-mono">{c.email}</p>}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {c.verificationStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : segment ? (
                "Update Segment"
              ) : (
                "Save Dynamic Segment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
