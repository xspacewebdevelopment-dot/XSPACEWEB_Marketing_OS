"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Zap,
  Sliders,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { pricingPlans } from "@/data/site-content";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";

const volumeTiers = [
  { label: "Up to 5k", planId: "starter", contacts: "2,500 contacts", verifications: "5k verifications" },
  { label: "Up to 25k", planId: "growth", contacts: "15,000 contacts", verifications: "25k verifications" },
  { label: "Up to 75k", planId: "pro", contacts: "50,000 contacts", verifications: "75k verifications" },
  { label: "100k+", planId: "enterprise", contacts: "Custom contacts", verifications: "Custom volume" },
];

const featureComparisonMatrix = [
  {
    category: "Data & Verification",
    features: [
      { name: "Monthly Email Verifications", starter: "5,000", growth: "25,000", pro: "75,000", enterprise: "Custom Unlimited" },
      { name: "Deliverability & MX Syntax Check", starter: true, growth: true, pro: true, enterprise: true },
      { name: "Disposable & Spam Trap Filter", starter: true, growth: true, pro: true, enterprise: true },
      { name: "Real-time SMTP Handshake", starter: false, growth: true, pro: true, enterprise: true },
    ],
  },
  {
    category: "Campaigns & Automation",
    features: [
      { name: "Active Contacts Database", starter: "2,500", growth: "15,000", pro: "50,000", enterprise: "Custom Scale" },
      { name: "Visual Workflow Automation", starter: "Basic", growth: "Full Visual", pro: "Advanced Conditional", enterprise: "Enterprise Custom" },
      { name: "A/B Testing & Dynamic Logic", starter: false, growth: true, pro: true, enterprise: true },
      { name: "Official WhatsApp Integration", starter: false, growth: false, pro: true, enterprise: true },
      { name: "Social Publishing Engine", starter: false, growth: true, pro: true, enterprise: true },
    ],
  },
  {
    category: "AI & Intelligence",
    features: [
      { name: "Autonomous AI Marketing Agents", starter: "None", growth: "Draft Assist", pro: "All 6 Specialized Agents", enterprise: "Custom Agent Workflows" },
      { name: "AI Lead Enrichment & Scoring", starter: false, growth: true, pro: true, enterprise: true },
      { name: "Automated Follow-up Copilot", starter: false, growth: false, pro: true, enterprise: true },
    ],
  },
  {
    category: "Support & Security",
    features: [
      { name: "Dedicated IP Address", starter: false, growth: false, pro: "Add-on", enterprise: "Included" },
      { name: "Support Response SLA", starter: "48h Community", growth: "24h Standard", pro: "4h Priority", enterprise: "Dedicated SLA & Slack" },
      { name: "Role-Based Permissions & Audit Logs", starter: false, growth: false, pro: true, enterprise: true },
    ],
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [activeVolumeIndex, setActiveVolumeIndex] = useState(1);
  const [showComparison, setShowComparison] = useState(false);

  const recommendedPlanId = volumeTiers[activeVolumeIndex].planId;

  return (
    <section id="pricing" className="relative py-28 md:py-36 bg-[#0B0F19] text-white overflow-hidden">
      {/* Background Decorative Grid & Spotlights */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B12_1px,transparent_1px),linear-gradient(to_bottom,#1E293B12_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-60" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-blue-600/15 via-indigo-600/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[350px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold backdrop-blur-md mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TRANSPARENT &amp; PREDICTABLE PRICING</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-5 leading-[1.1]">
            Flexible Plans for Every Stage of Growth.
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Choose the tools and capacity that fit your business, with a platform designed to
            support your marketing needs as they evolve.
          </p>
        </ScrollReveal>

        {/* Interactive Controls Bar: Billing Toggle + Volume Estimator */}
        <ScrollReveal delay={0.15} className="mb-14">
          <div className="max-w-4xl mx-auto p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Interactive Billing Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Billing:</span>
              <div className="relative flex items-center p-1 rounded-full bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsYearly(false)}
                  className={`relative z-10 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors ${
                    !isYearly ? "text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {!isYearly && (
                    <motion.div
                      layoutId="billingTabHighlight"
                      className="absolute inset-0 rounded-full bg-blue-600 shadow-lg shadow-blue-600/30"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">Pay Monthly</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsYearly(true)}
                  className={`relative z-10 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
                    isYearly ? "text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {isYearly && (
                    <motion.div
                      layoutId="billingTabHighlight"
                      className="absolute inset-0 rounded-full bg-blue-600 shadow-lg shadow-blue-600/30"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">Pay Yearly</span>
                  <span className="relative z-10 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wide">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Interactive Volume Estimator Slider */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold">Quick Sizing:</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                {volumeTiers.map((tier, idx) => (
                  <button
                    key={tier.label}
                    onClick={() => setActiveVolumeIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeVolumeIndex === idx
                        ? "bg-slate-800 text-blue-400 shadow-sm border border-slate-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* 4 Differentiated Pricing Cards Grid */}
        <StaggerContainer
          staggerDelay={0.08}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-12"
        >
          {pricingPlans.map((plan) => {
            const isTargetTier = plan.id === recommendedPlanId;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const savings = (plan.monthlyPrice - plan.yearlyPrice) * 12;

            return (
              <StaggerItem key={plan.id} className="h-full">
                <SpotlightCard
                  spotlightColor={
                    plan.highlight
                      ? "rgba(59, 130, 246, 0.25)"
                      : "rgba(148, 163, 184, 0.12)"
                  }
                  className={`h-full rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative ${
                    plan.highlight
                      ? "bg-slate-900/95 border-2 border-blue-500 shadow-2xl shadow-blue-500/15 lg:-translate-y-2 z-20"
                      : isTargetTier
                      ? "bg-slate-900/85 border-2 border-slate-600 shadow-xl"
                      : "bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 shadow-lg"
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-4">
                    {plan.badge ? (
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-blue-400" />
                        {plan.badge}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {plan.id}
                      </span>
                    )}

                    {isTargetTier && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold animate-pulse">
                        Selected Size
                      </span>
                    )}
                  </div>

                  {/* Plan Content */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-xs font-semibold text-blue-400 mb-3 min-h-[32px]">
                      {plan.tagline}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6 min-h-[44px]">
                      {plan.description}
                    </p>

                    {/* Price Block */}
                    <div className="pb-6 mb-6 border-b border-slate-800">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                          ${price.toFixed(0)}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {isYearly ? "/mo (billed yearly)" : "/month"}
                        </span>
                      </div>
                      {isYearly && savings > 0 && (
                        <div className="mt-1.5 text-[11px] font-semibold text-emerald-400">
                          Save ${savings.toFixed(0)} billed annually
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Link
                      href="/login"
                      className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all mb-6 flex items-center justify-center gap-2 group shadow-md ${
                        plan.highlight
                          ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                          : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                      }`}
                    >
                      <span>{plan.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>

                    {/* Feature Highlights */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                        Included Features
                      </span>
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              plan.highlight
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="text-slate-300 font-medium leading-tight">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </SpotlightCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Interactive Full Feature Comparison Expandable Drawer */}
        <ScrollReveal delay={0.2} className="mb-12">
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl backdrop-blur-md">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="w-full px-6 sm:px-8 py-5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Detailed Feature Comparison Matrix
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compare technical allowances, SLAs, and security features across all 4 tiers
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-3.5 py-1.5 rounded-full border border-blue-500/20">
                <span>{showComparison ? "Hide Table" : "View Full Breakdown"}</span>
                {showComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            <AnimatePresence>
              {showComparison && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden border-t border-slate-800"
                >
                  <div className="p-4 sm:p-8 overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="pb-4 font-bold text-slate-300 w-1/3">Feature Capability</th>
                          <th className="pb-4 font-bold text-center">Starter</th>
                          <th className="pb-4 font-bold text-center text-blue-400">Growth</th>
                          <th className="pb-4 font-bold text-center">Pro</th>
                          <th className="pb-4 font-bold text-center">Enterprise</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {featureComparisonMatrix.map((section) => (
                          <React.Fragment key={section.category}>
                            <tr className="bg-slate-950/60">
                              <td
                                colSpan={5}
                                className="py-2.5 px-2 font-bold text-[11px] uppercase tracking-wider text-slate-400"
                              >
                                {section.category}
                              </td>
                            </tr>
                            {section.features.map((item) => (
                              <tr key={item.name} className="hover:bg-slate-800/30 transition-colors">
                                <td className="py-3 px-2 text-slate-300 font-medium">{item.name}</td>
                                <td className="py-3 text-center text-slate-400">
                                  {typeof item.starter === "boolean" ? (
                                    item.starter ? (
                                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                                    ) : (
                                      <span className="text-slate-600">—</span>
                                    )
                                  ) : (
                                    item.starter
                                  )}
                                </td>
                                <td className="py-3 text-center text-blue-300 font-semibold bg-blue-500/[0.04]">
                                  {typeof item.growth === "boolean" ? (
                                    item.growth ? (
                                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                                    ) : (
                                      <span className="text-slate-600">—</span>
                                    )
                                  ) : (
                                    item.growth
                                  )}
                                </td>
                                <td className="py-3 text-center text-slate-300">
                                  {typeof item.pro === "boolean" ? (
                                    item.pro ? (
                                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                                    ) : (
                                      <span className="text-slate-600">—</span>
                                    )
                                  ) : (
                                    item.pro
                                  )}
                                </td>
                                <td className="py-3 text-center text-slate-300 font-medium">
                                  {typeof item.enterprise === "boolean" ? (
                                    item.enterprise ? (
                                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                                    ) : (
                                      <span className="text-slate-600">—</span>
                                    )
                                  ) : (
                                    item.enterprise
                                  )}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollReveal>

        {/* Guarantees Strip */}
        <ScrollReveal delay={0.25} className="mt-8 pt-8 border-t border-slate-800/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-8">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>14-Day Free Evaluation</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
              <Check className="w-4 h-4 text-blue-400" />
              <span>Cancel or Switch Anytime</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Instant Workspace Setup</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>SOC-2 &amp; GDPR Compliant</span>
            </div>
          </div>

          {/* Footnote from Page 14 of content.txt */}
          <p className="text-xs text-slate-500 max-w-3xl mx-auto text-center leading-relaxed">
            Plan availability, feature allowances, integrations, AI usage, and third-party messaging
            charges depend on the selected plan and applicable provider terms.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
