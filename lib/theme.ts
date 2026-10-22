import type { CSSProperties } from "react";
import type { StoreSettings, ThemePalette } from "@/lib/types";

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

function fontStack(font: string, fallback: string): string {
  const normalized = font.trim().toLowerCase();
  if (normalized.includes("varela")) {
    return "var(--font-varela), ui-sans-serif, system-ui, sans-serif";
  }
  if (normalized.includes("fraunces") || normalized.includes("bricolage")) {
    return "var(--font-display), ui-serif, Georgia, serif";
  }
  if (
    normalized.includes("dm sans") ||
    normalized.includes("jakarta") ||
    normalized.includes("manrope")
  ) {
    return "var(--font-sans), ui-sans-serif, system-ui, sans-serif";
  }
  if (normalized.includes("serif")) {
    return `"${font}", ui-serif, Georgia, serif`;
  }
  return `"${font}", ${fallback}`;
}

function paletteVars(palette: ThemePalette, prefix = ""): Record<string, string> {
  const p = prefix ? `${prefix}-` : "";
  return {
    [`--${p}background`]: palette.background,
    [`--${p}foreground`]: palette.foreground,
    [`--${p}card`]: palette.card,
    [`--${p}card-foreground`]: palette.foreground,
    [`--${p}popover`]: palette.card,
    [`--${p}popover-foreground`]: palette.foreground,
    [`--${p}primary`]: palette.primary,
    [`--${p}primary-foreground`]: contrastForeground(palette.primary),
    [`--${p}secondary`]: palette.muted,
    [`--${p}secondary-foreground`]: palette.foreground,
    [`--${p}muted`]: palette.muted,
    [`--${p}muted-foreground`]: palette.mutedForeground,
    [`--${p}accent`]: palette.accent,
    [`--${p}accent-foreground`]: contrastForeground(palette.accent),
    [`--${p}border`]: palette.border,
    [`--${p}input`]: palette.border,
    [`--${p}ring`]: palette.primary,
  };
}

/**
 * Injects design tokens as CSS variables.
 * Light tokens are injected as --light-* and dark tokens as --dark-*.
 * :root and .dark in globals.css map them to the semantic variables.
 * Design tokens come from Next (data/site.json via getSiteSettings()).
 */
export function getThemeStyle(settings: StoreSettings): CSSProperties {
  const { theme } = settings;
  const light = paletteVars(theme.light, "light");
  const dark = paletteVars(theme.dark, "dark");

  return {
    ...light,
    ...dark,
    ["--radius" as string]: theme.radius,
    ["--font-sans" as string]: fontStack(
      theme.font,
      "ui-sans-serif, system-ui, sans-serif",
    ),
    ["--font-heading" as string]: fontStack(
      theme.fontDisplay,
      "ui-sans-serif, system-ui, sans-serif",
    ),
    ["--store-primary" as string]: theme.light.primary,
    ["--store-accent" as string]: theme.light.accent,
    fontFamily: fontStack(theme.font, "ui-sans-serif, system-ui, sans-serif"),
  };
}
