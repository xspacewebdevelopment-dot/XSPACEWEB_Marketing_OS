"use client";

import React, { useRef, useState, useEffect } from "react";
import { useScroll, useTransform, motion, type MotionValue } from "motion/react";

interface ContainerScrollProps {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
}

export function ContainerScroll({
  titleComponent,
  children,
}: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const rotate = useTransform(scrollYProgress, [0, 0.6], [16, 0]);
  const scale = useTransform(
    scrollYProgress,
    [0, 0.6],
    isMobile ? [0.85, 1] : [0.92, 1]
  );
  const translateY = useTransform(scrollYProgress, [0, 0.6], [40, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.25], [0.5, 1]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center p-2 sm:p-4 md:p-8"
      style={{
        perspective: "1200px",
      }}
    >
      <div className="w-full max-w-5xl mx-auto text-center mb-8">
        {titleComponent}
      </div>

      <motion.div
        style={{
          rotateX: rotate,
          scale,
          y: translateY,
          opacity,
          boxShadow:
            "0 20px 50px -10px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(15, 23, 42, 0.08)",
        }}
        className="w-full max-w-5xl mx-auto rounded-3xl sm:rounded-[36px] bg-slate-900/90 p-2 sm:p-4 border border-slate-700/60 shadow-2xl backdrop-blur-xl"
      >
        <div className="w-full overflow-hidden rounded-2xl sm:rounded-[28px] bg-slate-950 border border-slate-800">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
