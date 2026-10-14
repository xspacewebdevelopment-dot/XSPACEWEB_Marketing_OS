"use client";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from "lucide-react";
import { parseFileContent, ParsedFileResult } from "@/lib/file-parser";
import type { ContactListSummary } from "@/lib/types/contacts";

interface BulkImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lists: ContactListSummary[];
  onSuccess: () => void;
}

export function BulkImportContactsModal({
  isOpen,
  onClose,
  lists,
  onSuccess,
}: BulkImportContactsModalProps) {
  const [step, setStep] = useState<"upload" | "map" | "importing" | "complete">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedFileResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Field mappings: index in headers
  const [emailCol, setEmailCol] = useState<number>(-1);
  const [firstNameCol, setFirstNameCol] = useState<number>(-1);
  const [lastNameCol, setLastNameCol] = useState<number>(-1);
  const [phoneCol, setPhoneCol] = useState<number>(-1);
  const [companyCol, setCompanyCol] = useState<number>(-1);
  const [jobTitleCol, setJobTitleCol] = useState<number>(-1);

  // Options
  const [duplicateStrategy, setDuplicateStrategy] = useState<"skip" | "update">("skip");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [newListName, setNewListName] = useState<string>("");
  const [tagInput, setTagInput] = useState<string>("");

  // Result state
  const [importResult, setImportResult] = useState<{
    totalProcessed: number;
    createdCount: number;
    updatedCount: number;
    skippedDuplicates: number;
    errorCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setParseError(null);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const result = parseFileContent(selectedFile.name, buffer);
      setParsed(result);

      // Auto-detect columns based on headers
      const headers = result.headers.map((h) => h.toLowerCase().trim());
      const emailIdx = headers.findIndex((h) => h.includes("email") || h.includes("mail"));
      setEmailCol(emailIdx !== -1 ? emailIdx : result.suggestedEmailColumnIndex);

      const firstIdx = headers.findIndex((h) => h.includes("first") || h === "fname" || h === "name");
      setFirstNameCol(firstIdx);

      const lastIdx = headers.findIndex((h) => h.includes("last") || h === "lname" || h === "surname");
      setLastNameCol(lastIdx);

      const phoneIdx = headers.findIndex((h) => h.includes("phone") || h.includes("mobile") || h.includes("tel"));
      setPhoneCol(phoneIdx);

      const compIdx = headers.findIndex((h) => h.includes("company") || h.includes("org") || h.includes("business"));
      setCompanyCol(compIdx);

      const jobIdx = headers.findIndex((h) => h.includes("title") || h.includes("job") || h.includes("position") || h.includes("role"));
      setJobTitleCol(jobIdx);

      setStep("map");
    } catch (err: any) {
      setParseError(err.message || "Failed to parse file. Ensure it is a valid CSV, XLSX, or TXT file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!parsed || emailCol === -1) {
      setError("Please map the Email column to proceed.");
      return;
    }

    setLoading(true);
    setError(null);
    setStep("importing");

    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    // Transform parsed rows into contact payload
    const contactsPayload = parsed.allRows
      .map((row) => {
        const email = row[emailCol]?.trim();
        if (!email) return null;

        const firstName = firstNameCol !== -1 && row[firstNameCol] ? row[firstNameCol].trim() : undefined;
        const lastName = lastNameCol !== -1 && row[lastNameCol] ? row[lastNameCol].trim() : undefined;
        const phone = phoneCol !== -1 && row[phoneCol] ? row[phoneCol].trim() : undefined;
        const company = companyCol !== -1 && row[companyCol] ? row[companyCol].trim() : undefined;
        const jobTitle = jobTitleCol !== -1 && row[jobTitleCol] ? row[jobTitleCol].trim() : undefined;

        return {
          email,
          firstName,
          lastName,
          phone,
          company,
          jobTitle,
          tags,
          subscriptionStatus: "PENDING" as const, // Never assume consent
        };
      })
      .filter(Boolean);

    if (contactsPayload.length === 0) {
      setError("No valid email rows found in the selected mapping.");
      setStep("map");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/dashboard/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: contactsPayload,
          listId: selectedListId === "new" ? undefined : selectedListId || undefined,
          newListName: selectedListId === "new" && newListName.trim() ? newListName.trim() : undefined,
          duplicateStrategy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import contacts");
      }

      setImportResult(data.summary);
      setStep("complete");
    } catch (err: any) {
      setError(err.message || "Import failed. Please try again.");
      setStep("map");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setStep("upload");
    setFile(null);
    setParsed(null);
    setImportResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Import Contacts</h2>
              <p className="text-xs text-slate-400">Upload CSV, XLSX, or TXT file to populate your audience</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (step === "complete") {
                onSuccess();
              }
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  dragOver
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-400 mt-1">Supports CSV, XLSX, and TXT (one email per line or delimited)</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">CSV</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">XLSX</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">TXT</span>
                </div>
              </div>

              {parseError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Privacy & Consent Notice:</p>
                <p>Imported contacts will be marked as having <span className="text-indigo-400 font-medium">Pending Consent</span>. NexaReach never assumes opt-in subscription consent during raw imports.</p>
              </div>
            </div>
          )}

          {/* STEP 2: Field Mapping & Options */}
          {step === "map" && parsed && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Selected File</p>
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    {parsed.filename} ({parsed.totalRowCount} rows detected)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Change File
                </button>
              </div>

              {/* Column Mapping Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Map Columns</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email (Required) */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={emailCol}
                      onChange={(e) => setEmailCol(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-indigo-500/50 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={-1}>-- Select Column --</option>
                      {parsed.headers.map((h, i) => (
                        <option key={i} value={i}>
                          Col {i + 1}: {h || `Column ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* First Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">First Name</label>
                    <select
                      value={firstNameCol}
                      onChange={(e) => setFirstNameCol(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={-1}>-- Skip / None --</option>
                      {parsed.headers.map((h, i) => (
                        <option key={i} value={i}>
                          Col {i + 1}: {h || `Column ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Last Name</label>
                    <select
                      value={lastNameCol}
                      onChange={(e) => setLastNameCol(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={-1}>-- Skip / None --</option>
                      {parsed.headers.map((h, i) => (
                        <option key={i} value={i}>
                          Col {i + 1}: {h || `Column ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                    <select
                      value={phoneCol}
                      onChange={(e) => setPhoneCol(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={-1}>-- Skip / None --</option>
                      {parsed.headers.map((h, i) => (
                        <option key={i} value={i}>
                          Col {i + 1}: {h || `Column ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Company</label>
                    <select
                      value={companyCol}
                      onChange={(e) => setCompanyCol(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={-1}>-- Skip / None --</option>
                      {parsed.headers.map((h, i) => (
                        <option key={i} value={i}>
                          Col {i + 1}: {h || `Column ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Job Title</label>
                    <select
                      value={jobTitleCol}
                      onChange={(e) => setJobTitleCol(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={-1}>-- Skip / None --</option>
                      {parsed.headers.map((h, i) => (
                        <option key={i} value={i}>
                          Col {i + 1}: {h || `Column ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Import Options */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Import Options</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Duplicate Strategy */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Existing Duplicate Contacts</label>
                    <select
                      value={duplicateStrategy}
                      onChange={(e) => setDuplicateStrategy(e.target.value as "skip" | "update")}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="skip">Skip existing contacts (keep existing data)</option>
                      <option value="update">Update existing contacts with imported fields</option>
                    </select>
                  </div>

                  {/* Add to List */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Add to List (Optional)</label>
                    <select
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- Do not add to list --</option>
                      <option value="new">+ Create a new list</option>
                      {lists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.contactCount} contacts)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedListId === "new" && (
                  <div className="animate-in fade-in duration-150">
                    <label className="block text-xs font-medium text-indigo-400 mb-1">New List Name</label>
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="e.g. Q4 Inbound Leads"
                      className="w-full px-3 py-2 bg-slate-950 border border-indigo-500/50 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Add Tags (Optional)</label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="e.g. imported, webinar, lead-2024"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Comma-separated tags to assign to all imported contacts</p>
                </div>
              </div>

              {/* Sample Data Preview */}
              {parsed.sampleRows.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Preview (First 3 rows)</h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/40 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                        <tr>
                          {parsed.headers.map((h, i) => (
                            <th key={i} className="px-3 py-2 text-[11px] font-medium whitespace-nowrap">
                              {h || `Col ${i + 1}`}
                              {i === emailCol && <span className="ml-1 text-indigo-400">(Email)</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {parsed.sampleRows.slice(0, 3).map((r, ri) => (
                          <tr key={ri}>
                            {r.map((cell, ci) => (
                              <td key={ci} className="px-3 py-2 whitespace-nowrap truncate max-w-[160px]">
                                {cell || <span className="text-slate-600">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Importing Spinner */}
          {step === "importing" && (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              <div>
                <p className="text-base font-semibold text-white">Importing Contacts...</p>
                <p className="text-xs text-slate-400 mt-1">
                  Validating emails, applying deduplication rules, and synchronizing workspace data.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Complete Screen */}
          {step === "complete" && importResult && (
            <div className="space-y-6 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Import Completed Successfully</h3>
                <p className="text-xs text-slate-400 mt-1">Your audience has been updated in Neon PostgreSQL.</p>
              </div>

              {/* Metric boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <p className="text-[11px] text-slate-400">Total Rows</p>
                  <p className="text-lg font-bold text-white">{importResult.totalProcessed}</p>
                </div>
                <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-xl">
                  <p className="text-[11px] text-emerald-400">Created</p>
                  <p className="text-lg font-bold text-emerald-400">+{importResult.createdCount}</p>
                </div>
                <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-xl">
                  <p className="text-[11px] text-amber-400">Updated / Skipped</p>
                  <p className="text-lg font-bold text-amber-400">
                    {importResult.updatedCount + importResult.skippedDuplicates}
                  </p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <p className="text-[11px] text-slate-400">Errors</p>
                  <p className="text-lg font-bold text-slate-400">{importResult.errorCount}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
          {step === "upload" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <div className="text-xs text-slate-500">Step 1 of 2</div>
            </>
          )}

          {step === "map" && (
            <>
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={loading || emailCol === -1}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition flex items-center gap-2"
              >
                Start Import
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {step === "complete" && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition"
              >
                View Contacts
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
