import React from "react";
import { partnerLogos } from "@/data/site-content";

export function SocialProof() {
  const marqueeItems = [...partnerLogos, ...partnerLogos, ...partnerLogos];

  return (
    <section className="relative py-14 md:py-18 bg-[#FFFFFF] border-b border-slate-200/80 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Built for ambitious teams, growing businesses, and modern marketers
        </p>
      </div>

      {/* Infinite Marquee Strip with Left & Right Gradient Masks */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="animate-marquee flex items-center gap-10 sm:gap-14 py-2">
          {marqueeItems.map((partner, index) => (
            <div
              key={`${partner.name}-${index}`}
              className="flex items-center gap-3 shrink-0 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all group cursor-default"
            >
              {/* Stylized Logo Monogram */}
              <div className="w-8 h-8 rounded-lg bg-slate-200/80 flex items-center justify-center font-bold text-xs text-slate-800 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all border border-slate-300/60">
                {partner.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors block leading-tight">
                  {partner.name}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {partner.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
