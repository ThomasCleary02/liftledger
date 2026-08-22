"use client";

import { useEffect, useRef, useState } from "react";
import { CloudOff, Loader2, CheckCircle2 } from "lucide-react";

type SyncStatus = "hidden" | "syncing" | "synced" | "offline";

export function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>(
    typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "hidden"
  );
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  const clearTimers = () => {
    if (showTimer.current != null) {
      window.clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    if (hideTimer.current != null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  useEffect(() => {
    const handleOnline = () => setStatus("hidden");
    const handleOffline = () => {
      clearTimers();
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (!navigator.onLine) setStatus("offline");

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearTimers();
    };
  }, []);

  const showSyncing = (syncing: boolean) => {
    if (!navigator.onLine) {
      clearTimers();
      setStatus("offline");
      return;
    }

    if (syncing) {
      if (hideTimer.current != null) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      if (showTimer.current != null) return;
      showTimer.current = window.setTimeout(() => {
        showTimer.current = null;
        setStatus("syncing");
        hideTimer.current = window.setTimeout(() => {
          hideTimer.current = null;
          setStatus("hidden");
        }, 2500);
      }, 300);
      return;
    }

    if (showTimer.current != null) {
      window.clearTimeout(showTimer.current);
      showTimer.current = null;
      setStatus("hidden");
      return;
    }

    setStatus((current) => (current === "offline" ? "offline" : "synced"));
    if (hideTimer.current != null) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = null;
      setStatus("hidden");
    }, 900);
  };

  useEffect(() => {
    (window as unknown as { __setSyncStatus?: (syncing: boolean) => void }).__setSyncStatus =
      showSyncing;
    return () => {
      delete (window as unknown as { __setSyncStatus?: (syncing: boolean) => void }).__setSyncStatus;
    };
  });

  if (status === "hidden") return null;

  const config =
    status === "syncing"
      ? {
          icon: Loader2,
          text: "Saving…",
          color: "bg-info-muted text-info-fg border-info/30",
          iconColor: "text-info",
          spin: true,
        }
      : status === "synced"
        ? {
            icon: CheckCircle2,
            text: "Saved",
            color: "bg-success-muted text-success-fg border-success/30",
            iconColor: "text-success",
            spin: false,
          }
        : {
            icon: CloudOff,
            text: "Offline",
            color: "bg-gray-100 text-gray-700 border-gray-200",
            iconColor: "text-gray-600",
            spin: false,
          };

  const Icon = config.icon;

  return (
    <div
      className={`fixed-above-nav fixed right-4 z-50 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-lg ${config.color}`}
    >
      <Icon className={`h-4 w-4 ${config.iconColor} ${config.spin ? "animate-spin" : ""}`} />
      <span>{config.text}</span>
    </div>
  );
}

export function useSyncStatus() {
  const showSyncing = (syncing: boolean) => {
    const fn = (window as unknown as { __setSyncStatus?: (value: boolean) => void }).__setSyncStatus;
    if (fn) fn(syncing);
  };

  return { showSyncing };
}
