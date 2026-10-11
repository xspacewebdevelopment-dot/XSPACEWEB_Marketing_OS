import Link from "next/link";
import { Upload, ArrowLeft, Sparkles } from "lucide-react";

export default function BulkVerifyPage() {
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
        <span className="text-slate-900 font-medium">Bulk Verification</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Bulk List Email Verification
          </h1>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Phase 1 Scaffolding
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Upload and scrub high-volume lead contact lists. Automatically deduplicate,
          filter disposable emails, and isolate invalid addresses before campaign dispatch.
        </p>
      </div>

      {/* Upload Scaffolding Dropzone */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center space-y-3 bg-slate-50/50">
          <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Upload className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-800">
              Drag & Drop your contact file here, or browse
            </p>
            <p className="text-[11px] text-slate-500">
              Supports CSV, XLSX, and TXT files up to 50,000 records
            </p>
          </div>
          <div className="pt-2">
            <button
              disabled
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold border border-slate-200 cursor-not-allowed"
            >
              Browse Files (Phase 2)
            </button>
          </div>
        </div>

        {/* Phase Guard Notice */}
        <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-blue-900">
              Background Queue Integration Prepared
            </p>
            <p className="text-blue-800/90 leading-relaxed text-[11px]">
              Inngest background execution pipeline and <code className="font-mono text-blue-950">VerificationJob</code> database schema are already provisioned. Chunked file ingestion will activate in Phase 2.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
