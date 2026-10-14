import React from "react";
import { cn } from "@/lib/utils";

interface RibbonBackgroundProps {
  className?: string;
  glow?: boolean;
}

export function RibbonBackground({ className, glow = true }: RibbonBackgroundProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden select-none", className)}>
      {/* Signature vertical ribbon / fluted columnar slats */}
      <div className="absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]">
        <div className="w-full h-full flex justify-between">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-full w-px border-r",
                i % 4 === 0
                  ? "border-blue-500/20 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent"
                  : i % 4 === 2
                  ? "border-slate-400/15 bg-gradient-to-b from-transparent via-slate-400/10 to-transparent"
                  : "border-slate-200/[0.04]"
              )}
            />
          ))}
        </div>
      </div>

      {glow && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle soft ambient light */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/[0.04] rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-indigo-500/[0.03] rounded-full blur-[140px]" />
        </div>
      )}
    </div>
  );
}
