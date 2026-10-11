"use client";

import React from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Large Rounded Container with Iconic Fluted Glass Ribbon Background */}
        <div className="relative rounded-[32px] sm:rounded-[44px] bg-gradient-to-br from-[#315BFF] via-[#5C3AFF] to-[#991B52] p-10 sm:p-16 lg:p-20 text-center shadow-2xl overflow-hidden border border-white/20">
          {/* Vertical ribbon fluted slats inside the CTA banner matching Qarin! */}
          <div className="absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none">
            <div className="w-full h-full flex justify-between">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="h-full w-px border-r border-white/30"
                />
              ))}
            </div>
          </div>

          {/* Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#FF4566]/30 rounded-full blur-3xl pointer-events-none" />

          {/* Eyebrow */}
          <div className="relative z-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md mb-6 border border-white/25">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ONE PLATFORM. EVERY CHANNEL. SMARTER GROWTH.</span>
          </div>

          {/* Headline from SECTION 10 */}
          <h2 className="relative z-10 text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6 max-w-3xl mx-auto">
            Your Next Stage of Growth Starts Here.
          </h2>

          {/* Supporting Copy */}
          <p className="relative z-10 max-w-2xl mx-auto text-white/90 text-sm sm:text-lg mb-10 leading-relaxed font-normal">
            One connected workspace for smarter campaigns, better conversations, and more
            efficient marketing operations. Simplify the way your team reaches, engages, and
            converts customers.
          </p>

          {/* Action Buttons */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href="#pricing"
              className="px-8 py-4 rounded-full text-sm font-bold bg-white text-slate-900 hover:bg-[#F7F8FC] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20 flex items-center gap-2 group"
            >
              <span>Get Started with NexaReach</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[#315BFF]" />
            </a>
            <a
              href="#pricing"
              className="px-8 py-4 rounded-full text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md transition-all"
            >
              <span>Contact Our Team</span>
            </a>
          </div>

          {/* Supporting Text from SECTION 10 */}
          <div className="relative z-10 text-xs text-white/80 font-medium">
            <span>Build meaningful customer relationships — powered by smarter marketing technology.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
