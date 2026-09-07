"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || sessionStorage.getItem("pwa-prompt-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      window.setTimeout(() => {
        if (sessionStorage.getItem("pwa-prompt-dismissed")) return;
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    let iosTimer: number | undefined;
    if (isIosSafari()) {
      iosTimer = window.setTimeout(() => {
        if (sessionStorage.getItem("pwa-prompt-dismissed")) return;
        setIosHint(true);
        setShowPrompt(true);
      }, 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!showPrompt || (!deferredPrompt && !iosHint)) return null;

  return (
    <div className="fixed-above-nav fixed left-4 z-50 max-w-sm rounded-md border border-gray-200 bg-white p-4 shadow-[0_1px_0_rgb(20_83_45/0.14)]">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-brand p-2">
          <Download className="h-5 w-5 text-brand-fg" />
        </div>
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-gray-900">Install LiftLedger</h3>
          <p className="mb-3 text-sm text-gray-600">
            {iosHint && !deferredPrompt
              ? "On iPhone: Share, then Add to Home Screen. Opens as its own app."
              : "Add it to your home screen for quicker logging."}
          </p>
          <div className="flex gap-2">
            {deferredPrompt && (
              <button type="button" onClick={() => void handleInstall()} className="btn-primary flex-1 min-h-[44px]">
                Install
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-700"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
