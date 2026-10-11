"use client";

import React, { useState } from "react";
import { Mail, MessageCircle, UserCheck, Clock, Share2, Sparkles, Bot, Check, ArrowRight, Zap } from "lucide-react";
import { GradientBadge } from "@/components/ui/GradientBadge";
import { aiMarketingAgents } from "@/data/site-content";

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
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16 sm:mb-20">
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
        </div>

        {/* 2-Column Interactive Agents Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 6 Interactive Agent Switchers */}
          <div className="lg:col-span-5 space-y-3">
            {aiMarketingAgents.map((agent, idx) => {
              const isActive = activeAgentIndex === idx;
              return (
                <div
                  key={agent.id}
                  onClick={() => setActiveAgentIndex(idx)}
                  className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${
                    isActive
                      ? "bg-white border-[#315BFF] shadow-lg shadow-blue-500/10 translate-x-1"
                      : "bg-white/70 border-slate-200/90 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? "bg-gradient-to-tr from-[#315BFF] to-[#7545FF] text-white shadow-md shadow-[#315BFF]/30"
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
                          ? "bg-blue-50 text-[#315BFF] border border-blue-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {agent.metrics}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Interactive Agent Canvas */}
          <div className="lg:col-span-7 sticky top-28">
            <div className="rounded-3xl bg-white border border-slate-200/90 p-7 sm:p-9 shadow-xl shadow-slate-200/50 text-left">
              {/* Active Agent Banner */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#315BFF] to-[#7545FF] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                    {getAgentIcon(current.id)}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#315BFF] block">
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
              <p className="text-sm text-slate-700 leading-relaxed mb-6">
                {current.description}
              </p>

              {/* Live Assistant Prompt/Output Demonstration */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 mb-6 space-y-3.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Assistant Trigger: Multi-step Marketing Flow</span>
                  <span className="text-[#7545FF]">AI Engine: Model v4.2</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-[#315BFF]" /> Suggested Output Preview
                  </div>
                  <p className="italic text-slate-700">
                    &ldquo;Hi {`{{first_name}}`}, saw that your team at {`{{company}}`} is expanding
                    multichannel outreach. Here is a custom template tailored for your industry...&rdquo;
                  </p>
                </div>

                {/* Agent Action Tags */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  {current.actions.map((act, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      {act}
                    </span>
                  ))}
                </div>
              </div>

              {/* Explore AI Agents Button */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Included in Growth and Pro plans
                </span>
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold bg-[#0F172A] text-white hover:bg-slate-800 transition-all shadow-md group"
                >
                  <span>Explore AI Agents</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
