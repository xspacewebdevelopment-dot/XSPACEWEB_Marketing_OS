"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { navItems } from "@/data/site-content";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 sm:px-6 pt-3 sm:pt-4 pointer-events-none">
      <nav
        className={cn(
          "pointer-events-auto w-full max-w-6xl flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all duration-300",
          scrolled
            ? "bg-white/95 border border-slate-200/90 backdrop-blur-2xl shadow-[0_10px_35px_-5px_rgba(0,0,0,0.08)]"
            : "bg-white/85 border border-slate-200/70 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
        )}
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
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
          <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
            NexaReach
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block animate-pulse" />
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100/80 px-2 py-1 rounded-full border border-slate-200/60 shadow-inner">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-white rounded-full transition-all duration-150"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Action Button & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#pricing"
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-xs font-semibold bg-slate-950 text-white hover:bg-slate-800 transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-[0.98] group"
          >
            <span>Get Started</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto fixed inset-x-4 top-20 p-5 rounded-2xl bg-white/95 border border-slate-200/90 backdrop-blur-2xl shadow-2xl flex flex-col gap-3 md:hidden animate-in fade-in slide-in-from-top-4 duration-200 z-50">
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-between"
              >
                <span>{item.label}</span>
                <span className="text-slate-400 text-xs">→</span>
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-200">
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold bg-slate-950 hover:bg-slate-800 text-white shadow-md transition-colors"
            >
              <span>Get Started</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
