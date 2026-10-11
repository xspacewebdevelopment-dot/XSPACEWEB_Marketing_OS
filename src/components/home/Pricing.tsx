"use client";

import React, { useState } from "react";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { pricingPlans } from "@/data/site-content";

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="relative py-28 md:py-36 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Big Vibrant Blue Container from Page 14 of content.txt */}
        <div className="relative rounded-[32px] sm:rounded-[40px] bg-gradient-to-b from-[#315BFF] via-[#2A4FD6] to-[#1A3499] p-8 sm:p-12 lg:p-16 text-center shadow-2xl overflow-hidden">
          {/* Subtle curved background overlay */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.08] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/20 rounded-full blur-2xl pointer-events-none" />

          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md mb-4 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TRANSPARENT PRICING</span>
          </div>

          {/* Heading from Page 14 */}
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Flexible Plans for Every Stage of Growth.
          </h2>

          <p className="max-w-2xl mx-auto text-white/80 text-sm sm:text-base mb-10 leading-relaxed">
            Choose the tools and capacity that fit your business, with a platform designed to
            support your marketing needs as they evolve.
          </p>

          {/* Monthly / Yearly Toggle Switch */}
          <div className="inline-flex items-center p-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 mb-14">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                !isYearly
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-white hover:text-white/80"
              }`}
            >
              Pay Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                isYearly
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-white hover:text-white/80"
              }`}
            >
              <span>Pay Yearly</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FF4566] text-white text-[10px] font-extrabold uppercase">
                -20%
              </span>
            </button>
          </div>

          {/* 4 Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left items-stretch">
            {pricingPlans.map((plan) => {
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative ${
                    plan.highlight
                      ? "bg-[#0B0F24] text-white border-2 border-[#7545FF] shadow-2xl scale-[1.02] z-10"
                      : "bg-[#F7F8FC] text-slate-900 border border-slate-200/90 shadow-xl"
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-[#315BFF] to-[#7545FF] text-white text-[10px] font-extrabold shadow-md uppercase tracking-wider">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    {/* Plan Name & Tagline */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold leading-tight">{plan.name}</h3>
                      <p className={`text-[11px] font-semibold mt-0.5 ${plan.highlight ? "text-purple-300" : "text-[#315BFF]"}`}>
                        {plan.tagline}
                      </p>
                    </div>

                    <p
                      className={`text-xs mb-6 leading-relaxed ${
                        plan.highlight ? "text-[#B9C1D9]" : "text-slate-600"
                      }`}
                    >
                      {plan.description}
                    </p>

                    {/* Price Header */}
                    <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-black/10 dark:border-white/10">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight">
                        ${price.toFixed(0)}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          plan.highlight ? "text-[#B9C1D9]" : "text-slate-500"
                        }`}
                      >
                        {isYearly ? "/mo (billed yearly)" : "/month"}
                      </span>
                    </div>

                    {/* CTA Button */}
                    <button
                      className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all mb-6 shadow-md flex items-center justify-center gap-1.5 ${
                        plan.highlight
                          ? "bg-gradient-to-r from-[#315BFF] to-[#7545FF] hover:opacity-95 text-white shadow-[#315BFF]/30"
                          : "bg-[#0E1432] hover:bg-[#1A255B] text-white"
                      }`}
                    >
                      <span>{plan.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Feature List */}
                    <div className="space-y-2.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${
                          plan.highlight ? "text-[#B9C1D9]" : "text-slate-500"
                        }`}
                      >
                        Included Features
                      </span>
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              plan.highlight
                                ? "bg-[#315BFF]/30 text-[#60A5FA]"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span
                            className={
                              plan.highlight ? "text-white/90" : "text-slate-700 font-medium"
                            }
                          >
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footnote from Page 14 of content.txt */}
          <div className="mt-12 text-center">
            <p className="text-xs text-white/70 max-w-3xl mx-auto leading-relaxed">
              Plan availability, feature allowances, integrations, AI usage, and third-party messaging
              charges depend on the selected plan and applicable provider terms.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
