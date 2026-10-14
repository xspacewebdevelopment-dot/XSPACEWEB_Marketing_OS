"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  Download,
  Search,
  RefreshCw,
  Coins,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  ChevronDown,
  Sparkles,
  Ban,
  Eye,
  FileCheck,
  UserPlus,
  Layers,
} from "lucide-react";
import {
  parseFileContent,
  analyzeEmailColumn,
  ParsedFileResult,
  EmailListAnalysis,
} from "@/lib/file-parser";
import { ProviderCreditBalance } from "@/lib/reoon/types";

interface VerificationJobData {
  id: string;
  workspaceId: string;
  filename: string;
  fileSize: number | null;
  sourceType: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  totalRecords: number;
  processedRecords: number;
  duplicatesCount: number;
  rejectedCount: number;
  validCount: number;
  invalidCount: number;
  riskyCount: number;
  unknownCount: number;
  creditsUsed: number;
  progressPercentage: number;
  providerJobId: string | null;
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  errorMessage: string | null;
}

interface VerificationResultItem {
  id: string;
  email: string;
  status: "VALID" | "INVALID" | "RISKY" | "UNKNOWN";
  providerStatus: string;
  providerSubstatus: string | null;
  reason: string | null;
  overallScore: number | null;
  isValidSyntax: boolean;
  isDisposable: boolean;
  isRoleBased: boolean;
  isCatchAll: boolean;
  isDeliverable: boolean | null;
  domain: string | null;
  verifiedAt: string;
}

