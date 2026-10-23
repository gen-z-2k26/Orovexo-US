"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ColorMode } from "@/lib/types";
import { THEME_STORAGE_KEY } from "@/lib/theme-script";

type ResolvedMode = "light" | "dark";

type ThemeTransitionCoords = {
  x: number;
  y: number;
};

type ThemeModeContextValue = {
  mode: ColorMode;
  resolved: ResolvedMode;
  setMode: (mode: ColorMode, coords?: ThemeTransitionCoords) => void;
  toggle: (coords?: ThemeTransitionCoords) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

function getSystemMode(): ResolvedMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveMode(mode: ColorMode): ResolvedMode {
  return mode === "system" ? getSystemMode() : mode;
}

function applyResolved(resolved: ResolvedMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

function revealRadius(x: number, y: number) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  return (
    Math.max(
      Math.hypot(x, y),
      Math.hypot(width - x, y),
      Math.hypot(x, height - y),
      Math.hypot(width - x, height - y),
    ) + 32
  );
}

function canUseViewTransition(): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return false;
  }
  if (!("startViewTransition" in document)) return false;
  if (document.documentElement.dataset.motion === "none") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ThemeModeProvider({
  defaultMode = "system",
  children,
}: {
  defaultMode?: ColorMode;
  children: ReactNode;
}) {
  const [mode, setModeState] = useState<ColorMode>(defaultMode);
  const [resolved, setResolved] = useState<ResolvedMode>("light");
  const hydratedRef = useRef(false);
  const transitioningRef = useRef(false);

  useEffect(() => {
    let activeMode = mode;
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      const stored = window.localStorage.getItem(
        THEME_STORAGE_KEY,
      ) as ColorMode | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        activeMode = stored;
        if (stored !== mode) {
          setModeState(stored);
        }
      }
    }

    const next = resolveMode(activeMode);
    if (transitioningRef.current) {
      return;
    }
    setResolved(next);
    applyResolved(next);

    if (activeMode !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const system = getSystemMode();
      setResolved(system);
      applyResolved(system);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = useCallback(
    (next: ColorMode, coords?: ThemeTransitionCoords) => {
      const nextResolved = resolveMode(next);
      window.localStorage.setItem(THEME_STORAGE_KEY, next);

      if (!canUseViewTransition() || nextResolved === resolved) {
        setModeState(next);
        setResolved(nextResolved);
        applyResolved(nextResolved);
        return;
      }

      const root = document.documentElement;
      transitioningRef.current = true;
      if (coords) {
        root.style.setProperty("--vt-x", `${coords.x}px`);
        root.style.setProperty("--vt-y", `${coords.y}px`);
        root.style.setProperty("--vt-r", `${revealRadius(coords.x, coords.y)}px`);
        root.dataset.themeTransition = "circle";
      } else {
        root.dataset.themeTransition = "fade";
      }

      const transition = document.startViewTransition(() => {
        applyResolved(nextResolved);
      });
      setModeState(next);
      setResolved(nextResolved);

      transition.finished.finally(() => {
        transitioningRef.current = false;
        delete root.dataset.themeTransition;
        root.style.removeProperty("--vt-x");
        root.style.removeProperty("--vt-y");
        root.style.removeProperty("--vt-r");
      });
    },
    [resolved],
  );

  const toggle = useCallback(
    (coords?: ThemeTransitionCoords) => {
      setMode(resolved === "dark" ? "light" : "dark", coords);
    },
    [resolved, setMode],
  );

  const value = useMemo(
    () => ({ mode, resolved, setMode, toggle }),
    [mode, resolved, setMode, toggle],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeModeProvider.");
  }
  return context;
}
