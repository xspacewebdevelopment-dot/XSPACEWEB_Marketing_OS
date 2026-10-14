"use client";

import React from "react";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { GradientBadge } from "@/components/ui/GradientBadge";
import { integrationCategories } from "@/data/site-content";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";

export function Integrations() {
  return (
    <section id="integrations" className="relative py-28 md:py-36 bg-white border-t border-slate-200/80 overflow-hidden">
      {/* Subtle orbital background circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-slate-100 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-slate-100 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-blue-500/[0.04] blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Eyebrow Badge */}
        <ScrollReveal>
          <GradientBadge variant="light" icon={<Sparkles className="w-3.5 h-3.5" />} className="mb-4">
            ECOSYSTEM &amp; CONNECTIVITY
          </GradientBadge>

          {/* Heading */}
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
            Connect the tools <br className="hidden sm:inline" />
            <span className="text-gradient-brand">your team already uses.</span>
          </h2>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-slate-600 text-base sm:text-lg leading-relaxed mb-16">
            NexaReach natively synchronizes with your communication, email, billing, and CRM platforms
            with zero engineering overhead.
          </p>
        </ScrollReveal>

        {/* Central Hub & Surrounding Integration Cards Grid */}
        <StaggerContainer
          staggerDelay={0.06}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto"
        >
          {integrationCategories.map((tool) => (
            <StaggerItem key={tool.name}>
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-blue-500/50 hover:bg-white transition-all duration-300 group flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3.5 border border-slate-200 shadow-sm group-hover:scale-110 transition-transform bg-white"
                  style={{ color: tool.color }}
                >
                  <span className="font-extrabold text-base">
                    {tool.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                  {tool.name}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {tool.category}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Bottom CTA */}
        <ScrollReveal delay={0.2} className="mt-12 text-center">
          <p className="text-xs text-slate-500">
            Looking for a custom enterprise webhook?{" "}
            <a href="#pricing" className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-0.5">
              Explore API documentation <ArrowUpRight className="w-3 h-3" />
            </a>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
