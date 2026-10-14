"use client";

import { Search, X, Filter } from "lucide-react";
import type {
  ContactVerificationStatus,
  ContactSubscriptionStatus,
  ContactListSummary,
} from "@/lib/types/contacts";

interface ContactsFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  verificationStatus: ContactVerificationStatus | "ALL";
  onVerificationStatusChange: (val: ContactVerificationStatus | "ALL") => void;
  suppressionStatus: "SUPPRESSED" | "UNSUPPRESSED" | "ALL";
  onSuppressionStatusChange: (val: "SUPPRESSED" | "UNSUPPRESSED" | "ALL") => void;
  subscriptionStatus: ContactSubscriptionStatus | "ALL";
  onSubscriptionStatusChange: (val: ContactSubscriptionStatus | "ALL") => void;
  listId: string;
  onListIdChange: (val: string) => void;
  lists: ContactListSummary[];
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function ContactsFilterBar({
  search,
  onSearchChange,
  verificationStatus,
  onVerificationStatusChange,
  suppressionStatus,
  onSuppressionStatusChange,
  subscriptionStatus,
  onSubscriptionStatusChange,
  listId,
  onListIdChange,
  lists,
  onReset,
  hasActiveFilters,
}: ContactsFilterBarProps) {
  return (
    <div className="p-3 sm:p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, email, phone, or company..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* List Selector */}
          <select
            value={listId}
            onChange={(e) => onListIdChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">All Lists</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.contactCount})
              </option>
            ))}
          </select>

          {/* Verification Status */}
          <select
            value={verificationStatus}
            onChange={(e) => onVerificationStatusChange(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ALL">All Verification</option>
            <option value="VALID">Valid Only</option>
            <option value="RISKY">Risky Only</option>
            <option value="INVALID">Invalid Only</option>
            <option value="UNVERIFIED">Unverified Only</option>
            <option value="UNKNOWN">Unknown</option>
          </select>

          {/* Suppression Status */}
          <select
            value={suppressionStatus}
            onChange={(e) => onSuppressionStatusChange(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ALL">All Suppression</option>
            <option value="SUPPRESSED">Suppressed Only</option>
            <option value="UNSUPPRESSED">Unsuppressed Only</option>
          </select>

          {/* Consent / Subscription Status */}
          <select
            value={subscriptionStatus}
            onChange={(e) => onSubscriptionStatusChange(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ALL">All Consent</option>
            <option value="SUBSCRIBED">Subscribed (Opt-In)</option>
            <option value="PENDING">Pending Consent</option>
            <option value="UNSUBSCRIBED">Unsubscribed</option>
            <option value="BOUNCED">Bounced</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 font-medium transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
