"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileSpreadsheet, Trash2, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SingleItem {
  id: string;
  email: string;
  status: string;
  verificationMode?: string | null;
  overallScore?: number | null;
  verifiedAt: string | Date;
}

interface JobItem {
  id: string;
  filename: string;
  totalRecords: number;
  processedRecords: number;
  status: string;
  createdAt: string | Date;
}

export function OverviewSingleTable({ initialItems }: { initialItems: SingleItem[] }) {
  const [items, setItems] = useState<SingleItem[]>(initialItems);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleDelete = async (id: string, email: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the verification record for "${email}"? This will clean it up from the database.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/dashboard/email-verification/results/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete record");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      setNotice(`Verification record for ${email} was permanently deleted.`);
      setTimeout(() => setNotice(null), 3500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete verification record");
    } finally {
      setDeletingId(null);
    }
  };

  const statusColors: Record<string, string> = {
    VALID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    INVALID: "bg-rose-50 text-rose-700 border-rose-200",
    RISKY: "bg-amber-50 text-amber-700 border-amber-200",
    UNKNOWN: "bg-slate-100 text-slate-700 border-slate-200",
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center space-y-2">
        <div className="h-9 w-9 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <h3 className="text-xs font-semibold text-slate-800">
          No single email verifications yet
        </h3>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
          Verify an individual email to see instant deliverability breakdown and score.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {notice && (
        <div className="mx-5 my-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-1 text-sm cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Email Address</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Mode</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3">Verified Date</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((res) => (
              <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-900">{res.email}</td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      statusColors[res.status] || "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {res.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-600 font-medium">
                  {res.verificationMode || "POWER"}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {res.overallScore !== null && res.overallScore !== undefined
                    ? `${res.overallScore}/100`
                    : "—"}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {formatDate(res.verifiedAt)}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2.5">
                    <Link
                      href={`/dashboard/email-verification/single?email=${encodeURIComponent(
                        res.email
                      )}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      Re-verify
                    </Link>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => handleDelete(res.id, res.email)}
                      disabled={deletingId === res.id}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40"
                      title="Delete verification record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{deletingId === res.id ? "Deleting..." : "Delete"}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OverviewJobsTable({ initialJobs }: { initialJobs: JobItem[] }) {
  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleDelete = async (id: string, filename: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete verification job "${filename}" and its results? This will clean up the database.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/dashboard/email-verification/jobs/${id}?action=delete`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete job");
      }
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setNotice(`Job "${filename}" and related records permanently deleted.`);
      setTimeout(() => setNotice(null), 3500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete job");
    } finally {
      setDeletingId(null);
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="p-10 text-center space-y-2">
        <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <h3 className="text-xs font-semibold text-slate-800">
          No verification jobs yet
        </h3>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
          Your uploaded contact lists and verification runs will appear here with progress tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {notice && (
        <div className="mx-5 my-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-1 text-sm cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Job Name</th>
              <th className="px-5 py-3">Total Records</th>
              <th className="px-5 py-3">Completed</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Created Date</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-900">{job.filename}</td>
                <td className="px-5 py-3 text-slate-600">{job.totalRecords}</td>
                <td className="px-5 py-3 text-slate-600">{job.processedRecords}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                    {job.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {formatDate(job.createdAt)}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2.5">
                    <Link
                      href={`/dashboard/email-verification/jobs/${job.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>View</span>
                    </Link>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => handleDelete(job.id, job.filename)}
                      disabled={deletingId === job.id}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40"
                      title="Delete verification job"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{deletingId === job.id ? "Deleting..." : "Delete"}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
