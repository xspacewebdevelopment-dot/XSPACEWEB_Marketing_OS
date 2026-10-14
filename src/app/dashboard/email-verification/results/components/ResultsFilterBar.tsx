"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  RotateCcw,
  Calendar,
  Layers,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

interface FilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  source: string;
  onSourceChange: (source: string) => void;
  jobId: string;
  onJobIdChange: (jobId: string) => void;
  domain: string;
  onDomainChange: (domain: string) => void;
  isCatchAll: boolean | undefined;
  onCatchAllChange: (val: boolean | undefined) => void;
  isDisposable: boolean | undefined;
  onDisposableChange: (val: boolean | undefined) => void;
  isRoleBased: boolean | undefined;
  onRoleBasedChange: (val: boolean | undefined) => void;
  isDeliverable: boolean | undefined;
  onDeliverableChange: (val: boolean | undefined) => void;
  dateFrom: string;
  onDateFromChange: (val: string) => void;
  dateTo: string;
  onDateToChange: (val: string) => void;
  onClearFilters: () => void;
  isFiltered: boolean;
  totalFilteredCount: number;
  availableJobs: Array<{ id: string; filename: string; totalRecords: number }>;
}

export function ResultsFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  source,
  onSourceChange,
  jobId,
  onJobIdChange,
  domain,
  onDomainChange,
  isCatchAll,
  onCatchAllChange,
  isDisposable,
  onDisposableChange,
  isRoleBased,
  onRoleBasedChange,
  isDeliverable,
  onDeliverableChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClearFilters,
  isFiltered,
  totalFilteredCount,
  availableJobs,
}: FilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-4 space-y-3">
      {/* Primary Filter Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search email address..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: "ALL", label: "All Statuses" },
            { id: "VALID", label: "Valid", color: "hover:bg-emerald-50 text-emerald-700" },
            { id: "INVALID", label: "Invalid", color: "hover:bg-rose-50 text-rose-700" },
            { id: "RISKY", label: "Risky", color: "hover:bg-amber-50 text-amber-700" },
            { id: "UNKNOWN", label: "Unknown", color: "hover:bg-slate-100 text-slate-700" },
          ].map((item) => {
            const active = (status || "ALL").toUpperCase() === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onStatusChange(item.id === "ALL" ? "" : item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Source and Advanced Toggle */}
        <div className="flex items-center gap-2">
          {/* Source Dropdown */}
          <select
            value={source || "ALL"}
            onChange={(e) => onSourceChange(e.target.value === "ALL" ? "" : e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Sources</option>
            <option value="SINGLE">Single Verify</option>
            <option value="BULK">Bulk Lists</option>
          </select>

          {/* Job Dropdown if available */}
          {availableJobs.length > 0 && (
            <select
              value={jobId || "ALL"}
              onChange={(e) => onJobIdChange(e.target.value === "ALL" ? "" : e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500 max-w-[160px] truncate cursor-pointer"
            >
              <option value="ALL">All Jobs</option>
              {availableJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.filename} ({j.totalRecords})
                </option>
              ))}
            </select>
          )}

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              showAdvanced || isFiltered
                ? "border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>More Filters</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Advanced Filter Collapse */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Domain Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Email Domain</label>
            <input
              type="text"
              placeholder="e.g. gmail.com"
              value={domain}
              onChange={(e) => onDomainChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Disposable Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Disposable Mail</label>
            <select
              value={isDisposable === undefined ? "" : String(isDisposable)}
              onChange={(e) =>
                onDisposableChange(
                  e.target.value === "" ? undefined : e.target.value === "true"
                )
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="">Any</option>
              <option value="true">Disposable Only</option>
              <option value="false">Non-Disposable</option>
            </select>
          </div>

          {/* Catch-All Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Catch-All Server</label>
            <select
              value={isCatchAll === undefined ? "" : String(isCatchAll)}
              onChange={(e) =>
                onCatchAllChange(
                  e.target.value === "" ? undefined : e.target.value === "true"
                )
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="">Any</option>
              <option value="true">Catch-All Only</option>
              <option value="false">Strict Mailbox</option>
            </select>
          </div>

          {/* Role-Based Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Role-Based Account</label>
            <select
              value={isRoleBased === undefined ? "" : String(isRoleBased)}
              onChange={(e) =>
                onRoleBasedChange(
                  e.target.value === "" ? undefined : e.target.value === "true"
                )
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="">Any</option>
              <option value="true">Role-Based (e.g. info@)</option>
              <option value="false">Personal Mailbox</option>
            </select>
          </div>

          {/* Date From */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Verified From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Date To */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600">Verified To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Filter Status & Reset Action */}
      {isFiltered && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900">{totalFilteredCount}</span>
            <span>records matching active criteria</span>
          </div>
          <button
            onClick={onClearFilters}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
