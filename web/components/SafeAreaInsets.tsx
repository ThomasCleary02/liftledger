"use client";

import { useEffect } from "react";

function isIOS() {
  const ua = window.navigator.userAgent;
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

function isStandalone() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

/**
 * iOS 26 standalone PWAs often report env(safe-area-inset-*) as 0 and draw
 * Liquid Glass chrome over fixed UI. Floors plus visualViewport keep the
 * tab bar and toasts above that chrome.
 */
export function SafeAreaInsets() {
  useEffect(() => {
    const iosStandalone = isIOS() && isStandalone();
    if (!iosStandalone) return;

    const root = document.documentElement;
    root.classList.add("ios-standalone");
    root.style.setProperty("--safe-area-top-floor", "47px");
    root.style.setProperty("--safe-area-bottom-floor", "34px");

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
