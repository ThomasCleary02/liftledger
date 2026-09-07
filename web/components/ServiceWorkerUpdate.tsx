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
    // Local next/emulator sessions: a SW makes restarts look like "no internet".
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => void reg.unregister());
      });
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
    <div className="fixed-below-status fixed right-4 z-50 rounded-md border border-gray-200 bg-white p-3 shadow-[0_1px_0_rgb(20_83_45/0.14)]">
      <div className="flex items-center gap-3">
        <RefreshCw className="h-5 w-5 text-brand" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Update available</p>
          <p className="text-sm text-gray-500">Reload for the latest version.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
            setUpdateAvailable(false);
          }}
          className="btn-primary min-h-[44px] px-3 py-2 text-sm"
        >
          Update
        </button>
      </div>
    </div>
  );
}
