"use client";

import { useEffect } from "react";
import { usePreferences } from "../lib/hooks/usePreferences";

const LIGHT_CHROME = "#efe6d8";
const DARK_CHROME = "#14110e";

function isDark(theme: "system" | "light" | "dark"): boolean {
  return (
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}

function applyTheme(theme: "system" | "light" | "dark") {
  const dark = isDark(theme);
  document.documentElement.classList.toggle("dark", dark);
  const color = dark ? DARK_CHROME : LIGHT_CHROME;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", color);
}

export function ThemeSync() {
  const { theme } = usePreferences();

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return null;
}
