"use client";

import { Menu, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  user?: {
    email: string;
    name: string | null;
  };
  workspace?: {
    id: string;
    name: string;
  };
  onOpenMobileMenu?: () => void;
  verificationMode?: "mock" | "live";
}

export function Header({
  user,
  workspace,
  onOpenMobileMenu,
  verificationMode = "mock",
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-200/80 bg-white sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between">
      {/* Left side: Mobile trigger & Workspace context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800 tracking-tight">
            {workspace?.name || "NexaReach Core Workspace"}
          </span>
          <span className="hidden sm:inline-block text-slate-300">•</span>
          <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
            Marketing OS
          </span>
        </div>
      </div>

      {/* Right side: Verification Status Badge, Help, & User */}
      <div className="flex items-center gap-3">
        {/* Reoon Provider Status Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors bg-slate-50 text-slate-700 border-slate-200">
          {verificationMode === "live" ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Live Mode</span>
            </>
          ) : (
            <>
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-amber-800 font-semibold">Mock Mode</span>
              <span className="hidden lg:inline text-[10px] text-amber-600">
                (0 Credits Consumed)
              </span>
            </>
          )}
        </div>

        {/* Quick Help */}
        <Link
          href="/dashboard/email-verification/settings"
          className="hidden sm:flex text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
        >
          Config
        </Link>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-semibold text-white shadow-xs">
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-medium text-slate-800 leading-tight">
              {user?.name || "User"}
            </span>
            <span className="text-[10px] text-slate-500 leading-tight truncate max-w-[120px]">
              {user?.email || "user@nexareach.com"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
