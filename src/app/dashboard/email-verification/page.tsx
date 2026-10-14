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
import { OverviewSingleTable, OverviewJobsTable } from "./components/OverviewTables";
import { VerificationActivityCard } from "./components/VerificationActivityCard";

export default async function EmailVerificationOverviewPage() {
  const auth = await getAuthContext();
  const workspaceId = auth?.workspace.id;

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  // Real database queries - returns 0 if no records exist in Neon PostgreSQL
  const [
    totalVerified,
    validCount,
    invalidCount,
    riskyCount,
    unknownCount,
    recentJobs,
    recentSingle,
    singleCount,
    bulkCount,
    disposableCount,
    roleBasedCount,
    freeEmailCount,
    scoreAgg,
    recentResultsForChart,
  ] = await Promise.all([
    workspaceId ? prisma.verificationResult.count({ where: { workspaceId } }) : 0,
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
    workspaceId
      ? prisma.verificationResult.findMany({
          where: { workspaceId, source: "SINGLE" },
          orderBy: { verifiedAt: "desc" },
          take: 5,
        })
      : [],
    workspaceId
      ? prisma.verificationResult.count({
          where: { workspaceId, source: "SINGLE" },
        })
      : 0,
    workspaceId
      ? prisma.verificationResult.count({
          where: { workspaceId, source: "BULK" },
        })
      : 0,
    workspaceId
      ? prisma.verificationResult.count({
          where: { workspaceId, isDisposable: true },
        })
      : 0,
    workspaceId
      ? prisma.verificationResult.count({
          where: { workspaceId, isRoleBased: true },
        })
      : 0,
    workspaceId
      ? prisma.verificationResult.count({
          where: { workspaceId, isFreeEmail: true },
        })
      : 0,
    workspaceId
      ? prisma.verificationResult.aggregate({
          where: { workspaceId, overallScore: { not: null } },
          _avg: { overallScore: true },
        })
      : null,
    workspaceId
      ? prisma.verificationResult.findMany({
          where: {
            workspaceId,
            verifiedAt: { gte: fourteenDaysAgo },
          },
          select: {
            status: true,
            source: true,
            verifiedAt: true,
            overallScore: true,
          },
          orderBy: { verifiedAt: "asc" },
        })
      : [],
  ]);

  let allRecentResults = recentResultsForChart;
  if (allRecentResults.length === 0 && totalVerified > 0 && workspaceId) {
    allRecentResults = await prisma.verificationResult.findMany({
      where: { workspaceId },
      select: {
        status: true,
        source: true,
        verifiedAt: true,
        overallScore: true,
      },
      orderBy: { verifiedAt: "desc" },
      take: 200,
    });
  }

  const now = new Date();
  const buildDays = (daysCount: number) => {
    const map = new Map<
      string,
      {
        dateKey: string;
        label: string;
        dayOfWeek: string;
        valid: number;
        invalid: number;
        risky: number;
        unknown: number;
        total: number;
      }
    >();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "short" });
      map.set(dateKey, {
        dateKey,
        label,
        dayOfWeek,
        valid: 0,
        invalid: 0,
        risky: 0,
        unknown: 0,
        total: 0,
      });
    }

    allRecentResults.forEach((r) => {
      const rDate = new Date(r.verifiedAt);
      const key = rDate.toISOString().split("T")[0];
      const entry = map.get(key);
      if (entry) {
        entry.total += 1;
        if (r.status === "VALID") entry.valid += 1;
        else if (r.status === "INVALID") entry.invalid += 1;
        else if (r.status === "RISKY") entry.risky += 1;
        else entry.unknown += 1;
      }
    });

    return Array.from(map.values());
  };

  const sevenDaysData = buildDays(7);
  const fourteenDaysData = buildDays(14);

  const averageScore = scoreAgg?._avg?.overallScore
    ? Math.round(scoreAgg._avg.overallScore)
    : null;

  const lastVerifiedAt =
    recentSingle.length > 0
      ? formatDate(recentSingle[0].verifiedAt)
      : recentJobs.length > 0 && recentJobs[0].completedAt
      ? formatDate(recentJobs[0].completedAt)
      : null;

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
        {/* C. Verification Activity Component */}
        <VerificationActivityCard
          totalVerified={totalVerified}
          validCount={validCount}
          invalidCount={invalidCount}
          riskyCount={riskyCount}
          unknownCount={unknownCount}
          validityRate={validityRate}
          singleCount={singleCount}
          bulkCount={bulkCount}
          averageScore={averageScore}
          disposableCount={disposableCount}
          roleBasedCount={roleBasedCount}
          freeEmailCount={freeEmailCount}
          sevenDaysData={sevenDaysData}
          fourteenDaysData={fourteenDaysData}
          lastVerifiedAt={lastVerifiedAt}
        />

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
                <span className="font-semibold uppercase text-emerald-600">
                  Live API
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Engine Type:</span>
                <span className="font-semibold text-blue-600">
                  Real-Time SMTP
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Credit Balance:</span>
                <span className="font-medium text-slate-500">
                  {balanceInfo.totalCreditsRemaining !== null
                    ? `${balanceInfo.totalCreditsRemaining.toLocaleString()} credits`
                    : balanceInfo.status}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-emerald-200/60 bg-emerald-50/70 text-emerald-900 text-[11px] space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                Production Reoon Engine Active
              </p>
              <p className="leading-relaxed opacity-90">
                Real-time deep SMTP mailbox verification is enabled via Reoon API. Provider credits synchronize dynamically with every verification.
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

      {/* D. Recent Single Verifications Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Single Verifications
            </h2>
            <p className="text-[11px] text-slate-500">
              Real-time individual address validations and mailbox checks
            </p>
          </div>
          <Link
            href="/dashboard/email-verification/single"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Verify Single</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <OverviewSingleTable initialItems={recentSingle as any} />
      </div>

      {/* D2. Recent Verification Jobs Table */}
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

        <OverviewJobsTable initialJobs={recentJobs as any} />
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
