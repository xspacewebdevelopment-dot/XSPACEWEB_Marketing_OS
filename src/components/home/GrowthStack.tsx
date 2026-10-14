"use client";

import React, { useState } from "react";
import { GitBranch, Zap, Mail, MessageCircle, CheckCircle2, Sparkles, ArrowRight, UserPlus, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GradientBadge } from "@/components/ui/GradientBadge";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function GrowthStack() {
  const [activeWorkflow, setActiveWorkflow] = useState<"lead-nurture" | "whatsapp-recovery" | "omnichannel">("lead-nurture");

  return (
    <section id="automation" className="relative py-28 md:py-36 bg-[#FFFFFF] border-t border-slate-200/80 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Eyebrow Badge from SECTION 7 of content.txt */}
        <ScrollReveal>
          <GradientBadge variant="light" icon={<GitBranch className="w-3.5 h-3.5 text-blue-600" />} className="mb-4">
            CONNECT EVERY STEP
          </GradientBadge>

          {/* Heading */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            If You Can Map It, <br className="hidden sm:inline" />
            <span className="text-gradient-brand">You Can Automate It.</span>
          </h2>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-slate-600 text-base sm:text-lg leading-relaxed mb-10">
            Create powerful marketing journeys through a visual automation builder that connects
            customer events, campaign conditions, communication channels, and AI actions.
          </p>

          {/* 3 Interactive Workflow Presets */}
          <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 mb-12 shadow-xs">
            <button
              onClick={() => setActiveWorkflow("lead-nurture")}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeWorkflow === "lead-nurture"
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Lead Onboarding &amp; Verification</span>
            </button>

            <button
              onClick={() => setActiveWorkflow("whatsapp-recovery")}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeWorkflow === "whatsapp-recovery"
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Re-engagement</span>
            </button>

            <button
              onClick={() => setActiveWorkflow("omnichannel")}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeWorkflow === "omnichannel"
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Omnichannel Product Launch</span>
            </button>
          </div>
        </ScrollReveal>

        {/* Visual Workflow Canvas Mockup Container */}
        <ScrollReveal delay={0.15}>
          <div className="relative rounded-3xl bg-slate-50/70 border border-slate-200/90 p-6 sm:p-10 shadow-xl shadow-slate-200/40 text-left overflow-hidden">
            {/* Top Bar with Live Simulation Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 mb-8">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    {activeWorkflow === "lead-nurture" && "Standard Verified Lead Journey"}
                    {activeWorkflow === "whatsapp-recovery" && "Automated WhatsApp Retention Journey"}
                    {activeWorkflow === "omnichannel" && "Multichannel Launch Orchestration"}
                  </h4>
                  <p className="text-[11px] text-slate-500">Live trigger: Opt-in API &amp; Webhook listener</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs">
                  Execution Rate: 99.8%
                </span>
                <span className="text-xs font-bold text-blue-600">Active (Runs 24/7)</span>
              </div>
            </div>

            {/* Interactive Flow Nodes */}
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Step 1: Trigger Node */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-500/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Trigger</span>
                    <span className="text-[10px] font-semibold text-slate-500">Instant</span>
                  </div>
                  <h5 className="font-bold text-sm text-slate-900">New Consented Lead Added</h5>
                  <p className="text-xs text-slate-600">Captures inbound contact with verified opt-in permission.</p>
                </div>
              </motion.div>

              {/* Connecting Vertical Line */}
              <div className="flex justify-center -my-1">
                <div className="w-0.5 h-6 bg-slate-300" />
              </div>

              {/* Step 2: Verification Node */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-500/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Verification Action</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Pass: Low Risk</span>
                  </div>
                  <h5 className="font-bold text-sm text-slate-900">Automated Email Verification</h5>
                  <p className="text-xs text-slate-600">Syntax, MX, domain, disposable &amp; catch-all analysis completed in 180ms.</p>
                </div>
              </motion.div>

              {/* Connecting Vertical Line */}
              <div className="flex justify-center -my-1">
                <div className="w-0.5 h-6 bg-slate-300" />
              </div>

              {/* Step 3: Multichannel Dispatch */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-500/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Outreach &amp; Engagement</span>
                    <span className="text-[10px] font-semibold text-slate-500">Wait: 2 Days</span>
                  </div>
                  <h5 className="font-bold text-sm text-slate-900">Send Personalized Welcome Sequence</h5>
                  <p className="text-xs text-slate-600">AI personalized draft delivered to primary inbox with tracking telemetry.</p>
                </div>
              </motion.div>

              {/* Connecting Vertical Line */}
              <div className="flex justify-center -my-1">
                <div className="w-0.5 h-6 bg-slate-300" />
              </div>

              {/* Step 4: Conditional Routing & AI Action */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Conditional Decision</span>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">AI Evaluated</span>
                  </div>
                  <h5 className="font-bold text-sm text-slate-900">Engagement Check &amp; Sales Route</h5>
                  <p className="text-xs text-slate-600">High engagement routes to sales inbox; unopened routes to WhatsApp follow-up.</p>
                </div>
              </motion.div>
            </div>

            {/* Bottom Capabilities Strip */}
            <div className="mt-10 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Conditional branching
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Scheduled delay actions
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> AI-assisted decisions
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Full audit history
              </span>

              <a
                href="#pricing"
                className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <span>Discover Visual Automation</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
