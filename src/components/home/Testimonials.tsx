"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { testimonialsData } from "@/data/site-content";

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonialsData.length - 1 : prev - 1));
  };

  const next = () => {
    setCurrentIndex((prev) => (prev === testimonialsData.length - 1 ? 0 : prev + 1));
  };

  const current = testimonialsData[currentIndex];

  return (
    <section className="relative py-28 md:py-36 bg-[#F8FAFC] border-t border-slate-200/80 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Trustpilot Score Badge (Matching Qarin reference) */}
        <div className="inline-flex flex-col items-center gap-1.5 mb-6">
          <div className="flex items-center gap-1 text-emerald-500">
            <span className="text-xs font-bold text-slate-900 mr-1.5">Excellent</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-4 h-4 bg-emerald-500 rounded-sm flex items-center justify-center text-white">
                <Star className="w-2.5 h-2.5 fill-white stroke-none" />
              </div>
            ))}
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Trustpilot Score 4.9 | 32,758 verified reviews
          </span>
        </div>

        {/* Section Heading */}
        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-14 leading-tight">
          Trusted by <span className="text-gradient-brand">ambitious revenue teams.</span>
        </h2>

        {/* Testimonial Presentation Card */}
        <div className="relative rounded-3xl bg-white border border-slate-200 p-8 sm:p-12 shadow-xl shadow-slate-200/60 text-left">
          {/* Subtle ambient card glow */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#315BFF]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left: Customer Portrait & Metric */}
            <div className="md:col-span-4 flex flex-col items-center text-center">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md mb-4">
                <Image
                  src={current.avatar}
                  alt={current.author}
                  fill
                  sizes="(max-width: 768px) 120px, 150px"
                  className="object-cover"
                />
              </div>

              <span className="px-3 py-1 rounded-full bg-[#315BFF]/10 border border-[#315BFF]/30 text-[#315BFF] text-xs font-bold mb-1">
                {current.metric}
              </span>
            </div>

            {/* Right: Quote, Author & Nav */}
            <div className="md:col-span-8 flex flex-col justify-between">
              <div className="mb-6">
                <Quote className="w-8 h-8 text-[#7545FF]/30 mb-3" />
                <p className="text-base sm:xl text-slate-900 leading-relaxed font-medium">
                  &ldquo;{current.quote}&rdquo;
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
                    {current.author}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {current.role} · <span className="text-slate-700 font-medium">{current.company}</span>
                  </p>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={prev}
                    aria-label="Previous testimonial"
                    className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={next}
                    aria-label="Next testimonial"
                    className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {testimonialsData.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                currentIndex === i ? "w-8 bg-[#315BFF]" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
