"use client";

import React from "react";
import { TrendingUp, Sparkles, Layers, Cpu, Repeat, BarChart3, CheckCircle2 } from "lucide-react";
import { GradientBadge } from "@/components/ui/GradientBadge";

const valueHighlights = [
  {
    icon: Layers,
    title: "One Connected Workspace",
    description:
      "Manage marketing channels, leads, campaigns, and conversations without unnecessary tool switching.",
    color: "#315BFF",
  },
  {
    icon: Cpu,
    title: "Intelligence at Every Step",
    description:
      "Use AI-powered assistance to draft messages, prioritize opportunities, and simplify everyday marketing tasks.",
    color: "#7545FF",
  },
  {
    icon: Repeat,
    title: "Automation That Works for You",
    description:
      "Create connected workflows that handle repetitive tasks while keeping your team in complete control.",
    color: "#FF4566",
  },
  {
    icon: BarChart3,
    title: "Insights That Drive Decisions",
    description:
      "Understand campaign performance, audience engagement, and marketing effectiveness through a unified reporting experience.",
    color: "#10B981",
  },
];

export function ProductOverview() {
  return (
    <section id="overview" className="relative py-24 md:py-32 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header from SECTION 2 of content.txt */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <GradientBadge variant="light" icon={<Sparkles className="w-3.5 h-3.5" />} className="mb-4">
            ONE CONNECTED MARKETING WORKSPACE
          </GradientBadge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
            Stop Managing Tools. <br className="hidden sm:inline" />
            <span className="text-gradient-brand">Start Managing Growth.</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Marketing should not feel like managing ten different dashboards. NexaReach connects the
            tools and workflows behind customer acquisition, communication, and engagement into one
            intelligent platform.
          </p>
        </div>

        {/* 4 Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {valueHighlights.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-xs"
                    style={{ backgroundColor: `${feat.color}12`, color: feat.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Workspace Representation Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1: Live Campaign & Touchpoint Velocity */}
          <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200/90 text-slate-900 p-6 sm:p-8 flex flex-col justify-between shadow-lg shadow-slate-200/50">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-[#315BFF] uppercase tracking-wider block mb-1">
                  Omnichannel Engagement
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Multichannel Campaign Activity
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Channels Synced
              </span>
            </div>

            {/* Mini Interface: Activity Heatmap & Distribution */}
            <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Weekly Touchpoint Velocity (Email + WhatsApp + Social)</span>
                <span className="text-[#315BFF] font-bold">42,850 Messages</span>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {[
                  { day: "Mon", h: "60%" },
                  { day: "Tue", h: "90%" },
                  { day: "Wed", h: "75%" },
                  { day: "Thu", h: "100%" },
                  { day: "Fri", h: "82%" },
                  { day: "Sat", h: "35%" },
                  { day: "Sun", h: "28%" },
                ].map((item, idx) => (
                  <div key={item.day} className="flex flex-col items-center gap-1.5">
                    <div className="w-full h-16 bg-white rounded-lg flex items-end p-1 border border-slate-200/60">
                      <div
                        className={`w-full rounded-md transition-all duration-500 ${
                          idx === 3
                            ? "bg-gradient-to-t from-[#315BFF] to-[#7545FF]"
                            : "bg-[#315BFF]/75"
                        }`}
                        style={{ height: item.h }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">{item.day}</span>
                  </div>
                ))}
              </div>

              {/* Campaign Status Snippet */}
              <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Active Campaign Journey</span>
                  <span className="font-bold text-slate-900 text-sm">Product Onboarding &amp; Re-engagement</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#315BFF] text-xs font-bold border border-blue-200/60">
                    AI Optimized
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">98.2% Deliverability</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Contact Management & Lead Verification */}
          <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200/90 text-slate-900 p-6 sm:p-8 flex flex-col justify-between shadow-lg shadow-slate-200/50">
            <div className="mb-6">
              <span className="text-xs font-bold text-[#7545FF] uppercase tracking-wider block mb-1">
                Data Quality &amp; Intelligence
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                Verified Lead Profiles
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Automated email verification, enrichment data, and real-time buying signals.
              </p>
            </div>

            {/* Mini Contact List with Verification Badges */}
            <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
              {[
                { name: "Sarah Lin", email: "sarah@omnisync.com", status: "Valid", risk: "Low Risk", score: 94 },
                { name: "David K.", email: "david@apexmedia.co", status: "Valid", risk: "Low Risk", score: 89 },
                { name: "Jessica Fox", email: "sales@velocity.io", status: "Role-Based", risk: "Med Risk", score: 72 },
              ].map((contact, i) => (
                <div key={contact.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      i === 0 ? "bg-blue-100 text-[#315BFF]" : i === 1 ? "bg-purple-100 text-[#7545FF]" : "bg-amber-100 text-amber-700"
                    }`}>
                      {contact.name.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-tight">{contact.name}</h4>
                      <p className="text-[10px] text-slate-500">{contact.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                      contact.status === "Valid"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {contact.status}
                    </span>
                    <span className="text-xs font-bold text-[#315BFF]">{contact.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Unified Marketing Reporting */}
          <div className="lg:col-span-12 rounded-3xl bg-white border border-slate-200/90 text-slate-900 p-6 sm:p-8 shadow-lg shadow-slate-200/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                  Unified Reporting Across Channels
                </h3>
                <p className="text-slate-600 text-sm max-w-xl">
                  Track email opens, WhatsApp response times, social engagements, and conversions in one view.
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <span className="text-xs text-slate-500 block">Avg Conversion Lift</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900">+34.8%</span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1 border border-emerald-200">
                  <TrendingUp className="w-3.5 h-3.5" /> Omnichannel ROI
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block mb-1">Email Campaign Open Rate</span>
                <span className="text-2xl font-black text-slate-900 block">46.2%</span>
                <span className="text-[11px] text-emerald-600 font-semibold">+14% vs benchmark</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block mb-1">WhatsApp Response Time</span>
                <span className="text-2xl font-black text-slate-900 block">&lt; 45 sec</span>
                <span className="text-[11px] text-[#315BFF] font-semibold">AI Assistant Enabled</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block mb-1">Clean List Delivery Rate</span>
                <span className="text-2xl font-black text-slate-900 block">99.4%</span>
                <span className="text-[11px] text-[#7545FF] font-semibold">Zero Domain Burn</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
