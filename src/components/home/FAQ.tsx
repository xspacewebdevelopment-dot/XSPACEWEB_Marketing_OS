"use client";

import React, { useState } from "react";
import { ChevronDown, MessageCircle, Sparkles } from "lucide-react";
import { GradientBadge } from "@/components/ui/GradientBadge";
import { faqItems } from "@/data/site-content";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faqs" className="relative py-28 md:py-36 bg-[#F8FAFC] border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Title & Contact CTA */}
          <div className="lg:col-span-5 text-left">
            <GradientBadge variant="light" icon={<Sparkles className="w-3.5 h-3.5" />} className="mb-4">
              FREQUENTLY ASKED QUESTIONS
            </GradientBadge>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
              Got Questions?
            </h2>

            <p className="text-slate-600 text-base leading-relaxed mb-8">
              Everything you need to know about using NexaReach, from email verification and
              WhatsApp integration to automated workflows and AI marketing agents.
            </p>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#315BFF]/10 text-[#315BFF] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Need custom advice?</h3>
                  <p className="text-xs text-slate-500">Our team responds in &lt;10 minutes.</p>
                </div>
              </div>
              <a
                href="#pricing"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span>Talk with Our Team</span>
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Accordion */}
          <div className="lg:col-span-7 space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl transition-all duration-300 border ${
                    isOpen
                      ? "bg-white border-[#315BFF]/60 shadow-md shadow-blue-500/5"
                      : "bg-white/80 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    className="w-full p-6 text-left flex items-center justify-between gap-4"
                  >
                    <span className="font-bold text-base sm:text-lg text-slate-900">
                      {item.question}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180 bg-[#315BFF]/10 text-[#315BFF]" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 animate-in fade-in duration-200">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
