"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Send,
  GitBranch,
  FileCode2,
  Inbox,
  Radio,
  MessageSquare,
  Share2,
  Smartphone,
  PhoneCall,
  Search,
  Users,
  Layers,
  Sparkles,
  Workflow,
  Bot,
  Zap,
  BarChart3,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  LogOut,
  Building2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user?: {
    email: string;
    name: string | null;
  };
  workspace?: {
    id: string;
    name: string;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ user, workspace, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [emailMarketingOpen, setEmailMarketingOpen] = useState(true);

  const isEmailVerification = pathname.startsWith("/dashboard/email-verification");
  const isTemplates = pathname.startsWith("/dashboard/email-marketing/templates");
  const isCampaigns = pathname.startsWith("/dashboard/email-marketing/campaigns");
  const isOverview = pathname === "/dashboard/email-marketing/overview" || pathname === "/dashboard/email-marketing";
  const isDeliverability = pathname.startsWith("/dashboard/email-marketing/deliverability");
  const isInbox = pathname.startsWith("/dashboard/email-marketing/inbox");

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#061321] text-slate-300 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-[#061321]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <ShieldCheck className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
              NEXAREACH
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                OS
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider">
              MARKETING PLATFORM
            </span>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Workspace Indicator */}
      <div className="px-4 py-3 border-b border-slate-800/60 bg-[#09192d]/60">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Building2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span className="truncate font-medium flex-1">
            {workspace?.name || "NexaReach Core Workspace"}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {/* Core Dashboard */}
        <div>
          <Link
            href="/dashboard"
            onClick={onClose}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
              pathname === "/dashboard"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* SECTION: ENGAGE */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            ENGAGE
          </div>

          {/* Email Marketing Parent with Sub-items */}
          <div className="space-y-0.5">
            <button
              onClick={() => setEmailMarketingOpen(!emailMarketingOpen)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                isEmailVerification || isTemplates
                  ? "text-blue-300 bg-blue-950/40 border border-blue-900/40"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-blue-400" />
                <span>Email Marketing</span>
              </div>
              {emailMarketingOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>

            {emailMarketingOpen && (
              <div className="pl-6 pr-1 pt-1 space-y-0.5 border-l border-slate-800 ml-4">
                {/* Email Marketing Overview - ACTIVE FEATURE */}
                <Link
                  href="/dashboard/email-marketing/overview"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    isOverview
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Overview</span>
                </Link>

                {/* Email Campaigns - ACTIVE FEATURE */}
                <Link
                  href="/dashboard/email-marketing/campaigns"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    isCampaigns
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Campaigns</span>
                </Link>

                {/* Email Templates - ACTIVE FEATURE */}
                <Link
                  href="/dashboard/email-marketing/templates"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    isTemplates
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <FileCode2 className="h-3.5 w-3.5" />
                  <span>Templates</span>
                </Link>

                {/* Email Verification - ACTIVE FEATURE */}
                <Link
                  href="/dashboard/email-verification"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    isEmailVerification
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Email Verification</span>
                </Link>

                {/* Deliverability - ACTIVE FEATURE */}
                <Link
                  href="/dashboard/email-marketing/deliverability"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    isDeliverability
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>Deliverability</span>
                </Link>

                {/* Inbox - Unified Inbox UI Draft */}
                <Link
                  href="/dashboard/email-marketing/inbox"
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    isInbox
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Inbox className="h-3.5 w-3.5" />
                    <span>Inbox</span>
                  </div>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Draft
                  </span>
                </Link>
              </div>
            )}
          </div>

          <DisabledItem icon={MessageSquare} label="WhatsApp Marketing" />
          <DisabledItem icon={Share2} label="Social Media" />
          <DisabledItem icon={Smartphone} label="SMS & RCS" />
          <DisabledItem icon={PhoneCall} label="Voice Campaigns" />
        </div>

        {/* SECTION: LEADS */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            LEADS
          </div>
          <DisabledItem icon={Search} label="Lead Finder" />
          <Link
            href="/dashboard/contacts"
            onClick={onClose}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
              pathname.startsWith("/dashboard/contacts")
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>Contacts</span>
          </Link>
          <Link
            href="/dashboard/lists-segments"
            onClick={onClose}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
              pathname.startsWith("/dashboard/lists-segments")
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span>Lists & Segments</span>
          </Link>
          <DisabledItem icon={Sparkles} label="Enrichment" />
        </div>

        {/* SECTION: AUTOMATION */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            AUTOMATION
          </div>
          <DisabledItem icon={Workflow} label="Workflow Builder" />
          <DisabledItem icon={Bot} label="AI Agents" />
          <DisabledItem icon={Zap} label="Triggers & Events" />
          <DisabledItem icon={FileText} label="Templates" />
        </div>

        {/* SECTION: INBOX */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            INBOX
          </div>
          <DisabledItem icon={Inbox} label="Unified Inbox" />
          <DisabledItem icon={MessageSquare} label="Conversations" />
          <DisabledItem icon={Users} label="Team Collaboration" />
        </div>

        {/* SECTION: ANALYTICS */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            ANALYTICS
          </div>
          <DisabledItem icon={BarChart3} label="Analytics" />
          <DisabledItem icon={FileText} label="Reports" />
        </div>

        {/* SECTION: INTEGRATIONS */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            INTEGRATIONS & SYSTEM
          </div>
          <DisabledItem icon={Zap} label="Integrations" />
          <Link
            href="/dashboard/email-verification/settings"
            onClick={onClose}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
              pathname === "/dashboard/email-verification/settings"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Verification Settings</span>
          </Link>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#071626]">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">
                {user?.name || "Marketing Specialist"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || "user@nexareach.com"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col h-screen fixed inset-y-0 left-0 z-30 shadow-xl">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}

function DisabledItem({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400/80 hover:text-slate-200 hover:bg-slate-900/40 group transition-colors cursor-default"
    >
      <Icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-300 transition-colors" />
      <span>{label}</span>
    </div>
  );
}
