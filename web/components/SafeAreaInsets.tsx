"use client";

import { useEffect } from "react";

/** Keep the tab bar above the on-screen keyboard via visualViewport. */
export function SafeAreaInsets() {
  useEffect(() => {
    const root = document.documentElement;
    const syncViewportInset = () => {
      if (root.classList.contains("add-modal-open")) {
        root.style.setProperty("--viewport-bottom-inset", "0px");
        return;
      }
      const vv = window.visualViewport;
      if (!vv) return;
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty("--viewport-bottom-inset", `${Math.round(gap)}px`);
    };

    const scrollFocusedField = (event: FocusEvent) => {
      const el = event.target;
      if (!(el instanceof HTMLElement)) return;
      if (!el.matches("input, textarea, select")) return;
      window.setTimeout(() => {
        el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      }, 350);
    };

    syncViewportInset();
    window.visualViewport?.addEventListener("resize", syncViewportInset);
    window.visualViewport?.addEventListener("scroll", syncViewportInset);
    window.addEventListener("orientationchange", syncViewportInset);
    document.addEventListener("focusin", scrollFocusedField);

    return () => {
      window.visualViewport?.removeEventListener("resize", syncViewportInset);
      window.visualViewport?.removeEventListener("scroll", syncViewportInset);
      window.removeEventListener("orientationchange", syncViewportInset);
      document.removeEventListener("focusin", scrollFocusedField);
    };
  }, []);

  return null;
}
