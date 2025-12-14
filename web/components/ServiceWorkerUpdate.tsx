"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "../lib/toast";

export function ServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;

    // Check for service worker updates
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // Listen for updates
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New service worker available
            setUpdateAvailable(true);
            toast.info("Update available! Click to refresh.", {
              duration: 10000,
              action: {
                label: "Refresh",
                onClick: () => handleUpdate(),
              },
            });
          }
        });
      });

      // Check for updates periodically
      setInterval(() => {
        reg.update();
      }, 60000); // Check every minute
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
    <div className="fixed top-4 right-4 z-50 rounded-lg border border-blue-200 bg-blue-50 p-3 shadow-lg">
      <div className="flex items-center gap-3">
        <RefreshCw className="h-5 w-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">Update Available</p>
          <p className="text-xs text-blue-700">New features are ready!</p>
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
