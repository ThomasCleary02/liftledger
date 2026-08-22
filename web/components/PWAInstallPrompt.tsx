"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      window.setTimeout(() => {
        if (sessionStorage.getItem("pwa-prompt-dismissed")) return;
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
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
    // Don't show again for this session
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  // Don't show if dismissed in this session
  useEffect(() => {
    if (sessionStorage.getItem("pwa-prompt-dismissed")) {
      setShowPrompt(false);
    }
  }, []);

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed-above-nav fixed left-4 z-50 max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-brand p-2">
          <Download className="h-5 w-5 text-brand-fg" />
        </div>
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-gray-900">Install LiftLedger</h3>
          <p className="mb-3 text-sm text-gray-600">
            Add LiftLedger to your home screen for quicker access.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
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
