"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Search,
  Filter,
  CheckSquare,
  Square,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  Layers,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Ban,
  Tag,
  Building,
  Mail,
  Phone,
  User,
  Sparkles,
} from "lucide-react";

import { ContactsFilterBar } from "./components/ContactsFilterBar";
import { AddContactModal } from "./components/AddContactModal";
import { EditContactModal } from "./components/EditContactModal";
import { BulkImportContactsModal } from "./components/BulkImportContactsModal";
import { AddToListModal } from "./components/AddToListModal";
import { SuppressContactModal } from "./components/SuppressContactModal";

import type {
  ContactItem,
  ContactStats,
  ContactListSummary,
  ContactVerificationStatus,
  ContactSubscriptionStatus,
} from "@/lib/types/contacts";

export default function ContactsPage() {
  // Data state
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [stats, setStats] = useState<ContactStats>({
    totalContacts: 0,
    validCount: 0,
    invalidCount: 0,
    riskyCount: 0,
    unverifiedCount: 0,
    suppressedCount: 0,
    subscribedCount: 0,
  });
  const [lists, setLists] = useState<ContactListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Query filters
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<ContactVerificationStatus | "ALL">("ALL");
  const [suppressionStatus, setSuppressionStatus] = useState<"SUPPRESSED" | "UNSUPPRESSED" | "ALL">("ALL");
  const [subscriptionStatus, setSubscriptionStatus] = useState<ContactSubscriptionStatus | "ALL">("ALL");
  const [listId, setListId] = useState<string>("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);
  const [suppressingContact, setSuppressingContact] = useState<ContactItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ContactItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Lists for filters & assignments
  const fetchLists = async () => {
    try {
      const res = await fetch("/api/dashboard/lists");
      const data = await res.json();
      if (res.ok && data.lists) {
        setLists(data.lists);
      }
    } catch (e) {
      console.error("Failed to fetch lists", e);
    }
  };

  // Fetch KPIs
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/contacts/stats");
      const data = await res.json();
      if (res.ok && data.stats) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch contact stats", e);
    }
  };

  // Fetch Contacts with active filters
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      if (search.trim()) params.set("search", search.trim());
      if (verificationStatus && verificationStatus !== "ALL") {
        params.set("verificationStatus", verificationStatus);
      }
      if (suppressionStatus && suppressionStatus !== "ALL") {
        params.set("suppressionStatus", suppressionStatus);
      }
      if (subscriptionStatus && subscriptionStatus !== "ALL") {
        params.set("subscriptionStatus", subscriptionStatus);
      }
      if (listId) {
        params.set("listId", listId);
      }

      const res = await fetch(`/api/dashboard/contacts?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.contacts) {
        setContacts(data.contacts);
        setTotalCount(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (e) {
      console.error("Failed to fetch contacts", e);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, verificationStatus, suppressionStatus, subscriptionStatus, listId]);

  useEffect(() => {
    fetchLists();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Delete Contact handler
  const handleDeleteContact = async (contactId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/dashboard/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteCandidate(null);
        setSelectedIds((prev) => prev.filter((i) => i !== contactId));
        fetchContacts();
        fetchStats();
      }
    } catch (e) {
      console.error("Delete failed", e);
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} contact(s)? Active suppression records will remain safe.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/dashboard/contacts/${id}`, { method: "DELETE" })
        )
      );
      setSelectedIds([]);
      fetchContacts();
      fetchStats();
    } catch (e) {
      console.error("Bulk delete failed", e);
    } finally {
      setActionLoading(false);
    }
  };

  // Export handlers
  const handleExport = async (format: "csv" | "xlsx") => {
    try {
      const payload: any = {
        format,
      };
      if (selectedIds.length > 0) {
        payload.contactIds = selectedIds;
      } else {
        if (search) payload.search = search;
        if (verificationStatus !== "ALL") payload.verificationStatus = verificationStatus;
        if (suppressionStatus !== "ALL") payload.suppressionStatus = suppressionStatus;
        if (subscriptionStatus !== "ALL") payload.subscriptionStatus = subscriptionStatus;
        if (listId) payload.listId = listId;
      }

      const res = await fetch("/api/dashboard/contacts/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export contacts");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contacts</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized audience directory with verified deliverability and suppression protection
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => handleExport("csv")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-xs font-semibold text-purple-700 shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-purple-600" />
            <span>Import Contacts</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <ContactsFilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        verificationStatus={verificationStatus}
        onVerificationStatusChange={(v) => {
          setVerificationStatus(v);
          setPage(1);
        }}
        suppressionStatus={suppressionStatus}
        onSuppressionStatusChange={(v) => {
          setSuppressionStatus(v);
          setPage(1);
        }}
        subscriptionStatus={subscriptionStatus}
        onSubscriptionStatusChange={(v) => {
          setSubscriptionStatus(v);
          setPage(1);
        }}
        listId={listId}
        onListIdChange={(v) => {
          setListId(v);
          setPage(1);
        }}
        lists={lists}
        onReset={() => {
          setSearch("");
          setVerificationStatus("ALL");
          setSuppressionStatus("ALL");
          setSubscriptionStatus("ALL");
          setListId("");
          setPage(1);
        }}
        hasActiveFilters={Boolean(
          search ||
          verificationStatus !== "ALL" ||
          suppressionStatus !== "ALL" ||
          subscriptionStatus !== "ALL" ||
          listId
        )}
      />

      {/* Bulk Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-blue-700 px-2.5 py-1 rounded-lg bg-blue-100/80 border border-blue-200">
              {selectedIds.length} contact{selectedIds.length > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer"
            >
              Deselect all
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddToListModal(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              Add to List
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export Selected
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={actionLoading}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title="Select All"
                  >
                    {contacts.length > 0 && selectedIds.length === contacts.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Company & Role</th>
                <th className="px-4 py-3.5">Verification</th>
                <th className="px-4 py-3.5">Suppression</th>
                <th className="px-4 py-3.5">Lists</th>
                <th className="px-4 py-3.5">Tags</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <p className="text-xs font-medium text-slate-500">Loading contacts from PostgreSQL...</p>
                    </div>
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">No contacts found</p>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          {search || verificationStatus !== "ALL" || suppressionStatus !== "ALL" || subscriptionStatus !== "ALL" || listId
                            ? "Try adjusting your search query or clearing your filter selections."
                            : "Get started by adding your first contact manually or importing a list."}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add Contact</span>
                        </button>
                        <button
                          onClick={() => setShowImportModal(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Import CSV</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => {
                  const isSelected = selectedIds.includes(contact.id);
                  const fullName =
                    contact.name ||
                    [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
                    "Unnamed Contact";

                  return (
                    <tr
                      key={contact.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? "bg-blue-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleSelect(contact.id)}
                          className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Contact Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <Link
                              href={`/dashboard/contacts/${contact.id}`}
                              className="font-semibold text-slate-900 hover:text-blue-600 transition inline-flex items-center gap-1.5 group leading-snug"
                            >
                              <span>{fullName}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono leading-snug">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{contact.email}</span>
                            </div>
                            {contact.phone && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 leading-snug">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Company & Role */}
                      <td className="px-5 py-3.5">
                        {contact.company ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="font-medium text-slate-800 flex items-center gap-1.5 leading-snug">
                              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{contact.company}</span>
                            </div>
                            {contact.jobTitle && (
                              <p className="text-[11px] text-slate-500 pl-5 leading-snug">{contact.jobTitle}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Verification Status */}
                      <td className="px-4 py-3.5">
                        {contact.verificationStatus === "VALID" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Valid
                          </span>
                        ) : contact.verificationStatus === "INVALID" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Invalid
                          </span>
                        ) : contact.verificationStatus === "RISKY" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Risky
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <HelpCircle className="w-3 h-3 text-slate-400" />
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Suppression Status */}
                      <td className="px-4 py-3.5">
                        {contact.isSuppressed ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <ShieldAlert className="w-3 h-3" />
                              Suppressed
                            </span>
                            {contact.suppressionReason && (
                              <span className="text-[10px] text-rose-600/90 font-mono pl-1">
                                {contact.suppressionReason.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-500 font-medium">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Lists */}
                      <td className="px-4 py-3.5">
                        {contact.lists && contact.lists.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {contact.lists.slice(0, 2).map((l) => (
                              <span
                                key={l.id}
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 border border-blue-200 text-blue-700 truncate max-w-[120px]"
                                title={l.name}
                              >
                                {l.name}
                              </span>
                            ))}
                            {contact.lists.length > 2 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200 text-slate-500">
                                +{contact.lists.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Tags */}
                      <td className="px-4 py-3.5">
                        {contact.tags && contact.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {contact.tags.slice(0, 2).map((tag, ti) => (
                              <span
                                key={ti}
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {tag}
                              </span>
                            ))}
                            {contact.tags.length > 2 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400">
                                +{contact.tags.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/contacts/${contact.id}`}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                            title="View Contact Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => setEditingContact(contact)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                            title="Edit Contact"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {!contact.isSuppressed && (
                            <button
                              onClick={() => setSuppressingContact(contact)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                              title="Suppress Email"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteCandidate(contact)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                            title="Delete Contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {contacts.length > 0 ? (page - 1) * limit + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-900">
              {Math.min(page * limit, totalCount)}
            </span>{" "}
            of <span className="font-semibold text-slate-900">{totalCount}</span> contacts
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Contact</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">{deleteCandidate.email}</span>?
              {deleteCandidate.isSuppressed && (
                <span className="block mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                  Notice: This email's suppression record will remain in the workspace suppression
                  list to protect your sender reputation.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleDeleteContact(deleteCandidate.id)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        lists={lists}
        onSuccess={() => {
          fetchContacts();
          fetchStats();
        }}
      />

      {/* Edit Contact Modal */}
      <EditContactModal
        isOpen={!!editingContact}
        onClose={() => setEditingContact(null)}
        contact={editingContact}
        lists={lists}
        onSuccess={() => {
          fetchContacts();
          fetchStats();
        }}
      />

      {/* Bulk Import Modal */}
      <BulkImportContactsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        lists={lists}
        onSuccess={() => {
          fetchContacts();
          fetchStats();
          fetchLists();
        }}
      />

      {/* Add to List Modal */}
      <AddToListModal
        isOpen={showAddToListModal}
        onClose={() => setShowAddToListModal(false)}
        contactIds={selectedIds}
        lists={lists}
        onSuccess={() => {
          setSelectedIds([]);
          fetchContacts();
          fetchLists();
        }}
      />

      {/* Suppress Modal */}
      {suppressingContact && (
        <SuppressContactModal
          isOpen={!!suppressingContact}
          onClose={() => setSuppressingContact(null)}
          contactId={suppressingContact.id}
          contactEmail={suppressingContact.email}
          contactName={suppressingContact.name}
          onSuccess={() => {
            fetchContacts();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
