import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, History } from "lucide-react";


export default async function VerificationHistoryPage() {
  const auth = await getAuthContext();
  const workspaceId = auth?.workspace.id;

  const jobs = workspaceId
    ? await prisma.verificationJob.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/dashboard/email-verification"
          className="hover:text-slate-900 flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Overview
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">History</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Verification Job History
          </h1>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Audit Trail
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Complete historical archive of all single and bulk verification tasks run in this workspace.
        </p>
      </div>

      {/* Database Empty State Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {jobs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <History className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-slate-800">
                No past verification jobs
              </h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Every processed file and verification batch will be preserved here with complete metrics and timestamps.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Job ID / File</th>
                  <th className="px-5 py-3">Total Records</th>
                  <th className="px-5 py-3">Valid</th>
                  <th className="px-5 py-3">Invalid</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-medium text-slate-900">{j.filename}</td>
                    <td className="px-5 py-3 text-slate-600">{j.totalRecords}</td>
                    <td className="px-5 py-3 text-emerald-600">{j.validCount}</td>
                    <td className="px-5 py-3 text-rose-600">{j.invalidCount}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                        {j.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(j.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
