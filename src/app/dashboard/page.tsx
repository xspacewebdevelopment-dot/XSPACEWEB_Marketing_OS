import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ShieldCheck,
  ArrowRight,
  Mail,
  Workflow,
  Sparkles,
  Clock,
  Building,
} from "lucide-react";


export default async function DashboardPage() {
  const auth = await getAuthContext();
  const workspaceId = auth?.workspace.id;

  const [totalVerified, jobsCount] = await Promise.all([
    workspaceId
      ? prisma.verificationResult.count({ where: { workspaceId } })
      : 0,
    workspaceId
      ? prisma.verificationJob.count({ where: { workspaceId } })
      : 0,
  ]);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#061321] via-[#0b213b] to-[#14325a] p-6 md:p-8 text-white shadow-lg border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            NexaReach Phase 1 • Foundation & Architecture Active
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Welcome, {auth?.user.name || "Marketer"}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Your high-deliverability marketing platform. Foundational database
            architecture, tenant isolation, and Email Verification modules are fully configured.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/email-verification"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              <ShieldCheck className="h-4 w-4" />
              Open Email Verification
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-white/90 text-xs font-medium border border-white/10">
              <Building className="h-3.5 w-3.5 text-blue-300" />
              <span>Workspace: {auth?.workspace.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Highlight Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Module: Email Verification */}
        <div className="rounded-xl border border-blue-200/80 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Phase 1 Active
              </span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Email Verification
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Protect deliverability with deterministic verification, suppression lists, and credit-safe architecture.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-4 text-xs text-slate-600">
              <div>
                <span className="font-bold text-slate-900">{totalVerified}</span> verified
              </div>
              <div>
                <span className="font-bold text-slate-900">{jobsCount}</span> jobs
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link
              href="/dashboard/email-verification"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
            >
              Access Verification Module
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Upcoming: Email Campaigns */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between opacity-80">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Phase 2
              </span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Email Marketing
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Multi-step sequences, drag-and-drop templates, and Resend sending pipeline.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Pending Phase 2 activation</span>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 mt-4">
            <span className="text-xs font-medium text-slate-400">
              Unavailable in Phase 1
            </span>
          </div>
        </div>

        {/* Upcoming: Leads & Automations */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between opacity-80">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Workflow className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Phase 3+
              </span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Leads & Automation
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Visual workflow builder, automated lead scoring, and multi-channel triggers.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Scheduled for Phase 3</span>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 mt-4">
            <span className="text-xs font-medium text-slate-400">
              Unavailable in Phase 1
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
