"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "admin_theme";
const THEME_EVENT = "admin-theme-updated";

function readCookieTheme(): "dark" | "light" | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)admin_theme=(dark|light)(?:;|$)/);
  return match?.[1] === "dark" || match?.[1] === "light" ? match[1] : null;
}

function readTheme(fallback = false): boolean {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored === "dark";
  const cookieTheme = readCookieTheme();
  if (cookieTheme) return cookieTheme === "dark";
  return fallback;
}

function persistTheme(nextDark: boolean) {
  if (typeof window === "undefined") return;
  const value = nextDark ? "dark" : "light";
  window.localStorage.setItem(THEME_KEY, value);
  document.cookie = `admin_theme=${value}; path=/; max-age=31536000; samesite=lax`;
}

export function useAdminTheme(initialThemeDark = false) {
  const [isDark, setIsDark] = useState<boolean>(() => readTheme(initialThemeDark));

  useEffect(() => {
    const resolved = readTheme(initialThemeDark);
    setIsDark(resolved);
    persistTheme(resolved);
  }, [initialThemeDark]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === THEME_KEY) {
        setIsDark(readTheme(initialThemeDark));
      }
    }

    function handleThemeUpdated() {
      setIsDark(readTheme(initialThemeDark));
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(THEME_EVENT, handleThemeUpdated);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(THEME_EVENT, handleThemeUpdated);
    };
  }, [initialThemeDark]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    persistTheme(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return { isDark, toggleTheme };
}
