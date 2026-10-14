"use client";

import React from "react";
import { statisticsData } from "@/data/site-content";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function Statistics() {
  return (
    <section className="relative py-12 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          {/* Sleek Dark Obsidian / Titanium Credibility Card */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800/90 p-8 sm:p-12 shadow-2xl">
            {/* Subtle radial ambient lighting */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B0F_1px,transparent_1px),linear-gradient(to_bottom,#1E293B0F_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-50" />

            {/* 4 Counter Columns */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 divide-y sm:divide-y-0 lg:divide-x divide-slate-800">
              {statisticsData.map((stat, idx) => (
                <div
                  key={stat.title}
                  className={`pt-6 sm:pt-0 ${
                    idx > 0 ? "lg:pl-8" : ""
                  } flex flex-col justify-center text-left`}
                >
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-2 flex items-baseline">
                    <AnimatedCounter
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      decimals={stat.value % 1 !== 0 ? 1 : 0}
                    />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-200 mb-1 leading-snug">
                    {stat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
