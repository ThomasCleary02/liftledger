"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export function ServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;

    // Check for service worker updates
    if (!navigator.serviceWorker.controller) {
      return;
    }

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    });

    // Handle controller change (update applied)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    const handleUpdate = () => {
      if (!registration?.waiting) return;
      
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      setUpdateAvailable(false);
    };

    (window as any).__handleServiceWorkerUpdate = handleUpdate;
  }, []);

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed-below-status fixed right-4 z-50 rounded-lg border border-blue-200 bg-blue-50 p-3 shadow-lg">
      <div className="flex items-center gap-3">
        <RefreshCw className="h-5 w-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">Update Available</p>
          <p className="text-xs text-blue-700">Reload to use the latest version.</p>
        </div>
        <button
          onClick={() => {
            if (registration?.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
              setUpdateAvailable(false);
            }
          }}
          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          Update
        </button>
      </div>
    </div>
  );
}
