import type { ReactNode } from "react";
import { Reveal } from "@/components/sections/Reveal";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  titleId,
  align = "left",
  className,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  titleId?: string;
  align?: "left" | "center";
  className?: string;
  action?: ReactNode;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        action && "sm:flex-row sm:items-end sm:justify-between sm:text-left",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-2xl space-y-3",
          align === "center" && "mx-auto",
          action && "sm:mx-0 sm:text-left",
        )}
      >
        {eyebrow ? (
          <p className="text-base tracking-wide text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={titleId}
          className="font-display text-balance text-3xl leading-tight tracking-tight sm:text-4xl"
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </Reveal>
  );
}
