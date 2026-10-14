"use client";

import { useState } from "react";
import { X, Layers, Plus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { ContactListSummary } from "@/lib/types/contacts";

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactIds: string[];
  lists: ContactListSummary[];
  onSuccess: () => void;
}

export function AddToListModal({
  isOpen,
  onClose,
  contactIds,
  lists,
  onSuccess,
}: AddToListModalProps) {
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactIds || contactIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      let targetListId = selectedListId;

      // If user wants to create a new list
      if (isCreatingNew) {
        if (!newListName.trim()) {
          throw new Error("Please enter a name for the new list");
        }
        const createRes = await fetch("/api/dashboard/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newListName.trim(),
            description: newListDesc.trim() || undefined,
          }),
        });
        const createData = await createRes.json();
        if (!createRes.ok) {
          throw new Error(createData.error || "Failed to create new list");
        }
        targetListId = createData.list.id;
      }

      if (!targetListId) {
        throw new Error("Please select or create a list");
      }

      // Add contacts to the target list
      const res = await fetch(`/api/dashboard/lists/${targetListId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add contacts to list");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Add to Contact List</h2>
              <p className="text-xs text-slate-400">
                Adding {contactIds.length} contact{contactIds.length > 1 ? "s" : ""} to a list
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Toggle between existing and new */}
          <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                !isCreatingNew
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Existing List
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
                isCreatingNew
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              + Create New List
            </button>
          </div>

          {!isCreatingNew ? (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Destination List
              </label>
              {lists.length === 0 ? (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                  No lists exist yet. Create your first list using the tab above.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {lists.map((l) => (
                    <label
                      key={l.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        selectedListId === l.id
                          ? "bg-indigo-500/10 border-indigo-500 text-white"
                          : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="selectedList"
                          value={l.id}
                          checked={selectedListId === l.id}
                          onChange={(e) => setSelectedListId(e.target.value)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <p className="text-xs font-medium text-white">{l.name}</p>
                          {l.description && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                              {l.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                        {l.contactCount} contacts
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  List Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. VIP Enterprise Leads"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  placeholder="Short description of this audience list"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!isCreatingNew && !selectedListId) || (isCreatingNew && !newListName.trim())}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Contacts"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
