"use client";

import { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import type { SuppressionReason } from "@/lib/types/suppression";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Array<{ email: string; reason?: string; notes?: string }>>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [emailCol, setEmailCol] = useState<string>("");
  const [reasonCol, setReasonCol] = useState<string>("");
  const [defaultReason, setDefaultReason] = useState<SuppressionReason>("MANUAL_BLOCK");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    totalRows: number;
    uniqueCount: number;
    importedCount: number;
    skippedDuplicates: number;
    invalidCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setSummary(null);
    setLoading(true);

    try {
      const ext = selected.name.split(".").pop()?.toLowerCase();
      if (ext === "csv" || ext === "txt") {
        const text = await selected.text();
        if (ext === "txt") {
          // Plain text line-by-line
          const lines = text
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
          setColumns(["Email"]);
          setEmailCol("Email");
          setParsedRows(lines.map((l) => ({ email: l })));
        } else {
          // CSV parsing via XLSX
          const workbook = XLSX.read(text, { type: "string" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const data: any[] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          if (data.length === 0) throw new Error("Uploaded file is empty");

          const headers = (data[0] || []).map((h: any, i: number) => String(h || `Column ${i + 1}`).trim());
          setColumns(headers);

          // Auto-detect email column
          const detectedEmailCol = headers.find((h: string) =>
            /email|mail|contact/i.test(h)
          ) || headers[0];
          setEmailCol(detectedEmailCol);

          const rows: any[] = [];
          for (let i = 1; i < data.length; i++) {
            const rowData = data[i];
            if (!rowData || rowData.length === 0) continue;
            const obj: any = {};
            headers.forEach((h: string, colIdx: number) => {
              obj[h] = rowData[colIdx];
            });
            const emailVal = obj[detectedEmailCol];
            if (emailVal) {
              rows.push({ email: String(emailVal).trim() });
            }
          }
          setParsedRows(rows);
        }
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await selected.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        if (data.length === 0) throw new Error("Uploaded workbook is empty");

        const headers = (data[0] || []).map((h: any, i: number) => String(h || `Column ${i + 1}`).trim());
        setColumns(headers);

        const detectedEmailCol = headers.find((h: string) =>
          /email|mail|contact/i.test(h)
        ) || headers[0];
        setEmailCol(detectedEmailCol);

        const rows: any[] = [];
        for (let i = 1; i < data.length; i++) {
          const rowData = data[i];
          if (!rowData || rowData.length === 0) continue;
          const obj: any = {};
          headers.forEach((h: string, colIdx: number) => {
            obj[h] = rowData[colIdx];
          });
          const emailVal = obj[detectedEmailCol];
          if (emailVal) {
            rows.push({ email: String(emailVal).trim() });
          }
        }
        setParsedRows(rows);
      } else {
        throw new Error("Unsupported format. Please upload CSV, XLSX, or TXT file.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse file");
      setFile(null);
      setParsedRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setError(null);

    try {
      const payload = {
        entries: parsedRows.map((r) => ({
          email: r.email,
          reason: defaultReason,
        })),
        source: "IMPORT",
      };

      const res = await fetch("/api/dashboard/email-verification/suppression/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete bulk import");
      }

      setSummary(data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during import");
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setColumns([]);
    setSummary(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bulk Suppression Import</h3>
              <p className="text-[11px] text-slate-500">Upload CSV, XLSX, or TXT containing addresses to suppress</p>
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

        {summary ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Import Completed Successfully</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200 text-[11px]">
                <div>Total Rows Parsed: <span className="font-semibold">{summary.totalRows}</span></div>
                <div>Unique Valid Addresses: <span className="font-semibold">{summary.uniqueCount}</span></div>
                <div>Imported / Reactivated: <span className="font-semibold text-emerald-700">{summary.importedCount}</span></div>
                <div>Duplicates Skipped: <span className="font-semibold text-slate-600">{summary.skippedDuplicates}</span></div>
                <div>Invalid Formats Skipped: <span className="font-semibold text-slate-600">{summary.invalidCount}</span></div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  onClose();
                  handleReset();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : !file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50/20 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-slate-700">Click to upload or drag and drop</p>
              <p className="text-[11px] text-slate-400">Supported formats: CSV, XLSX, TXT</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-800 truncate">
                <FileSpreadsheet className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="text-slate-400">({parsedRows.length} rows detected)</span>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Change
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Column</label>
                <select
                  value={emailCol}
                  onChange={(e) => setEmailCol(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  {columns.map((col, idx) => (
                    <option key={idx} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Default Reason</label>
                <select
                  value={defaultReason}
                  onChange={(e) => setDefaultReason(e.target.value as SuppressionReason)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-hidden focus:border-blue-500 cursor-pointer"
                >
                  <option value="MANUAL_BLOCK">Manual Block</option>
                  <option value="DO_NOT_CONTACT">Do Not Contact</option>
                  <option value="UNSUBSCRIBED">Unsubscribed</option>
                  <option value="HARD_BOUNCE">Hard Bounce</option>
                  <option value="SPAM_COMPLAINT">Spam Complaint</option>
                  <option value="SYSTEM_EXCLUSION">System Exclusion</option>
                </select>
              </div>
            </div>

            {/* Preview of first 3 rows */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Sample Preview</label>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-600 max-h-28 overflow-y-auto space-y-1">
                {parsedRows.slice(0, 4).map((r, i) => (
                  <div key={i} className="truncate">
                    {i + 1}. {r.email}
                  </div>
                ))}
                {parsedRows.length > 4 && (
                  <div className="text-slate-400 italic">
                    ... and {parsedRows.length - 4} more addresses
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={importing}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || parsedRows.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import {parsedRows.length} Addresses</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
