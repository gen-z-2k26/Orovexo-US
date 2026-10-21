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
import { flushSync } from "react-dom";
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
      if (coords) {
        const endRadius = Math.hypot(
          Math.max(coords.x, window.innerWidth - coords.x),
          Math.max(coords.y, window.innerHeight - coords.y),
        );
        root.style.setProperty("--vt-x", `${coords.x}px`);
        root.style.setProperty("--vt-y", `${coords.y}px`);
        root.style.setProperty("--vt-r", `${endRadius}px`);
        root.dataset.themeTransition = "circle";
      } else {
        root.dataset.themeTransition = "fade";
      }

      const transition = document.startViewTransition(() => {
        flushSync(() => {
          setModeState(next);
          setResolved(nextResolved);
          applyResolved(nextResolved);
        });
      });

      transition.finished.finally(() => {
        delete root.dataset.themeTransition;
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
