import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, ShieldBan, Plus } from "lucide-react";


export default async function SuppressionListPage() {
  const auth = await getAuthContext();
  const workspaceId = auth?.workspace.id;

  const suppressions = workspaceId
    ? await prisma.suppressionEntry.findMany({
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
        <span className="text-slate-900 font-medium">Suppression List</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Workspace Suppression List
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Domain Safety
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Guaranteed exclusion list. Any email in this list will never be sent to by marketing campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-xs font-semibold cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Email (Phase 2)</span>
          </button>
        </div>
      </div>

      {/* Database Empty State Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {suppressions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <ShieldBan className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-slate-800">
                Suppression list is empty
              </h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Hard bounces, spam complaints, and unsubscribes will automatically register here to guard your sender score.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Normalized Email</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Added Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppressions.map((s: any) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3 font-medium text-slate-900">{s.normalizedEmail}</td>
                    <td className="px-5 py-3 text-slate-600">{s.reason}</td>
                    <td className="px-5 py-3 text-slate-600">{s.source}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(s.createdAt)}</td>
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
