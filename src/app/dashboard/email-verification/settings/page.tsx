import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reoonClient } from "@/lib/reoon/client";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";


export default async function VerificationSettingsPage() {
  const auth = await getAuthContext();
  const workspaceId = auth?.workspace.id;

  let settings = workspaceId
    ? await prisma.verificationSettings.findUnique({
        where: { workspaceId },
      })
    : null;

  if (!settings && workspaceId) {
    settings = await prisma.verificationSettings.create({
      data: {
        workspaceId,
        removeDuplicates: true,
        excludeDisposable: true,
        flagCatchAll: true,
        excludeInvalid: true,
      },
    });
  }

  const providerConfig = reoonClient.getConfigStatus();

  return (
    <div className="space-y-6 max-w-4xl">
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
        <span className="text-slate-900 font-medium">Settings</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Verification Rules & Provider Settings
          </h1>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Database Backed
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Configure default list cleaning heuristics and Reoon verification adapter behavior for {auth?.workspace.name}.
        </p>
      </div>

      {/* Rules Form Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Automated Cleaning Heuristics
        </h2>

        <div className="space-y-4 divide-y divide-slate-100">
          <div className="pt-3 first:pt-0 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800">
                Remove Duplicate Emails
              </span>
              <p className="text-[11px] text-slate-500">
                Normalize strings and filter recurring recipients per list upload.
              </p>
            </div>
            <input
              type="checkbox"
              disabled
              checked={settings?.removeDuplicates ?? true}
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800">
                Exclude Disposable & Temporary Domains
              </span>
              <p className="text-[11px] text-slate-500">
                Flag Mailinator, GuerrillaMail, and known 10-minute inbox domains.
              </p>
            </div>
            <input
              type="checkbox"
              disabled
              checked={settings?.excludeDisposable ?? true}
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800">
                Flag Catch-All Mail Servers
              </span>
              <p className="text-[11px] text-slate-500">
                Identify domains configured with wildcard mail routing.
              </p>
            </div>
            <input
              type="checkbox"
              disabled
              checked={settings?.flagCatchAll ?? true}
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800">
                Auto-suppress Invalid Addresses
              </span>
              <p className="text-[11px] text-slate-500">
                Automatically add confirmed dead mailboxes to workspace suppression table.
              </p>
            </div>
            <input
              type="checkbox"
              disabled
              checked={settings?.excludeInvalid ?? true}
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Provider Details Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Verification Provider Adapter
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] text-slate-500">Active Provider</span>
            <p className="text-xs font-semibold text-slate-900">Reoon Email Verifier</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] text-slate-500">Verification Mode</span>
            <p className="text-xs font-semibold uppercase text-slate-900">{providerConfig.mode}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] text-slate-500">API Key Status</span>
            <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {providerConfig.isConfigured ? "Secured on Server" : "Not Detected"}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-blue-900">
              Settings Mutations Guarded in Phase 1
            </p>
            <p className="text-blue-800/90 leading-relaxed text-[11px]">
              Settings are persisted and initialized in Neon PostgreSQL. Dynamic rule updates and API credential rotation will be enabled alongside Phase 2 workflow controls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
