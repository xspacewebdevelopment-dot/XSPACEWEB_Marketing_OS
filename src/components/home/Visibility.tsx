"use client";

import React from "react";
import { Check, Sparkles, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { GradientBadge } from "@/components/ui/GradientBadge";
import { deliverabilityChecks } from "@/data/site-content";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function Visibility() {
  const benefits = [
    "Identify invalid addresses, risky domains, disposable inboxes, and role-based contacts",
    "Monitor technical authentication: SPF, DKIM, DMARC, and 84 RBL blacklist servers",
    "Preserve primary inbox placement with automated bounce-prevention safeguards",
  ];

  return (
    <section id="deliverability" className="relative py-28 md:py-36 bg-[#FFFFFF] border-t border-slate-200/80 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column */}
          <ScrollReveal direction="left" className="lg:col-span-5 text-left">
            <GradientBadge variant="light" icon={<Sparkles className="w-3.5 h-3.5" />} className="mb-4">
              BUILT FOR RESPONSIBLE SENDING
            </GradientBadge>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-6">
              Cleaner Lists. <br />
              <span className="text-gradient-brand">Healthier Campaigns.</span>
            </h2>

            <p className="text-slate-600 text-base leading-relaxed mb-8">
              Poor-quality email data can increase bounces, waste resources, and damage sending reputation.
              NexaReach helps you assess email quality and sending infrastructure before launching campaigns,
              giving teams the visibility needed to build sustainable outreach programs.
            </p>

            {/* Checklist */}
            <div className="space-y-3 border-t border-slate-200 pt-4 mb-8">
              {benefits.map((benefit, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3.5 py-2.5 border-b border-slate-100 last:border-b-0"
                >
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold bg-[#0F172A] text-white hover:bg-slate-800 transition-all shadow-md group"
              >
                <span>Verify Your Emails</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </ScrollReveal>

          {/* Right Column: Layered Media Composition */}
          <ScrollReveal direction="right" className="lg:col-span-7 relative">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
              {/* Left Stack: Verification Table */}
              <div className="sm:col-span-7 rounded-3xl bg-slate-50/80 border border-slate-200 p-6 shadow-md text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                        CSV Batch Verification
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">
                        Real-time Mailbox Risk Scoring
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      99.4% Accurate
                    </span>
                  </div>

                  {/* Verification Rows */}
                  <div className="space-y-2 text-xs">
                    {[
                      { email: "alex.turner@invarion.com", status: "Valid", risk: "Low Risk", type: "success" },
                      { email: "team@lucident-cloud.io", status: "Role-Based", risk: "Medium Risk", type: "warning" },
                      { email: "contact@prospectflow.net", status: "Catch-All", risk: "Medium Risk", type: "warning" },
                      { email: "david92@fakeinbox-temp.com", status: "Disposable", risk: "High Risk", type: "danger" },
                      { email: "no-reply-invalid@expired.biz", status: "Invalid", risk: "High Risk", type: "danger" },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-xs"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-slate-900 block truncate text-[11px]">
                            {row.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 ${
                              row.type === "success"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : row.type === "warning"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {row.type === "success" && <CheckCircle2 className="w-2.5 h-2.5" />}
                            {row.type === "warning" && <AlertTriangle className="w-2.5 h-2.5" />}
                            {row.type === "danger" && <XCircle className="w-2.5 h-2.5" />}
                            {row.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Syntax · MX · SMTP · Disposable · Catch-All</span>
                  <span className="font-bold text-slate-800">CSV Export Ready</span>
                </div>
              </div>

              {/* Right Stack: Deliverability & Health Indicators */}
              <div className="sm:col-span-5 flex flex-col gap-4">
                <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-md text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <h5 className="font-bold text-xs text-slate-900">Infrastructure Health</h5>
                  </div>
                  <div className="space-y-2">
                    {deliverabilityChecks.slice(0, 4).map((chk) => (
                      <div key={chk.name} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 last:border-b-0">
                        <span className="text-slate-600 font-medium">{chk.name}</span>
                        <span className="font-bold text-emerald-600">{chk.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Refined Obsidian Reputation Card */}
                <div className="rounded-3xl bg-slate-950 border border-slate-800 text-white p-5 shadow-lg text-left">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                    Reputation Score
                  </span>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-black text-white">98.8</span>
                    <span className="text-xs text-emerald-400 font-semibold">/ 100 Safe Tier</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Zero domain blacklist listings. Bounce rates maintained below 0.6% across all connected sending domains.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
