"use client";

import { useState, useEffect } from "react";
import {
  X,
  ShieldAlert,
  Loader2,
  Users,
  Mail,
  Search,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Square,
  UserCheck,
} from "lucide-react";
import type { SuppressionReason } from "@/lib/types/suppression";

interface AddSuppressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddSuppressionModal({ isOpen, onClose, onSuccess }: AddSuppressionModalProps) {
  const [mode, setMode] = useState<"contacts" | "manual">("contacts");

  // Manual mode state
  const [email, setEmail] = useState("");

  // Contacts mode state
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContactEmails, setSelectedContactEmails] = useState<string[]>([]);

  // Shared state
  const [reason, setReason] = useState<SuppressionReason>("MANUAL_BLOCK");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search contacts when in contacts mode
  useEffect(() => {
    if (!isOpen || mode !== "contacts") return;

    const timer = setTimeout(async () => {
      setLoadingContacts(true);
      try {
        const params = new URLSearchParams({ limit: "15" });
        if (contactSearch.trim()) params.set("search", contactSearch.trim());

        const res = await fetch(`/api/dashboard/contacts?${params.toString()}`);
        const data = await res.json();
        if (res.ok && data.contacts) {
          setContacts(data.contacts);
        }
      } catch (err) {
        console.error("Failed to load contacts for suppression picker", err);
      } finally {
        setLoadingContacts(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [isOpen, mode, contactSearch]);

  if (!isOpen) return null;

  const toggleSelectEmail = (e: string) => {
    setSelectedContactEmails((prev) =>
      prev.includes(e) ? prev.filter((item) => item !== e) : [...prev, e]
    );
  };

  const handleSelectAllContacts = () => {
    if (selectedContactEmails.length === contacts.length) {
      setSelectedContactEmails([]);
    } else {
      setSelectedContactEmails(contacts.map((c) => c.email));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let body: any;
      if (mode === "manual") {
        if (!email.trim()) throw new Error("Please provide a valid email address");
        body = { email: email.trim(), reason, notes: notes || undefined };
      } else {
        if (selectedContactEmails.length === 0) {
          throw new Error("Please select at least one contact to suppress");
        }
        body = { emails: selectedContactEmails, reason, notes: notes || undefined };
      }

      const res = await fetch("/api/dashboard/email-verification/suppression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add suppression entry");
      }

      onSuccess();
      onClose();
      setEmail("");
      setSelectedContactEmails([]);
      setNotes("");
      setReason("MANUAL_BLOCK");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 text-slate-900 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add Suppression Entry</h3>
              <p className="text-[11px] text-slate-500">Prevent future dispatches across all campaigns</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
            {error}
          </div>
        )}

        {/* Mode Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setMode("contacts")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              mode === "contacts"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Select from Contacts
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              mode === "manual"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Enter Email Manually
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Mode 1: Search & Pick Contacts */}
          {mode === "contacts" && (
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search contacts by name, email, or phone..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>
                  {selectedContactEmails.length} contact{selectedContactEmails.length === 1 ? "" : "s"} selected
                </span>
                {contacts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllContacts}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    {selectedContactEmails.length === contacts.length ? "Deselect All" : "Select All Shown"}
                  </button>
                )}
              </div>

              {/* Contacts Picker Table/List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                {loadingContacts ? (
                  <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    Loading contacts...
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No contacts found. Try adjusting your search query.
                  </div>
                ) : (
                  contacts.map((c) => {
                    const isSelected = selectedContactEmails.includes(c.email);
                    const name =
                      c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unnamed Contact";
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleSelectEmail(c.email)}
                        className={`p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 transition ${
                          isSelected ? "bg-indigo-50/60" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-slate-900">{name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{c.email}</p>
                          </div>
                        </div>

                        {c.isSuppressed && (
                          <span className="text-[10px] font-semibold text-rose-600 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200">
                            Already Suppressed
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Mode 2: Manual Email Input */}
          {mode === "manual" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
              />
              <p className="text-[11px] text-slate-400">
                Manual suppression will prevent sends to this address without creating a contact record.
              </p>
            </div>
          )}

          {/* Suppression Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Suppression Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as SuppressionReason)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all cursor-pointer font-medium"
            >
              <option value="MANUAL_BLOCK">Manual Block (Admin preference)</option>
              <option value="DO_NOT_CONTACT">Do Not Contact (Explicit recipient request)</option>
              <option value="UNSUBSCRIBED">Unsubscribed (Documented opt-out evidence)</option>
              <option value="HARD_BOUNCE">Hard Bounce (Permanent delivery failure)</option>
              <option value="SPAM_COMPLAINT">Spam Complaint (Recipient abuse report)</option>
              <option value="SYSTEM_EXCLUSION">System Exclusion (Policy or domain level)</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Audit Notes (Optional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Context or documentation reason..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                (mode === "manual" && !email.trim()) ||
                (mode === "contacts" && selectedContactEmails.length === 0)
              }
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Suppression"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
