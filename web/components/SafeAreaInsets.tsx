"use client";

import { useEffect } from "react";

/** Keep the tab bar above the on-screen keyboard via visualViewport. */
export function SafeAreaInsets() {
  useEffect(() => {
    const root = document.documentElement;
    const syncViewportInset = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty("--viewport-bottom-inset", `${Math.round(gap)}px`);
    };

    syncViewportInset();
    window.visualViewport?.addEventListener("resize", syncViewportInset);
    window.visualViewport?.addEventListener("scroll", syncViewportInset);
    window.addEventListener("orientationchange", syncViewportInset);

    return () => {
      window.visualViewport?.removeEventListener("resize", syncViewportInset);
      window.visualViewport?.removeEventListener("scroll", syncViewportInset);
      window.removeEventListener("orientationchange", syncViewportInset);
    };
  }, []);

  return null;
}
