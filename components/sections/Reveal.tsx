"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useMotionEnabled } from "@/lib/use-motion-enabled";
import { easings, motionByLevel } from "@/lib/motion";

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { enabled, level } = useMotionEnabled();
  const tokens = motionByLevel[level];

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: tokens.distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: tokens.duration,
        delay,
        ease: easings.standard,
      }}
    >
      {children}
    </motion.div>
  );
}
