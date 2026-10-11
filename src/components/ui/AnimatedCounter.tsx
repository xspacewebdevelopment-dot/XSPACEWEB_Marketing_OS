"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 1800,
  decimals = 0,
}: AnimatedCounterProps) {
  const [currentValue, setCurrentValue] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Start count animation
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          setCurrentValue(0);
          const startTime = performance.now();

          const updateCounter = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            // Ease out cubic
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const val = easeOutProgress * value;

            setCurrentValue(val);

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              setCurrentValue(value);
            }
          };

          requestAnimationFrame(updateCounter);
        }
      },
      { threshold: 0.05, rootMargin: "100px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, duration]);

  const formattedNumber =
    decimals > 0
      ? currentValue.toFixed(decimals)
      : Math.round(currentValue).toString();

  return (
    <span ref={ref} className="tabular-nums font-bold">
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
}
