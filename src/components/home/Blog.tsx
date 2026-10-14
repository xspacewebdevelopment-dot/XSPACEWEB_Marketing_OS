"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { GradientBadge } from "@/components/ui/GradientBadge";
import { blogArticles } from "@/data/site-content";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";

export function Blog() {
  return (
    <section id="blog" className="relative py-28 md:py-36 bg-white border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <GradientBadge variant="light" icon={<Sparkles className="w-3.5 h-3.5" />} className="mb-4">
            EDITORIAL &amp; INSIGHTS
          </GradientBadge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
            Ideas and insights for <br className="hidden sm:inline" />
            <span className="text-gradient-brand">smarter growth.</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Proven strategies, benchmarks, and tactical playbooks from leading revenue operators.
          </p>
        </ScrollReveal>

        {/* 3 Editorial Cards Grid */}
        <StaggerContainer
          staggerDelay={0.08}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {blogArticles.map((article) => (
            <StaggerItem key={article.id} className="h-full">
              <article className="h-full rounded-3xl bg-slate-50/70 border border-slate-200 overflow-hidden hover:border-blue-500/40 hover:bg-white transition-all duration-300 group flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1.5">
                <div>
                  {/* Image Container with Hover Zoom */}
                  <div className="relative h-52 sm:h-56 w-full overflow-hidden">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 380px"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/20 backdrop-blur-md text-white text-[11px] font-semibold">
                      {article.category}
                    </div>
                  </div>

                  {/* Article Info */}
                  <div className="p-6 sm:p-7">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <span className="font-semibold text-slate-800">{article.author}</span>
                      <span>·</span>
                      <span>{article.date}</span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors leading-snug">
                      {article.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>
                </div>

                {/* Read Action Button */}
                <div className="px-6 pb-6 pt-2">
                  <a
                    href="#pricing"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:text-blue-700 transition-colors"
                  >
                    <span>Read article</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
