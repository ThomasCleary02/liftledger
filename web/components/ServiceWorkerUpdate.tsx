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
    let cancelled = false;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (cancelled) return;
        setRegistration(reg);

        if (reg.waiting && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
        }

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      })
      .catch(() => undefined);

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
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
          type="button"
          onClick={() => {
            registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
            setUpdateAvailable(false);
          }}
          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          Update
        </button>
      </div>
    </div>
  );
}
