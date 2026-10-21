"use client";

import type { MouseEvent } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeMode } from "@/lib/theme-mode";

export function ThemeToggle() {
  const { resolved, toggle } = useThemeMode();
  const isDark = resolved === "dark";

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;
    toggle({ x, y });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      data-theme-toggle="true"
      className="size-10 rounded-2xl"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={handleClick}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
