import Link from "next/link";
import { CheckCircle, ArrowLeft, Sparkles, Mail, Send } from "lucide-react";

export default function SingleVerifyPage() {
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
        <span className="text-slate-900 font-medium">Single Verification</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Single Email Verification
          </h1>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Phase 1 Scaffolding
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Verify individual email addresses in real-time with syntax checking,
          domain MX resolution, and mailbox handshake.
        </p>
      </div>

      {/* Scaffolding Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700">
            Target Email Address
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                disabled
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
            <button
              disabled
              className="px-4 py-2 rounded-lg bg-slate-200 text-slate-400 text-xs font-semibold cursor-not-allowed flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Verify</span>
            </button>
          </div>
        </div>

        {/* Phase Guard Notice */}
        <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-blue-900">
              Phase 1 Architectural Scaffolding Ready
            </p>
            <p className="text-blue-800/90 leading-relaxed text-[11px]">
              The underlying database schema, tenant isolation, and Reoon provider adapter are completely initialized. Real verification execution will be wired up during Phase 2.
            </p>
          </div>
        </div>

        {/* Empty State Result Container */}
        <div className="p-8 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2">
          <CheckCircle className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">
            No verification results to display
          </p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            When verified, full SMTP handshake analysis, disposable domain status, and deliverability confidence score will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
