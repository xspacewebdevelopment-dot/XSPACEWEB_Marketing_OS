"use client";

import React from "react";
import { motion, useScroll, useSpring } from "motion/react";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="fixed top-0 left-0 right-0 h-[2.5px] z-[100] pointer-events-none bg-transparent">
      <motion.div
        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 origin-left shadow-[0_0_8px_rgba(37,99,235,0.6)]"
        style={{ scaleX }}
      />
    </div>
  );
}
