"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Mail,
  Users,
  Sparkles,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Check,
  User,
  Filter,
} from "lucide-react";
import type { AudienceConfig, AudienceBreakdown } from "@/lib/types/campaigns";

interface ContactItem {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  company?: string | null;
  verificationStatus?: string;
  subscriptionStatus?: string;
}

interface BroadcastDetailsSegmentProps {
  name: string;
  subject: string;
  preheader: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  audienceConfig: AudienceConfig;
  audienceBreakdown: AudienceBreakdown | null;
  onUpdate: (fields: Partial<{
    name: string;
    subject: string;
    preheader: string;
    fromName: string;
    fromEmail: string;
    replyTo: string;
    audienceConfig: AudienceConfig;
  }>) => void;
}

export function BroadcastDetailsSegment({
  name,
  subject,
  preheader,
  fromName,
  fromEmail,
  replyTo,
  audienceConfig,
  audienceBreakdown,
  onUpdate,
}: BroadcastDetailsSegmentProps) {
  const [showSenderAdvanced, setShowSenderAdvanced] = useState(false);
  const [searchContact, setSearchContact] = useState("");
  const [contactsList, setContactsList] = useState<ContactItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Load all workspace contacts directly for immediate rich display
  useEffect(() => {
    async function fetchWorkspaceContacts() {
      try {
        setLoadingContacts(true);
        const res = await fetch("/api/dashboard/contacts?limit=100");
        if (res.ok) {
          const json = await res.json();
          if (json.contacts && Array.isArray(json.contacts)) {
            setContactsList(json.contacts);
          }
        }
      } catch (err) {
        console.warn("Could not load contacts preview:", err);
      } finally {
        setLoadingContacts(false);
      }
    }
    fetchWorkspaceContacts();
  }, []);

  // Merge with audienceBreakdown sampleEligible if contactsList is empty
  const activeContacts: ContactItem[] = useMemo(() => {
    if (contactsList.length > 0) return contactsList;
    if (audienceBreakdown?.sampleEligible && audienceBreakdown.sampleEligible.length > 0) {
      return audienceBreakdown.sampleEligible;
    }
    return [];
  }, [contactsList, audienceBreakdown]);

  // Filtered contacts by search
  const filteredContacts = useMemo(() => {
    if (!searchContact.trim()) return activeContacts;
    const q = searchContact.toLowerCase().trim();
    return activeContacts.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q) ||
        c.firstName?.toLowerCase().includes(q) ||
        c.lastName?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q)
    );
  }, [activeContacts, searchContact]);

  const excludedIds = useMemo(() => {
    return new Set(audienceConfig.excludedContactIds || []);
  }, [audienceConfig.excludedContactIds]);

  const toggleExcludeContact = (contactId: string) => {
    const current = audienceConfig.excludedContactIds || [];
    const next = current.includes(contactId)
      ? current.filter((id) => id !== contactId)
      : [...current, contactId];

    onUpdate({
      audienceConfig: {
        ...audienceConfig,
        allContacts: true,
        excludedContactIds: next,
      },
    });
  };

  const insertMergeTag = (tag: string) => {
    onUpdate({ subject: subject ? `${subject} ${tag}` : tag });
  };

  const totalEligible = audienceBreakdown?.eligible ?? activeContacts.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">1. Campaign Broadcast Details</h2>
            <p className="text-xs text-slate-500">Configure your broadcast title, subject line, and audience recipients.</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>{totalEligible} Eligible Recipients</span>
        </div>
      </div>

      {/* Campaign Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 block">
          Campaign Name <span className="text-slate-400 font-normal">(Internal reference)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="e.g. Weekly Product Update & Feature Highlights"
          className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
        />
      </div>

      {/* Subject Line & Personalization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700">
            Subject Line <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Merge tags:</span>
            <button
              type="button"
              onClick={() => insertMergeTag("{{first_name}}")}
              className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200/60 cursor-pointer transition-colors"
            >
              + First Name
            </button>
            <button
              type="button"
              onClick={() => insertMergeTag("{{company}}")}
              className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200/60 cursor-pointer transition-colors"
            >
              + Company
            </button>
          </div>
        </div>

        <input
          type="text"
          value={subject}
          onChange={(e) => onUpdate({ subject: e.target.value })}
          placeholder="e.g. 🚀 Big News: New updates are live for your workspace!"
          className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
        />
      </div>

      {/* Preheader Preview Text */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 block">
          Preheader Snippet <span className="text-slate-400 font-normal">(Snippet displayed right after the subject in the inbox)</span>
        </label>
        <input
          type="text"
          value={preheader}
          onChange={(e) => onUpdate({ preheader: e.target.value })}
          placeholder="e.g. Check out the latest performance tools and instant deliverability tips..."
          className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
        />
      </div>

      {/* Audience Target: ALL CONTACTS WITH LIVE CONTACTS PREVIEW */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            <span>Target Audience (Broadcast to All Contacts)</span>
          </label>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
            Default: All Subscribers
          </span>
        </div>

        {/* Contacts Preview Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden shadow-2xs">
          {/* Card Top: Summary & Search Filter */}
          <div className="p-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-800">
                {activeContacts.length - excludedIds.size} of {activeContacts.length} Contacts Included
              </span>
              <span className="text-[10px] text-slate-400">•</span>
              <span className="text-[11px] text-slate-500">
                Broadcasting to entire workspace
              </span>
            </div>

            {activeContacts.length > 3 && (
              <div className="relative sm:w-48">
                <Search className="absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter contacts..."
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500 font-medium"
                />
              </div>
            )}
          </div>

          {/* Contacts List Body */}
          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {loadingContacts && activeContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Loading workspace contacts...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                {activeContacts.length === 0
                  ? "No contacts found in workspace yet. Add contacts in Audience > Contacts."
                  : "No contacts match your search."}
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isExcluded = excludedIds.has(contact.id);
                const displayName =
                  contact.name ||
                  [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
                  contact.email.split("@")[0];

                const initials = (contact.firstName?.[0] || contact.email[0] || "U").toUpperCase();

                return (
                  <div
                    key={contact.id}
                    onClick={() => toggleExcludeContact(contact.id)}
                    className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isExcluded
                        ? "bg-slate-100/60 opacity-60 text-slate-400"
                        : "hover:bg-blue-50/40 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Checkbox indicator */}
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          !isExcluded
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {!isExcluded && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>

                      {/* Initials Avatar */}
                      <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 border border-blue-200/60 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {contact.email}
                          </span>
                          {contact.company && (
                            <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                              • {contact.company}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {displayName !== contact.email ? displayName : "Subscriber"}
                        </div>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {contact.subscriptionStatus || "SUBSCRIBED"}
                      </span>
                      {contact.verificationStatus && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 hidden sm:inline">
                          {contact.verificationStatus}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>✓ All eligible subscribers will receive this email broadcast.</span>
            <span className="text-slate-400 text-[10px]">Click any contact to exclude</span>
          </div>
        </div>
      </div>

      {/* Sender Configuration */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowSenderAdvanced(!showSenderAdvanced)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 py-1 cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Sender Information: <strong>{fromName}</strong> ({fromEmail})</span>
          </div>
          {showSenderAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showSenderAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 animate-in fade-in duration-150">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">From Name</label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => onUpdate({ fromName: e.target.value })}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">From Email Address</label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => onUpdate({ fromEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-600 block">Reply-To Address (Optional)</label>
              <input
                type="email"
                value={replyTo}
                onChange={(e) => onUpdate({ replyTo: e.target.value })}
                placeholder="replies@yourdomain.com"
                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
