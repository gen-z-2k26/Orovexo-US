import type { CSSProperties } from "react";
import type { StoreSettings } from "@/lib/types";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace("#", "").trim();
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return null;
  }

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
  );
}

function contrastForeground(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? "#0b1220" : "#ffffff";
}

function fontStack(font: string): string {
  const normalized = font.trim().toLowerCase();
  if (normalized.includes("georgia") || normalized.includes("serif")) {
    return '"Georgia", "Times New Roman", serif';
  }
  if (
    normalized.includes("manrope") ||
    normalized.includes("inter") ||
    normalized.includes("sans")
  ) {
    return "var(--font-manrope), ui-sans-serif, system-ui, sans-serif";
  }
  return `"${font}", ui-sans-serif, system-ui, sans-serif`;
}

/** Dark industrial surfaces inspired by technical ecommerce storefronts. */
export function getThemeStyle(settings: StoreSettings): CSSProperties {
  const primary = settings.theme.primary;
  const accent = settings.theme.accent;
  const isEmber = settings.id === "ember";

  const background = isEmber ? "#140e0b" : "#070b14";
  const card = isEmber ? "#1c1511" : "#0e1524";
  const muted = isEmber ? "#241c17" : "#141c2e";
  const border = isEmber ? "rgba(255, 236, 210, 0.12)" : "rgba(186, 214, 255, 0.12)";
  const foreground = isEmber ? "#fff7ed" : "#e8f0ff";
  const mutedForeground = isEmber ? "#c4a484" : "#8fa3c1";

  return {
    ["--background" as string]: background,
    ["--foreground" as string]: foreground,
    ["--card" as string]: card,
    ["--card-foreground" as string]: foreground,
    ["--popover" as string]: card,
    ["--popover-foreground" as string]: foreground,
    ["--primary" as string]: primary,
    ["--primary-foreground" as string]: contrastForeground(primary),
    ["--secondary" as string]: muted,
    ["--secondary-foreground" as string]: foreground,
    ["--muted" as string]: muted,
    ["--muted-foreground" as string]: mutedForeground,
    ["--accent" as string]: accent,
    ["--accent-foreground" as string]: contrastForeground(accent),
    ["--border" as string]: border,
    ["--input" as string]: border,
    ["--ring" as string]: primary,
    ["--store-primary" as string]: primary,
    ["--store-accent" as string]: accent,
    ["--font-sans" as string]: fontStack(settings.theme.font),
    ["--font-heading" as string]: fontStack(settings.theme.font),
    ["--radius" as string]: "1rem",
    fontFamily: fontStack(settings.theme.font),
  };
}
