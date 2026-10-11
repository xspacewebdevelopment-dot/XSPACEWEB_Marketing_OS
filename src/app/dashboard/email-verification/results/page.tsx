import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, ListFilter, Download, Search } from "lucide-react";


export default async function VerificationResultsPage() {
  const auth = await getAuthContext();
  const workspaceId = auth?.workspace.id;

  const results = workspaceId
    ? await prisma.verificationResult.findMany({
        where: { workspaceId },
        orderBy: { verifiedAt: "desc" },
        take: 20,
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
        <span className="text-slate-900 font-medium">Verification Results</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Verification Results
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Database Sync
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Inspect individual verified contacts, provider sub-status codes, and reason diagnostics.
          </p>
        </div>

        <button
          disabled
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold border border-slate-200 cursor-not-allowed self-start"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Clean List</span>
        </button>
      </div>

      {/* Filter Bar Scaffolding */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            disabled
            placeholder="Search verified emails..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-400 cursor-not-allowed"
          />
        </div>
        <div className="flex items-center gap-2">
          {["All", "Valid", "Invalid", "Risky", "Unknown"].map((status) => (
            <button
              key={status}
              disabled
              className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed"
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Database Empty State Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {results.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <ListFilter className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-slate-800">
                No verification records in this workspace
              </h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Verified contacts with real deliverability classifications will be listed here after running verification jobs.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Provider Substatus</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Verified At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r: any) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-medium text-slate-900">{r.email}</td>
                    <td className="px-5 py-3">{r.status}</td>
                    <td className="px-5 py-3 text-slate-500">{r.providerSubstatus || "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{r.reason || "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{r.verifiedAt.toISOString()}</td>
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
