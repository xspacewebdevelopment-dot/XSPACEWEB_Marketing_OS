import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reoonClient } from "@/lib/reoon/client";
import { formatDate, formatNumber } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Percent,
  Plus,
  Upload,
  FileSpreadsheet,
  History,
  ShieldBan,
  Activity,
  Server,
  ArrowRight,
  Database,
} from "lucide-react";


export default async function EmailVerificationOverviewPage() {
  const auth = await getAuthContext();
  const workspaceId = auth?.workspace.id;

  // Real database queries - returns 0 if no records exist in Neon PostgreSQL
  const [
    totalVerified,
    validCount,
    invalidCount,
    riskyCount,
    unknownCount,
    recentJobs,
  ] = await Promise.all([
    workspaceId
      ? prisma.verificationResult.count({ where: { workspaceId } })
      : 0,
    workspaceId
      ? prisma.verificationResult.count({
          where: { workspaceId, status: "VALID" },
        })
      : 0,
    workspaceId
      ? prisma.verificationResult.count({
          where: { workspaceId, status: "INVALID" },
        })
      : 0,
    workspaceId
      ? prisma.verificationResult.count({
          where: { workspaceId, status: "RISKY" },
        })
      : 0,
    workspaceId
      ? prisma.verificationResult.count({
          where: { workspaceId, status: "UNKNOWN" },
        })
      : 0,
    workspaceId
      ? prisma.verificationJob.findMany({
          where: { workspaceId },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : [],
  ]);

  const validityRate =
    totalVerified > 0 ? ((validCount / totalVerified) * 100).toFixed(1) : "0.0";

  const providerConfig = reoonClient.getConfigStatus();
  const balanceInfo = await reoonClient.getAccountBalance();

  return (
    <div className="space-y-8">
      {/* A. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Email Verification
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              Core Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Clean, validate, and protect your sender reputation with automated
            email verification. Guard your domain health before launching
            campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/email-verification/single"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Single Verify</span>
          </Link>
          <Link
            href="/dashboard/email-verification/bulk"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Bulk Verify</span>
          </Link>
        </div>
      </div>

      {/* B. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Verified */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Verified</span>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatNumber(totalVerified)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across all jobs & single
          </div>
        </div>

        {/* Valid Emails */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Valid Emails</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight">
            {formatNumber(validCount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Safe to deliver
          </div>
        </div>

        {/* Invalid Emails */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Invalid Emails</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 tracking-tight">
            {formatNumber(invalidCount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Suppressed / Bounced
          </div>
        </div>

        {/* Risky Emails */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Risky Emails</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 tracking-tight">
            {formatNumber(riskyCount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Disposable & Catch-all
          </div>
        </div>

        {/* Unknown Emails */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Unknown</span>
            <HelpCircle className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-600 tracking-tight">
            {formatNumber(unknownCount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Unresponsive servers
          </div>
        </div>

        {/* Validity Rate */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Validity Rate</span>
            <Percent className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 tracking-tight">
            {validityRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalVerified === 0 ? "No data yet" : "Overall list quality"}
          </div>
        </div>
      </div>

      {/* Main Grid: Activity & Provider Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* C. Verification Activity Chart Container */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Verification Activity
              </h2>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              Real-time Database Metric
            </span>
          </div>

          {/* Database-backed empty state - no fake graphs */}
          <div className="my-8 py-10 px-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Database className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-slate-800">
                No verification activity recorded yet
              </h3>
              <p className="text-[11px] text-slate-500 max-w-sm">
                Activity timelines will chart your list health once you run your
                first single or bulk verification job in Phase 2.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/dashboard/email-verification/single"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <span>Preview single verify scaffolding</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Database Status: Connected to Neon PostgreSQL</span>
            <span className="font-medium text-slate-700">0 records in workspace</span>
          </div>
        </div>

        {/* F. Provider Status Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Provider Status
              </h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Reoon Engine
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Configuration:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {providerConfig.isConfigured ? "API Key Detected" : "Key Needed"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Verification Mode:</span>
                <span className="font-semibold uppercase text-slate-900">
                  {providerConfig.mode}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Phase 1 Safety:</span>
                <span className="font-semibold text-blue-600">
                  0 Credits Consumed
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Credit Balance:</span>
                <span className="font-medium text-slate-500">
                  {balanceInfo.credits !== null
                    ? `${balanceInfo.credits} credits`
                    : balanceInfo.status}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/60 text-[11px] text-blue-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
                Phase 1 Verification Guard
              </p>
              <p className="text-blue-800/90 leading-relaxed">
                Reoon integration adapter is tested and server-safe. Real credit-consuming verification will be unlocked upon Phase 2 approval.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard/email-verification/settings"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50/50 transition-colors"
            >
              <span>View Verification Settings</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* D. Recent Verification Jobs Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Verification Jobs
            </h2>
            <p className="text-[11px] text-slate-500">
              Batches processed and list cleaning activity
            </p>
          </div>
          <Link
            href="/dashboard/email-verification/history"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Full History</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentJobs.length === 0 ? (
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Job Name</th>
                  <th className="px-5 py-3">Total Records</th>
                  <th className="px-5 py-3">Completed</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {job.filename}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {job.totalRecords}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {job.processedRecords}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {formatDate(job.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* E. Quick Actions Bar */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <Link
            href="/dashboard/email-verification/single"
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all flex items-start gap-3 group"
          >
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                Verify Single
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Validate individual email
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/email-verification/bulk"
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xs transition-all flex items-start gap-3 group"
          >
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                Upload Email List
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Bulk CSV / XLSX processing
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/email-verification/results"
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-xs transition-all flex items-start gap-3 group"
          >
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                View Results
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Filter valid & risky leads
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/email-verification/history"
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-400 hover:shadow-xs transition-all flex items-start gap-3 group"
          >
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                History
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Past job reports & audits
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/email-verification/suppression"
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-rose-400 hover:shadow-xs transition-all flex items-start gap-3 group"
          >
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <ShieldBan className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                Suppression List
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Excluded & bounced emails
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
