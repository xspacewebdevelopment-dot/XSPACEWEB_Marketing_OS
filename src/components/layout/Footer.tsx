"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Send } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-slate-50 border-t border-slate-200 pt-20 pb-12 overflow-hidden text-left">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-blue-500/[0.03] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Top Newsletter Strip from Page 17 */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-sm mb-16 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
              Newsletter
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
              Stay Ahead of What&apos;s Next.
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Get product updates, marketing insights, and useful automation ideas delivered to your inbox.
            </p>
          </div>

          <div className="w-full lg:max-w-md">
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 mb-2">
              <input
                type="email"
                placeholder="Enter your email address"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
              >
                <span>Subscribe</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <p className="text-[11px] text-slate-500">
              By subscribing, you agree to receive NexaReach updates. You can unsubscribe at any time.
            </p>
          </div>
        </div>

        {/* 5-Column Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-12 pb-16 border-b border-slate-200">
          {/* Brand Info */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-slate-950 text-white shadow-sm group-hover:scale-105 transition-transform">
                <svg
                  className="w-4 h-4 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <g transform="rotate(-35 12 12)">
                    <rect x="5" y="5" width="5.5" height="14" rx="2.75" />
                    <rect x="13.5" y="5" width="5.5" height="14" rx="2.75" />
                  </g>
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                NexaReach
              </span>
            </Link>
            <p className="text-sm font-semibold text-slate-800 mb-1">
              One Platform. Every Channel. Smarter Growth.
            </p>
            <p className="text-xs text-slate-600 max-w-sm mb-6 leading-relaxed">
              AI-powered tools for connected marketing, customer engagement, and intelligent automation.
            </p>

            {/* Operational System Status */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-xs text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-medium">All Systems Operational</span>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li><a href="#deliverability" className="hover:text-slate-900 transition-colors">Email Verification</a></li>
              <li><a href="#features" className="hover:text-slate-900 transition-colors">Email Marketing</a></li>
              <li><a href="#features" className="hover:text-slate-900 transition-colors">WhatsApp Marketing</a></li>
              <li><a href="#features" className="hover:text-slate-900 transition-colors">Social Publishing</a></li>
              <li><a href="#overview" className="hover:text-slate-900 transition-colors">Lead Intelligence</a></li>
              <li><a href="#automation" className="hover:text-slate-900 transition-colors">Visual Automation</a></li>
              <li><a href="#ai-agents" className="hover:text-slate-900 transition-colors">AI Agents</a></li>
              <li><a href="#overview" className="hover:text-slate-900 transition-colors">Unified Inbox</a></li>
              <li><a href="#overview" className="hover:text-slate-900 transition-colors">Analytics</a></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li><a href="#overview" className="hover:text-slate-900 transition-colors">About Us</a></li>
              <li><a href="#features" className="hover:text-slate-900 transition-colors">Solutions</a></li>
              <li><a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing Plans</a></li>
              <li><a href="#faqs" className="hover:text-slate-900 transition-colors">Help Center</a></li>
              <li><a href="#pricing" className="hover:text-slate-900 transition-colors">Contact Sales</a></li>
            </ul>
          </div>

          {/* Resources & Legal Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Resources &amp; Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li><a href="#blog" className="hover:text-slate-900 transition-colors">Growth Blog</a></li>
              <li><a href="#faqs" className="hover:text-slate-900 transition-colors">FAQs</a></li>
              <li><a href="#pricing" className="hover:text-slate-900 transition-colors flex items-center gap-1">API Docs <ArrowUpRight className="w-3 h-3 text-slate-400" /></a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Data Processing Addendum</a></li>
            </ul>
          </div>
        </div>

        {/* Huge Watermark Typographic Branding & Bottom Text */}
        <div className="relative pt-12 pb-6 flex items-center justify-between flex-wrap gap-4 text-xs text-slate-500">
          <p>
            © 2026 NexaReach. All rights reserved. Built for smarter marketing. Designed for meaningful connections.
          </p>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Security</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
        </div>

        {/* Large subtle outline watermark */}
        <div className="text-center select-none pointer-events-none mt-4 overflow-hidden">
          <span className="text-[14vw] font-black leading-none tracking-tighter text-slate-900/[0.04] block uppercase whitespace-nowrap">
            NexaReach
          </span>
        </div>
      </div>
    </footer>
  );
}
