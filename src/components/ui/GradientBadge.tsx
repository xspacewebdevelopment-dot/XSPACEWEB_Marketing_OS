import React from "react";
import { cn } from "@/lib/utils";

interface GradientBadgeProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  variant?: "dark" | "blue" | "light";
}

export function GradientBadge({
  children,
  icon,
  className,
  variant = "light",
}: GradientBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300",
        variant === "light" &&
          "bg-slate-100/90 border border-slate-200 text-slate-800 hover:bg-slate-200/80 shadow-xs",
        variant === "blue" &&
          "bg-blue-500/10 border border-blue-500/25 text-blue-600 hover:bg-blue-500/15",
        variant === "dark" &&
          "bg-slate-900 border border-slate-800 text-white shadow-xs",
        className
      )}
    >
      {icon && <span className="text-blue-600">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