export default function BulkVerifyPage() {
  // Step workflow: "upload" | "mapping" | "confirm" | "monitoring"
  const [activeTab, setActiveTab] = useState<"verify" | "history">("verify");
  const [step, setStep] = useState<"upload" | "mapping" | "confirm" | "monitoring">("upload");

  // File & Parsing state
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedFileResult | null>(null);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number>(0);
  const [analysis, setAnalysis] = useState<EmailListAnalysis | null>(null);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [showMalformedModal, setShowMalformedModal] = useState(false);

  // Credit balance state
  const [credits, setCredits] = useState<ProviderCreditBalance | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState(false);

  // Job Submission & Monitoring state
  const [submitting, setSubmitting] = useState(false);
  const [currentJob, setCurrentJob] = useState<VerificationJobData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Results state
  const [resultsFilter, setResultsFilter] = useState<string>("ALL");
  const [resultsSearch, setResultsSearch] = useState<string>("");
  const [resultsPage, setResultsPage] = useState<number>(1);
  const [resultsData, setResultsData] = useState<{
    items: VerificationResultItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  } | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  // Previous jobs history list
  const [pastJobs, setPastJobs] = useState<VerificationJobData[]>([]);
  const [loadingPastJobs, setLoadingPastJobs] = useState(false);

  // Contacts integration
  const [showAddJobToContactsModal, setShowAddJobToContactsModal] = useState(false);
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [savingContacts, setSavingContacts] = useState(false);
  const [addNotice, setAddNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/lists")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.lists) setContactLists(d.lists);
      })
      .catch(console.error);
  }, []);

  const handleAddJobToContacts = async () => {
    if (!currentJob) return;
    setSavingContacts(true);
    try {
      const res = await fetch("/api/dashboard/email-verification/results/add-to-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleanedOnly: true,
          cleaningRules: {
            excludeInvalid: true,
            excludeRisky: true,
            excludeDisposable: true,
            removeDuplicates: true,
          },
          filters: { jobId: currentJob.id },
          listId: selectedListId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add contacts");
      setAddNotice(data.message || "Eligible contacts successfully added to Contacts.");
      setShowAddJobToContactsModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to add contacts");
    } finally {
      setSavingContacts(false);
    }
  };

  const [, startTransition] = useTransition();

  // Fetch live Reoon credit balance
  const fetchCredits = useCallback(async (refresh = false) => {
    try {
      setLoadingCredits(true);
      const res = await fetch(
        `/api/dashboard/email-verification/credits${refresh ? "?refresh=true" : ""}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.success && data.data) {
        setCredits(data.data);
      }
    } catch (err) {
      console.error("Failed to load credits:", err);
    } finally {
      setLoadingCredits(false);
    }
  }, []);

  // Fetch past jobs list
  const fetchPastJobs = useCallback(async () => {
    try {
      setLoadingPastJobs(true);
      const res = await fetch(`/api/dashboard/email-verification/jobs?limit=20`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success && data.data?.jobs) {
        setPastJobs(data.data.jobs);
      }
    } catch (err) {
      console.error("Failed to load jobs history:", err);
    } finally {
      setLoadingPastJobs(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
    fetchPastJobs();
  }, [fetchCredits, fetchPastJobs]);

  // Load paginated results for current job
  const fetchJobResults = useCallback(
    async (jobId: string, page = 1, status = "ALL", search = "") => {
      try {
        setLoadingResults(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
        });
        if (status !== "ALL") params.append("status", status);
        if (search.trim()) params.append("search", search.trim());

        const res = await fetch(
          `/api/dashboard/email-verification/jobs/${jobId}/results?${params.toString()}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data.success && data.data) {
          setResultsData(data.data);
        }
      } catch (err) {
        console.error("Failed to load job results:", err);
      } finally {
        setLoadingResults(false);
      }
    },
    []
  );

  // Poll current job status
  const pollJob = useCallback(
    async (jobId: string) => {
      try {
        const res = await fetch(`/api/dashboard/email-verification/jobs/${jobId}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (data.success && data.data) {
          const updatedJob: VerificationJobData = data.data;
          setCurrentJob(updatedJob);

          if (updatedJob.status === "COMPLETED") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
            fetchJobResults(updatedJob.id, 1, "ALL", "");
            fetchCredits(true);
            fetchPastJobs();
          } else if (updatedJob.status === "FAILED" || updatedJob.status === "CANCELLED") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            fetchPastJobs();
          }
        }
      } catch (err) {
        console.error("Job polling error:", err);
      }
    },
    [fetchJobResults, fetchCredits, fetchPastJobs]
  );

  // Polling loop management
  useEffect(() => {
    if (
      currentJob &&
      (currentJob.status === "PENDING" || currentJob.status === "PROCESSING") &&
      !pollingRef.current
    ) {
      pollingRef.current = setInterval(() => {
        pollJob(currentJob.id);
      }, 3500);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [currentJob, pollJob]);

  // Handle manual sync button click
  const handleManualSync = async () => {
    if (!currentJob) return;
    try {
      setIsSyncing(true);
      const res = await fetch(`/api/dashboard/email-verification/jobs/${currentJob.id}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentJob(data.data);
        if (data.data.status === "COMPLETED") {
          fetchJobResults(data.data.id, resultsPage, resultsFilter, resultsSearch);
          fetchCredits(true);
          fetchPastJobs();
        }
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle cancel job
  const handleCancelJob = async () => {
    if (!currentJob) return;
    const confirmed = window.confirm(
      "Are you sure you want to cancel this verification job? Submitted remote tasks cannot be recalled from Reoon servers."
    );
    if (!confirmed) return;

    try {
      setCancelling(true);
      const res = await fetch(`/api/dashboard/email-verification/jobs/${currentJob.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentJob(data.data);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setCancelling(false);
    }
  };

  // Process uploaded file
  const handleFile = async (file: File) => {
    setFileError(null);
    const validExtensions = [".csv", ".xlsx", ".xls", ".txt"];
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");

    if (!validExtensions.includes(ext)) {
      setFileError("Invalid file type. Supported formats: CSV, XLSX, and TXT.");
      return;
    }

    const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
    if (file.size > MAX_SIZE) {
      setFileError("File size exceeds 25 MB limit.");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseFileContent(file.name, buffer);

      if (parsed.totalRowCount === 0) {
        setFileError("The uploaded file does not contain any data rows.");
        return;
      }

      if (parsed.totalRowCount > 50000) {
        setFileError(
          `File contains ${parsed.totalRowCount.toLocaleString()} rows. Reoon bulk verification supports up to 50,000 rows per task.`
        );
        return;
      }

      setRawFile(file);
      setParsedData(parsed);
      setSelectedColumnIndex(parsed.suggestedEmailColumnIndex);

      const emailAnalysis = analyzeEmailColumn(
        parsed.allRows,
        parsed.suggestedEmailColumnIndex
      );
      setAnalysis(emailAnalysis);
      setStep("mapping");
    } catch (err: unknown) {
      setFileError(
        err instanceof Error ? err.message : "Failed to parse file. Please verify file format."
      );
    }
  };

  // Re-analyze when selected column changes
  const handleColumnChange = (index: number) => {
    setSelectedColumnIndex(index);
    if (parsedData) {
      const emailAnalysis = analyzeEmailColumn(parsedData.allRows, index);
      setAnalysis(emailAnalysis);
    }
  };

  // Submit bulk job to server
  const handleStartVerification = async () => {
    if (!parsedData || !analysis || !rawFile || !userConfirmed) return;

    if (analysis.uniqueEmails.length === 0) {
      setFileError("No valid email addresses found to verify in the selected column.");
      return;
    }

    const availableCredits = credits?.totalCreditsRemaining ?? 0;
    if (availableCredits < analysis.uniqueEmails.length) {
      alert("Insufficient credits. Please top up your Reoon account before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/dashboard/email-verification/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: rawFile.name,
          sourceType: parsedData.fileType,
          fileSize: rawFile.size,
          emails: analysis.uniqueEmails,
          duplicatesCount: analysis.duplicateCount,
          rejectedCount: analysis.malformedCount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create verification job");
      }

      setCurrentJob(data.data);
      setStep("monitoring");
      fetchCredits(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset to upload state
  const handleReset = () => {
    setRawFile(null);
    setParsedData(null);
    setAnalysis(null);
    setCurrentJob(null);
    setResultsData(null);
    setUserConfirmed(false);
    setFileError(null);
    setStep("upload");
  };

  // Switch to monitoring an existing past job
  const handleSelectPastJob = (job: VerificationJobData) => {
    setCurrentJob(job);
    setActiveTab("verify");
    setStep("monitoring");
    if (job.status === "COMPLETED") {
      fetchJobResults(job.id, 1, "ALL", "");
    }
  };

  // Check credit sufficiency
  const availableCredits = credits?.totalCreditsRemaining ?? 0;
  const requiredCredits = analysis?.uniqueValidCount ?? 0;
  const hasSufficientCredits = availableCredits >= requiredCredits;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumb / Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/dashboard/email-verification"
              className="hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Overview
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Bulk Verification</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Bulk Email Verification
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Production Reoon Engine
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Clean large contact lists with real Reoon Power Mode SMTP handshakes, syntax checking,
            and automated deduplication.
          </p>
        </div>

        {/* Live Reoon Credit Balance Pill */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900 text-white shadow-xs border border-slate-800">
            <Coins className="h-4 w-4 text-amber-400 shrink-0" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-medium leading-none">
                Available Credits
              </div>
              <div className="text-xs font-bold font-mono tracking-tight text-amber-300">
                {credits?.totalCreditsRemaining !== null && credits?.totalCreditsRemaining !== undefined
                  ? credits.totalCreditsRemaining.toLocaleString()
                  : "Checking..."}
              </div>
            </div>
            <button
              onClick={() => fetchCredits(true)}
              disabled={loadingCredits}
              title="Refresh provider balance"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loadingCredits ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("verify")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "verify"
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          {step === "monitoring" ? "Active Job & Results" : "Upload & Verify"}
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            fetchPastJobs();
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === "history"
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <span>Batch History</span>
          {pastJobs.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
              {pastJobs.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: VERIFY WORKFLOW */}
      {activeTab === "verify" && (
        <div className="space-y-6">
          {/* STEP 1: UPLOAD DROPZONE */}
          {step === "upload" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              {fileError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs text-red-900 font-medium">
                    <p className="font-semibold">File Upload Notice</p>
                    <p>{fileError}</p>
                  </div>
                </div>
              )}

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const files = e.dataTransfer.files;
                  if (files && files[0]) {
                    handleFile(files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                  dragOver
                    ? "border-blue-500 bg-blue-50/60 scale-[0.99]"
                    : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                <input
                  type="file"
                  id="bulk-file-input"
                  accept=".csv,.xlsx,.xls,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files[0]) {
                      handleFile(files[0]);
                    }
                  }}
                />

                <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner mb-4">
                  <Upload className="h-8 w-8" />
                </div>

                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-sm font-bold text-slate-900">
                    Drag and drop your contact list here
                  </h3>
                  <p className="text-xs text-slate-500">
                    Supports <strong>CSV, XLSX, XLS, and TXT</strong> files up to 25 MB and 50,000 records.
                  </p>
                </div>

                <div className="pt-6">
                  <label
                    htmlFor="bulk-file-input"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs shadow-blue-500/20 cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Select File to Upload</span>
                  </label>
                </div>

                <div className="pt-6 flex items-center justify-center gap-6 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Auto Column Mapping
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Duplicate Scrubbing
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Zero Risk Confirmation
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & PREVIEW */}
          {step === "mapping" && parsedData && analysis && (
            <div className="space-y-6">
              {/* File Summary Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    {parsedData.fileType === "CSV" ? (
                      <FileText className="h-6 w-6" />
                    ) : (
                      <FileSpreadsheet className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{parsedData.filename}</h3>
                    <p className="text-xs text-slate-500">
                      Format: <strong>{parsedData.fileType}</strong> &bull; Total rows:{" "}
                      <strong>{parsedData.totalRowCount.toLocaleString()}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                  >
                    Change File
                  </button>
                  <button
                    onClick={() => setStep("confirm")}
                    disabled={analysis.uniqueValidCount === 0 || !hasSufficientCredits}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all flex items-center gap-1.5"
                  >
                    <span>Proceed to Confirmation</span>
                    <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                  </button>
                </div>
              </div>

              {/* Analysis Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Total Rows</span>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {analysis.totalRows.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400">In uploaded document</span>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-xs">
                  <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Unique Valid Emails
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                    {analysis.uniqueValidCount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-600">Candidate verification count</span>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-800 font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      Duplicates
                    </span>
                    {analysis.duplicateCount > 0 && (
                      <button
                        onClick={() => setShowDuplicatesModal(true)}
                        className="text-[10px] font-semibold text-amber-700 underline"
                      >
                        View ({analysis.duplicateCount})
                      </button>
                    )}
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-800 mt-1">
                    {analysis.duplicateCount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-amber-700">Auto-scrubbed &amp; deduplicated</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-slate-400" />
                      Malformed Syntax
                    </span>
                    {analysis.malformedCount > 0 && (
                      <button
                        onClick={() => setShowMalformedModal(true)}
                        className="text-[10px] font-semibold text-slate-700 underline"
                      >
                        View ({analysis.malformedCount})
                      </button>
                    )}
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-700 mt-1">
                    {analysis.malformedCount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400">Filtered before API submission</span>
                </div>
              </div>

              {/* Column Mapping Selector */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Email Address Column Mapping
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Confirm or change which column contains the email addresses to verify.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-600">Select Column:</label>
                    <select
                      value={selectedColumnIndex}
                      onChange={(e) => handleColumnChange(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {parsedData.headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h} (Column {i + 1})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-3 py-2 text-[10px] uppercase text-slate-400 w-12 text-center">
                          #
                        </th>
                        {parsedData.headers.map((h, i) => (
                          <th
                            key={i}
                            className={`px-3 py-2 text-[11px] ${
                              i === selectedColumnIndex
                                ? "bg-blue-50 text-blue-900 border-x border-blue-200"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{h}</span>
                              {i === selectedColumnIndex && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-600 text-white font-bold">
                                  TARGET
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {parsedData.sampleRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 text-slate-400 text-center font-sans text-[10px]">
                            {rIdx + 1}
                          </td>
                          {parsedData.headers.map((_, cIdx) => (
                            <td
                              key={cIdx}
                              className={`px-3 py-2 truncate max-w-[200px] ${
                                cIdx === selectedColumnIndex
                                  ? "bg-blue-50/40 text-blue-900 font-semibold border-x border-blue-100"
                                  : "text-slate-600"
                              }`}
                            >
                              {row[cIdx] || <span className="text-slate-300 italic">empty</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insufficient Credit Warning if applicable */}
              {!hasSufficientCredits && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs text-red-900">
                    <p className="font-bold">Insufficient Reoon Verification Credits</p>
                    <p className="text-[11px] leading-relaxed">
                      This list requires <strong>{requiredCredits.toLocaleString()}</strong> credits, but
                      your account currently has <strong>{availableCredits.toLocaleString()}</strong>{" "}
                      credits. Please replenish your Reoon credits before starting this job.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: EXPLICIT CONFIRMATION MODAL / PANEL */}
          {step === "confirm" && parsedData && analysis && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 max-w-2xl mx-auto">
              <div className="space-y-1 text-center">
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Confirm Bulk Verification Submission
                </h2>
                <p className="text-xs text-slate-500">
                  Verify the exact parameters before dispatching to the live Reoon Email Verifier.
                </p>
              </div>

              {/* Summary Table */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>File to verify:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {parsedData.filename}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Target Column:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {parsedData.headers[selectedColumnIndex]}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Total rows in list:</span>
                  <span className="font-mono text-slate-900">{analysis.totalRows}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Duplicates auto-filtered:</span>
                  <span className="font-mono text-amber-700">-{analysis.duplicateCount}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Malformed addresses filtered:</span>
                  <span className="font-mono text-slate-700">-{analysis.malformedCount}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold">
                  <span className="text-slate-900">Total Unique Emails to Verify:</span>
                  <span className="text-sm font-mono text-blue-600">
                    {analysis.uniqueValidCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center font-bold text-slate-900">
                  <span>Estimated Reoon Credits:</span>
                  <span className="text-sm font-mono text-amber-600">
                    {analysis.estimatedCredits.toLocaleString()} Credits
                  </span>
                </div>
              </div>

              {/* Provider Advisory Notice */}
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  Irreversible API Job Submission
                </p>
                <p className="text-amber-800/90 leading-relaxed">
                  Submitting will create an official bulk verification task on Reoon servers. Once
                  initiated, remote verification tasks run asynchronously to completion and cannot
                  be aborted or recalled.
                </p>
              </div>

              {/* Explicit User Confirmation Checkbox */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userConfirmed}
                    onChange={(e) => setUserConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-900 leading-snug">
                    I confirm and authorize verification of{" "}
                    <span className="text-blue-600 font-mono">
                      {analysis.uniqueValidCount.toLocaleString()}
                    </span>{" "}
                    emails and the deduction of{" "}
                    <span className="text-amber-600 font-mono">
                      {analysis.estimatedCredits.toLocaleString()}
                    </span>{" "}
                    credits from our Reoon account.
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("mapping")}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  Back to Mapping
                </button>
                <button
                  type="button"
                  onClick={handleStartVerification}
                  disabled={!userConfirmed || submitting || !hasSufficientCredits}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting to Reoon...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Start Bulk Verification</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: MONITORING & RESULTS VIEW */}
          {step === "monitoring" && currentJob && (
            <div className="space-y-6">
              {/* Header Status Banner */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{currentJob.filename}</h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          currentJob.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : currentJob.status === "PROCESSING"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : currentJob.status === "FAILED"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : currentJob.status === "CANCELLED"
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {currentJob.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>
                        Job ID: <code className="font-mono text-slate-700">{currentJob.id.slice(0, 8)}</code>
                      </span>
                      {currentJob.providerJobId && (
                        <span>
                          Reoon Task ID:{" "}
                          <code className="font-mono text-slate-700">{currentJob.providerJobId}</code>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing || currentJob.status === "COMPLETED"}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                      <span>Sync Now</span>
                    </button>

                    {currentJob.status !== "COMPLETED" &&
                      currentJob.status !== "FAILED" &&
                      currentJob.status !== "CANCELLED" && (
                        <button
                          onClick={handleCancelJob}
                          disabled={cancelling}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Ban className="h-3 w-3" />
                          <span>Cancel Job</span>
                        </button>
                      )}

                    <button
                      onClick={handleReset}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
                    >
                      New Verification
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      {currentJob.status === "PROCESSING" && (
                        <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
                      )}
                      <span>
                        {currentJob.status === "COMPLETED"
                          ? "Verification Completed"
                          : currentJob.status === "PROCESSING"
                          ? "Processing on Reoon Verification Servers..."
                          : currentJob.status === "PENDING"
                          ? "Queued on Inngest Background Pipeline..."
                          : currentJob.status}
                      </span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {currentJob.progressPercentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        currentJob.status === "COMPLETED"
                          ? "bg-emerald-500"
                          : currentJob.status === "FAILED"
                          ? "bg-red-500"
                          : "bg-gradient-to-r from-blue-500 to-indigo-600"
                      }`}
                      style={{ width: `${Math.max(currentJob.progressPercentage, 2)}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Breakdown Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <span className="text-[10px] text-slate-500 font-medium uppercase">
                      Total Records
                    </span>
                    <div className="text-base font-bold font-mono text-slate-900">
                      {currentJob.totalRecords.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <span className="text-[10px] text-slate-500 font-medium uppercase">
                      Processed
                    </span>
                    <div className="text-base font-bold font-mono text-blue-600">
                      {currentJob.processedRecords.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                    <span className="text-[10px] text-emerald-700 font-medium uppercase flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Valid
                    </span>
                    <div className="text-base font-bold font-mono text-emerald-700">
                      {currentJob.validCount.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-red-200 bg-red-50/40">
                    <span className="text-[10px] text-red-700 font-medium uppercase flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-red-600" />
                      Invalid
                    </span>
                    <div className="text-base font-bold font-mono text-red-700">
                      {currentJob.invalidCount.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40">
                    <span className="text-[10px] text-amber-800 font-medium uppercase flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      Risky
                    </span>
                    <div className="text-base font-bold font-mono text-amber-800">
                      {currentJob.riskyCount.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <span className="text-[10px] text-slate-500 font-medium uppercase flex items-center gap-1">
                      <HelpCircle className="h-3 w-3 text-slate-400" />
                      Unknown
                    </span>
                    <div className="text-base font-bold font-mono text-slate-700">
                      {currentJob.unknownCount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Error message if failed */}
                {currentJob.errorMessage && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      Provider Processing Issue
                    </p>
                    <p className="text-[11px] leading-relaxed">{currentJob.errorMessage}</p>
                  </div>
                )}
              </div>

              {/* RESULTS TABLE SECTION */}
              {currentJob.status === "COMPLETED" && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Itemized Verification Results
                      </h3>
                      <p className="text-xs text-slate-500">
                        Detailed address deliverability and risk classifications saved in Neon PostgreSQL.
                      </p>
                    </div>

                    {/* Download Cleaned CSV buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddJobToContactsModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Add to Contacts</span>
                      </button>
                      <a
                        href={`/api/dashboard/email-verification/jobs/${currentJob.id}/export?filter=all`}
                        download
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Download className="h-3.5 w-3.5 text-slate-500" />
                        <span>Export All ({currentJob.totalRecords})</span>
                      </a>
                      <a
                        href={`/api/dashboard/email-verification/jobs/${currentJob.id}/export?filter=valid`}
                        download
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs shadow-emerald-600/20 transition-all"
                      >
                        <FileCheck className="h-3.5 w-3.5" />
                        <span>Export Valid Only ({currentJob.validCount})</span>
                      </a>
                    </div>
                  </div>

                  {addNotice && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                      <span>{addNotice}</span>
                      <button onClick={() => setAddNotice(null)} className="font-bold text-emerald-700">✕</button>
                    </div>
                  )}

                  {/* Add to Contacts Modal for Bulk Job */}
                  {showAddJobToContactsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-slate-900">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                              <UserPlus className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-slate-900">Add Bulk Results to Contacts</h3>
                              <p className="text-xs text-slate-500">
                                Import verified deliverable emails into your audience
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowAddJobToContactsModal(false)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                            <p className="text-slate-500">Batch Summary:</p>
                            <p className="font-semibold text-slate-900">{currentJob.filename}</p>
                            <p className="text-slate-600">
                              {currentJob.validCount} valid deliverable addresses ready for import.
                            </p>
                          </div>

                          {contactLists.length > 0 && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Assign to Contact List (Optional)
                              </label>
                              <select
                                value={selectedListId}
                                onChange={(e) => setSelectedListId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="">-- No list assignment --</option>
                                {contactLists.map((l) => (
                                  <option key={l.id} value={l.id}>
                                    {l.name} ({l.contactCount} contacts)
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1">
                            <p className="font-semibold">Privacy & Deliverability Guarantee:</p>
                            <p>
                              • Marketing consent will remain <strong>Pending</strong> (never assumed).<br />
                              • Existing suppression entries will be skipped to protect sender reputation.<br />
                              • Verified status is preserved without repeating paid Reoon requests.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setShowAddJobToContactsModal(false)}
                            className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={savingContacts}
                            onClick={handleAddJobToContacts}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {savingContacts ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Adding Contacts...
                              </>
                            ) : (
                              "Confirm Import"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Filter Tabs & Search Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 bg-slate-50/50">
                      {["ALL", "VALID", "INVALID", "RISKY", "UNKNOWN"].map((statusKey) => (
                        <button
                          key={statusKey}
                          onClick={() => {
                            setResultsFilter(statusKey);
                            setResultsPage(1);
                            fetchJobResults(currentJob.id, 1, statusKey, resultsSearch);
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            resultsFilter === statusKey
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          {statusKey}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search verified emails..."
                        value={resultsSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setResultsSearch(val);
                          setResultsPage(1);
                          startTransition(() => {
                            fetchJobResults(currentJob.id, 1, resultsFilter, val);
                          });
                        }}
                        className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder-slate-400 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Results Table */}
                  <div className="border border-slate-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="px-4 py-2.5">Email Address</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-3 py-2.5">Deliverable</th>
                          <th className="px-3 py-2.5">Score</th>
                          <th className="px-3 py-2.5">Provider Status</th>
                          <th className="px-3 py-2.5">Risk Signals</th>
                          <th className="px-3 py-2.5">Domain</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loadingResults ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
                              Loading results...
                            </td>
                          </tr>
                        ) : !resultsData || resultsData.items.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                              No results match the selected filter.
                            </td>
                          </tr>
                        ) : (
                          resultsData.items.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 font-mono text-[11px] font-medium text-slate-900">
                                {row.email}
                              </td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    row.status === "VALID"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : row.status === "INVALID"
                                      ? "bg-red-50 text-red-700 border border-red-200"
                                      : row.status === "RISKY"
                                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                                      : "bg-slate-100 text-slate-700 border border-slate-200"
                                  }`}
                                >
                                  {row.status}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                {row.isDeliverable === true ? (
                                  <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                                    <Check className="h-3 w-3" /> Yes
                                  </span>
                                ) : row.isDeliverable === false ? (
                                  <span className="text-red-600 font-semibold text-[11px]">No</span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-[11px]">
                                {row.overallScore !== null ? (
                                  <span
                                    className={`font-bold ${
                                      row.overallScore >= 80
                                        ? "text-emerald-600"
                                        : row.overallScore >= 40
                                        ? "text-amber-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {row.overallScore}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">N/A</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">
                                {row.providerStatus}
                                {row.providerSubstatus && (
                                  <span className="text-slate-400 text-[10px] ml-1">
                                    ({row.providerSubstatus})
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {row.isDisposable && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-100 text-red-700 font-medium">
                                      Disposable
                                    </span>
                                  )}
                                  {row.isCatchAll && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-100 text-amber-800 font-medium">
                                      Catch-All
                                    </span>
                                  )}
                                  {row.isRoleBased && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-100 text-blue-800 font-medium">
                                      Role
                                    </span>
                                  )}
                                  {!row.isDisposable && !row.isCatchAll && !row.isRoleBased && (
                                    <span className="text-slate-400 text-[11px]">None</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">
                                {row.domain || "-"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {resultsData && resultsData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                      <div>
                        Showing {(resultsPage - 1) * 20 + 1} to{" "}
                        {Math.min(resultsPage * 20, resultsData.pagination.total)} of{" "}
                        {resultsData.pagination.total} records
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newPage = Math.max(1, resultsPage - 1);
                            setResultsPage(newPage);
                            fetchJobResults(currentJob.id, newPage, resultsFilter, resultsSearch);
                          }}
                          disabled={resultsPage <= 1}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center gap-1"
                        >
                          <ChevronLeft className="h-3 w-3" />
                          <span>Previous</span>
                        </button>
                        <span className="font-mono text-slate-700">
                          {resultsPage} / {resultsData.pagination.totalPages}
                        </span>
                        <button
                          onClick={() => {
                            const newPage = Math.min(
                              resultsData.pagination.totalPages,
                              resultsPage + 1
                            );
                            setResultsPage(newPage);
                            fetchJobResults(currentJob.id, newPage, resultsFilter, resultsSearch);
                          }}
                          disabled={resultsPage >= resultsData.pagination.totalPages}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center gap-1"
                        >
                          <span>Next</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAST BATCHES HISTORY */}
      {activeTab === "history" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Historical Bulk Verification Jobs</h3>
              <p className="text-xs text-slate-500">
                Audited list verification tasks completed or queued for this workspace.
              </p>
            </div>
            <button
              onClick={fetchPastJobs}
              disabled={loadingPastJobs}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingPastJobs ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loadingPastJobs ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" />
              Loading history...
            </div>
          ) : pastJobs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <FileSpreadsheet className="h-8 w-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-700">No bulk jobs executed yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Upload a CSV, XLSX, or TXT contact list to launch your first high-volume verification batch.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Filename</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Total Records</th>
                    <th className="px-3 py-2.5">Valid</th>
                    <th className="px-3 py-2.5">Invalid</th>
                    <th className="px-3 py-2.5">Risky</th>
                    <th className="px-3 py-2.5">Created At</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pastJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-medium text-slate-900 flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{job.filename}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            job.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : job.status === "PROCESSING"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : job.status === "FAILED"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono">{job.totalRecords.toLocaleString()}</td>
                      <td className="px-3 py-2.5 font-mono text-emerald-600 font-semibold">
                        {job.validCount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-red-600">
                        {job.invalidCount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-amber-700">
                        {job.riskyCount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">
                        {new Date(job.createdAt).toLocaleDateString()}{" "}
                        {new Date(job.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => handleSelectPastJob(job)}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors"
                        >
                          {job.status === "COMPLETED" ? "View Results" : "Monitor Job"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: DUPLICATES LIST */}
      {showDuplicatesModal && analysis && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Filtered Duplicate Addresses ({analysis.duplicateCount})
              </h3>
              <button
                onClick={() => setShowDuplicatesModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-500">
              These recurring addresses were identified and deduplicated so you are only billed once per unique lead.
            </p>
            <div className="border border-slate-200 rounded-lg p-2 overflow-y-auto font-mono text-[11px] text-slate-700 divide-y divide-slate-100 flex-1">
              {analysis.duplicateEmails.map((email, idx) => (
                <div key={idx} className="py-1 px-2">
                  {email}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowDuplicatesModal(false)}
              className="w-full py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: MALFORMED LIST */}
      {showMalformedModal && analysis && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Malformed Syntax Addresses ({analysis.malformedCount})
              </h3>
              <button
                onClick={() => setShowMalformedModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-500">
              These entries failed RFC email syntax standards and were filtered before sending to Reoon.
            </p>
            <div className="border border-slate-200 rounded-lg p-2 overflow-y-auto font-mono text-[11px] text-slate-700 divide-y divide-slate-100 flex-1">
              {analysis.malformedEmails.map((email, idx) => (
                <div key={idx} className="py-1 px-2 text-red-700">
                  {email}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowMalformedModal(false)}
              className="w-full py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
