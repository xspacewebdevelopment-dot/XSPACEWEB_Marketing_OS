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
                  ? "border-[#315BFF]/25 bg-gradient-to-b from-transparent via-[#315BFF]/15 to-transparent"
                  : i % 4 === 2
                  ? "border-[#7545FF]/20 bg-gradient-to-b from-transparent via-[#7545FF]/10 to-transparent"
                  : "border-white/[0.04]"
              )}
            />
          ))}
        </div>
      </div>

      {glow && (
        <div className="hero-glow-container">
          {/* Blue glow on left */}
          <div className="hero-glow-blue" />
          {/* Violet glow in center */}
          <div className="hero-glow-violet" />
          {/* Red/pink glow on right */}
          <div className="hero-glow-red" />
        </div>
      )}
    </div>
  );
}
