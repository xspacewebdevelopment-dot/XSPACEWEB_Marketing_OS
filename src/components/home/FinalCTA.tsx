"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function FinalCTA() {
  return (
    <section className="relative py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          {/* Deep Obsidian Canvas with Refined Glass Architecture */}
          <div className="relative rounded-[32px] sm:rounded-[44px] bg-slate-950 p-10 sm:p-16 lg:p-20 text-center shadow-2xl overflow-hidden border border-slate-800">
            {/* Fine architectural vertical slats */}
            <div className="absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none">
              <div className="w-full h-full flex justify-between">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-full w-px border-r border-slate-700/50"
                  />
                ))}
              </div>
            </div>

            {/* Subtle soft ambient light */}
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />

            {/* Eyebrow */}
            <div className="relative z-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold backdrop-blur-md mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>ONE PLATFORM. EVERY CHANNEL. SMARTER GROWTH.</span>
            </div>

            {/* Headline from SECTION 10 */}
            <h2 className="relative z-10 text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6 max-w-3xl mx-auto">
              Your Next Stage of Growth Starts Here.
            </h2>

            {/* Supporting Copy */}
            <p className="relative z-10 max-w-2xl mx-auto text-slate-300 text-sm sm:text-lg mb-10 leading-relaxed font-normal">
              One connected workspace for smarter campaigns, better conversations, and more
              efficient marketing operations. Simplify the way your team reaches, engages, and
              converts customers.
            </p>

            {/* Action Buttons */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/login"
                className="px-8 py-4 rounded-full text-sm font-bold bg-white text-slate-950 hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/30 flex items-center gap-2 group"
              >
                <span>Get Started with NexaReach</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-blue-600" />
              </Link>
              <a
                href="#contact"
                className="px-8 py-4 rounded-full text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
              >
                <span>Contact Our Team</span>
              </a>
            </div>

            {/* Supporting Text from SECTION 10 */}
            <div className="relative z-10 text-xs text-slate-400 font-medium">
              <span>Build meaningful customer relationships — powered by smarter marketing technology.</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
