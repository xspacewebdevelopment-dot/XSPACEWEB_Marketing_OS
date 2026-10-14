"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  X,
  Layers,
  Search,
  Download,
  Trash2,
  Mail,
  User,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import type { ContactListSummary, ContactItem } from "@/lib/types/contacts";

interface ListMembersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  list: ContactListSummary | null;
  onListUpdated: () => void;
}

export function ListMembersDrawer({
  isOpen,
  onClose,
  list,
  onListUpdated,
}: ListMembersDrawerProps) {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchMembers = useCallback(async () => {
    if (!list) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("listId", list.id);
      params.set("limit", "50");
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/dashboard/contacts?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.contacts) {
        setContacts(data.contacts);
        setTotalCount(data.pagination.total);
      }
    } catch (e) {
      console.error("Failed to load list members", e);
    } finally {
      setLoading(false);
    }
  }, [list, search]);

  useEffect(() => {
    if (isOpen && list) {
      fetchMembers();
    }
  }, [isOpen, list, fetchMembers]);

  if (!isOpen || !list) return null;

  const handleRemoveMember = async (contactId: string) => {
    if (!window.confirm("Remove this contact from the list?")) return;
    try {
      const res = await fetch(`/api/dashboard/lists/${list.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: [contactId] }),
      });
      if (res.ok) {
        fetchMembers();
        onListUpdated();
      }
    } catch (e) {
      alert("Failed to remove contact from list");
    }
  };

  const handleExportList = async () => {
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{list.name}</h2>
              <p className="text-xs text-slate-500">
                {totalCount} enrolled contact{totalCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportList}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Export List as CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts within list..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Loading members...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              {search ? "No contacts match your search." : "No contacts enrolled in this list yet."}
            </div>
          ) : (
            contacts.map((contact) => {
              const fullName =
                contact.name ||
                [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
                "Unnamed Contact";

              return (
                <div
                  key={contact.id}
                  className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 shadow-2xs transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                      {fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <Link
                        href={`/dashboard/contacts/${contact.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 transition flex items-center gap-1 group"
                      >
                        {fullName}
                        <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{contact.email}</p>
                      {contact.company && (
                        <p className="text-[10px] text-slate-400">{contact.company}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {contact.verificationStatus === "VALID" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Valid
                      </span>
                    ) : contact.verificationStatus === "INVALID" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Invalid
                      </span>
                    ) : null}

                    <button
                      onClick={() => handleRemoveMember(contact.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      title="Remove from list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
