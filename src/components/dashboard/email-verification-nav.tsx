"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CheckCircle,
  FileSpreadsheet,
  ListFilter,
  History,
  ShieldBan,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const verificationTabs = [
  {
    name: "Overview",
    href: "/dashboard/email-verification",
    icon: BarChart3,
    exact: true,
  },
  {
    name: "Single Verify",
    href: "/dashboard/email-verification/single",
    icon: CheckCircle,
  },
  {
    name: "Bulk Verify",
    href: "/dashboard/email-verification/bulk",
    icon: FileSpreadsheet,
  },
  {
    name: "Results",
    href: "/dashboard/email-verification/results",
    icon: ListFilter,
  },
  {
    name: "History",
    href: "/dashboard/email-verification/history",
    icon: History,
  },
  {
    name: "Suppression List",
    href: "/dashboard/email-verification/suppression",
    icon: ShieldBan,
  },
  {
    name: "Settings",
    href: "/dashboard/email-verification/settings",
    icon: Settings,
  },
];

export function EmailVerificationNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center gap-1 overflow-x-auto px-4 md:px-8 py-1.5 scrollbar-none">
        {verificationTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
