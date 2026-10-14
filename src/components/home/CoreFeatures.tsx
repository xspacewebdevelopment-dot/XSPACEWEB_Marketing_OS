"use client";

import React from "react";
import {
  CheckCheck,
  Mail,
  MessageCircle,
  Share2,
  Database,
  GitBranch,
  Bot,
  Inbox,
  LineChart,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";
import { GradientBadge } from "@/components/ui/GradientBadge";
import { coreFeatures9 } from "@/data/site-content";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";

export function CoreFeatures() {
  const getIcon = (id: string) => {
    switch (id) {
      case "email-verification":
        return <CheckCheck className="w-5 h-5 text-blue-600" />;
      case "email-marketing":
        return <Mail className="w-5 h-5 text-indigo-600" />;
      case "whatsapp-marketing":
        return <MessageCircle className="w-5 h-5 text-emerald-600" />;
      case "social-publishing":
        return <Share2 className="w-5 h-5 text-amber-600" />;
      case "lead-intelligence":
        return <Database className="w-5 h-5 text-blue-600" />;
      case "visual-automation":
        return <GitBranch className="w-5 h-5 text-slate-800" />;
      case "ai-agents":
        return <Bot className="w-5 h-5 text-indigo-600" />;
      case "unified-inbox":
        return <Inbox className="w-5 h-5 text-cyan-600" />;
      case "marketing-analytics":
        return <LineChart className="w-5 h-5 text-emerald-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <section id="features" className="relative py-28 md:py-36 bg-[#FFFFFF] border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header from SECTION 3 of content.txt */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <GradientBadge variant="light" icon={<Sparkles className="w-3.5 h-3.5" />} className="mb-4">
            EVERYTHING YOU NEED TO GROW
          </GradientBadge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
            Powerful Tools. <br className="hidden sm:inline" />
            <span className="text-gradient-brand">One Seamless Experience.</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Explore an integrated suite of tools designed to help modern businesses discover
            opportunities, communicate effectively, and scale customer engagement.
          </p>
        </ScrollReveal>

        {/* 9 Core Feature Cards Grid (3x3 on desktop) */}
        <StaggerContainer
          staggerDelay={0.06}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {coreFeatures9.map((feature) => (
            <StaggerItem key={feature.id} className="h-full">
              <div className="h-full relative rounded-3xl p-7 sm:p-8 bg-slate-50/70 border border-slate-200/90 hover:border-slate-300 hover:bg-white transition-all duration-300 group hover:-translate-y-1 shadow-xs hover:shadow-xl hover:shadow-slate-200/60 flex flex-col justify-between overflow-hidden">
                <div>
                  {/* Top Icon & Tag */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                      {getIcon(feature.id)}
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white text-slate-700 border border-slate-200 shadow-xs">
                      {feature.badge}
                    </span>
                  </div>

                  {/* Capability Category Label */}
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                    {feature.name}
                  </span>

                  {/* Heading & Description */}
                  <h3 className="text-xl font-bold text-slate-900 mb-2.5 leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  {/* 3 Bullet Highlights */}
                  <div className="space-y-2 mb-6 pt-4 border-t border-slate-200/70">
                    {feature.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Link */}
                <div className="pt-2">
                  <a
                    href="#pricing"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors group/link"
                  >
                    <span>{feature.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                  </a>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
