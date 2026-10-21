"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useMotionEnabled } from "@/lib/use-motion-enabled";
import { easings, motionByLevel } from "@/lib/motion";

export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "article";
}) {
  const { enabled, level } = useMotionEnabled();
  const tokens = motionByLevel[level];
  const MotionTag = motion[as];

  if (!enabled) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: tokens.distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: tokens.duration,
        delay,
        ease: easings.standard,
      }}
    >
      {children}
    </MotionTag>
  );
}

export function RevealImage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { enabled, level } = useMotionEnabled();
  const tokens = motionByLevel[level];

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 1.04 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: tokens.duration * 1.15, ease: easings.soft }}
    >
      {children}
    </motion.div>
  );
}
