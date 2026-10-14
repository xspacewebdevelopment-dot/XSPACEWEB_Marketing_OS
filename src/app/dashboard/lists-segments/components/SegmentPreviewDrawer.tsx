"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Filter,
  Users,
  ExternalLink,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import type { SegmentSummary } from "@/lib/types/contacts";

interface SegmentPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  segment: SegmentSummary | null;
}

export function SegmentPreviewDrawer({
  isOpen,
  onClose,
  segment,
}: SegmentPreviewDrawerProps) {
  const [matchingCount, setMatchingCount] = useState<number>(0);
  const [sampleContacts, setSampleContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !segment) return;

    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/dashboard/segments/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conditions: segment.conditions, limit: 20 }),
        });
        const data = await res.json();
        if (res.ok) {
          setMatchingCount(data.matchingCount);
          setSampleContacts(data.sampleContacts || []);
        }
      } catch (e) {
        console.error("Failed to load segment preview", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [isOpen, segment]);

  if (!isOpen || !segment) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{segment.name}</h2>
              <p className="text-xs text-slate-500">Dynamic Segment Preview</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Matching Contacts:</span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                {matchingCount} contacts
              </span>
            </div>
            {segment.description && (
              <p className="text-xs text-slate-600 pt-1 border-t border-slate-200">
                {segment.description}
              </p>
            )}
          </div>

          {/* Condition Rules */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Segment Rules ({segment.conditions?.matchType || "AND"})
            </h3>
            <div className="space-y-1.5">
              {segment.conditions?.conditions?.map((c, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between"
                >
                  <span className="text-slate-600 font-medium">{c.field}</span>
                  <span className="text-blue-600 font-mono text-[11px] font-semibold">{c.operator}</span>
                  <span className="text-slate-900 font-bold">{String(c.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Contacts */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sample Matches (First 20)
            </h3>
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <p className="text-xs font-medium">Evaluating segment matches...</p>
              </div>
            ) : sampleContacts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No contacts currently match the specified segment criteria.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {sampleContacts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-2xs hover:border-slate-300 transition"
                  >
                    <div>
                      <Link
                        href={`/dashboard/contacts/${c.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 transition flex items-center gap-1 group"
                      >
                        {c.name || c.email}
                        <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      {c.name && <p className="text-[11px] text-slate-500 font-mono mt-0.5">{c.email}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {c.verificationStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
