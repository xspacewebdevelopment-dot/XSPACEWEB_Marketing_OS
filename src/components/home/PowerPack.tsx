"use client";

import React, { useState } from "react";
import { Mail, MessageCircle, UserCheck, Clock, Share2, Sparkles, Bot, Check, ArrowRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GradientBadge } from "@/components/ui/GradientBadge";
import { aiMarketingAgents } from "@/data/site-content";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function PowerPack() {
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  const current = aiMarketingAgents[activeAgentIndex];

  const getAgentIcon = (id: string) => {
    switch (id) {
      case "ai-email":
        return <Mail className="w-5 h-5" />;
      case "ai-whatsapp":
        return <MessageCircle className="w-5 h-5" />;
      case "ai-qualification":
        return <UserCheck className="w-5 h-5" />;
      case "ai-followup":
        return <Clock className="w-5 h-5" />;
      case "ai-social":
        return <Share2 className="w-5 h-5" />;
      case "ai-campaign":
        return <Zap className="w-5 h-5" />;
      default:
        return <Bot className="w-5 h-5" />;
    }
  };

  return (
    <section id="ai-agents" className="relative py-28 md:py-36 bg-[#F8FAFC] border-t border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header from SECTION 6 of content.txt */}
        <ScrollReveal className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16 sm:mb-20">
          <div className="max-w-xl text-left">
            <GradientBadge variant="light" icon={<Sparkles className="w-3.5 h-3.5" />} className="mb-4">
              AI THAT WORKS WITH YOUR TEAM
            </GradientBadge>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Meet Your New <br />
              <span className="text-gradient-brand">AI Marketing Team.</span>
            </h2>
          </div>

          <div className="max-w-md text-left lg:text-right">
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Great marketing requires creativity, consistency, and intelligent decisions.
              NexaReach AI Agents assist with content generation, campaign planning, lead
              qualification, and follow-up recommendations—helping teams spend more time on
              strategy and customer relationships.
            </p>
          </div>
        </ScrollReveal>

        {/* 2-Column Interactive Agents Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 6 Interactive Agent Switchers */}
          <ScrollReveal direction="left" className="lg:col-span-5 space-y-3">
            {aiMarketingAgents.map((agent, idx) => {
              const isActive = activeAgentIndex === idx;
              return (
                <div
                  key={agent.id}
                  onClick={() => setActiveAgentIndex(idx)}
                  className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${
                    isActive
                      ? "bg-white border-blue-600 shadow-lg shadow-blue-600/10 translate-x-1"
                      : "bg-white/70 border-slate-200/90 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {getAgentIcon(agent.id)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-tight">
                          {agent.title}
                        </h3>
                        <span className="text-[11px] text-slate-500">{agent.tag}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {agent.metrics}
                    </span>
                  </div>
                </div>
              );
            })}
          </ScrollReveal>

          {/* Right Column: Live Interactive Agent Canvas */}
          <ScrollReveal direction="right" className="lg:col-span-7 sticky top-28">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-3xl bg-white border border-slate-200/90 p-7 sm:p-9 shadow-xl shadow-slate-200/50 text-left"
              >
                {/* Active Agent Banner */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                      {getAgentIcon(current.id)}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">
                        Autonomous Assistant
                      </span>
                      <h3 className="text-xl font-black text-slate-900">
                        {current.title}
                      </h3>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Ready &amp; Active
                  </span>
                </div>

                {/* Agent Description */}
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {current.description}
                </p>

                {/* Core Actions / Capabilities */}
                <div className="mb-6 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Autonomous Actions
                  </span>
                  {current.actions.map((act, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="font-medium">{act}</span>
                    </div>
                  ))}
                </div>

                {/* Simulated Agent Output */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-6">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Simulated Agent Benchmark
                    </span>
                    <span className="text-emerald-600 font-bold">{current.metrics}</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
                    &ldquo;Autonomous {current.title} is trained on omnichannel engagement patterns to suggest immediate optimizations across your customer journey.&rdquo;
                  </p>
                </div>

                {/* CTA Link */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Included in Pro &amp; Enterprise</span>
                  <a
                    href="#pricing"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors group"
                  >
                    <span>Deploy This Agent</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
