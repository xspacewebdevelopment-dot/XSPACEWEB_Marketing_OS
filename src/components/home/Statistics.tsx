"use client";

import React from "react";
import { statisticsData } from "@/data/site-content";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

export function Statistics() {
  return (
    <section className="relative py-12 md:py-20 bg-[#FFFFFF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Prominent Blue/Violet Brand Credibility Card */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#315BFF] via-[#486BFF] to-[#7545FF] p-8 sm:p-12 shadow-2xl shadow-[#315BFF]/25">
          {/* Subtle curved background overlay */}
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-white/[0.12] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-black/10 rounded-full blur-2xl pointer-events-none" />

          {/* 4 Counter Columns */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 divide-y sm:divide-y-0 lg:divide-x divide-white/20">
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
                <h3 className="text-sm sm:text-base font-bold text-white mb-1 leading-snug">
                  {stat.title}
                </h3>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
