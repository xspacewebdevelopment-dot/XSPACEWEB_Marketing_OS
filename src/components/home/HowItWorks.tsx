"use client";

import React from "react";
import { Sparkles, ArrowRight, Database, CheckCheck, UserCheck, Send, GitBranch, LineChart } from "lucide-react";
import { GradientBadge } from "@/components/ui/GradientBadge";
import { howItWorksSteps } from "@/data/site-content";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";

export function HowItWorks() {
  const getStepIcon = (step: string) => {
    switch (step) {
      case "01":
        return <Database className="w-4 h-4 text-blue-600" />;
      case "02":
        return <CheckCheck className="w-4 h-4 text-emerald-600" />;
      case "03":
        return <UserCheck className="w-4 h-4 text-indigo-600" />;
      case "04":
        return <Send className="w-4 h-4 text-amber-600" />;
      case "05":
        return <GitBranch className="w-4 h-4 text-slate-800" />;
      case "06":
        return <LineChart className="w-4 h-4 text-cyan-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <section id="how-it-works" className="relative py-28 md:py-36 bg-white border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header from SECTION 4 of content.txt */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <GradientBadge variant="light" icon={<Sparkles className="w-3.5 h-3.5" />} className="mb-4">
            FROM FIRST CONTACT TO LASTING CUSTOMER
          </GradientBadge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
            From Lead to Conversion. <br className="hidden sm:inline" />
            <span className="text-gradient-brand">One Connected Journey.</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Build a smarter marketing process where every action contributes to the next.
          </p>
        </ScrollReveal>

        {/* 6 Steps Grid */}
        <StaggerContainer
          staggerDelay={0.07}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {howItWorksSteps.map((item) => (
            <StaggerItem key={item.step} className="h-full">
              <div className="h-full flex flex-col justify-between rounded-3xl bg-slate-50/80 border border-slate-200 p-6 sm:p-7 group hover:border-blue-500/40 hover:bg-white hover:shadow-lg transition-all duration-300">
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-200/70 text-slate-800">
                      Step {item.step}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                      {getStepIcon(item.step)}
                    </div>
                  </div>

                  {/* Step Sub-label & Title */}
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                    {item.name}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                {/* Step Tag */}
                <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {item.tag}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Bottom CTA */}
        <ScrollReveal delay={0.2} className="mt-16 text-center">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md group"
          >
            <span>Explore the Platform</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}
