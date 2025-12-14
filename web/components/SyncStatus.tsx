"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { Cloud, CloudOff, Loader2, CheckCircle2 } from "lucide-react";
import { enableNetwork } from "firebase/firestore";

type SyncStatus = "online" | "offline" | "syncing" | "synced";

export function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>("online");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check browser online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      setStatus("syncing");
      // Try to enable network
      enableNetwork(db).then(() => {
        setStatus("synced");
        setTimeout(() => setStatus("online"), 2000);
      }).catch(() => {
        setStatus("offline");
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Show syncing state when saving
  const showSyncing = (syncing: boolean) => {
    if (syncing && isOnline) {
      setStatus("syncing");
    } else if (!isOnline) {
      setStatus("offline");
    } else {
      setStatus("synced");
      setTimeout(() => setStatus("online"), 2000);
    }
  };

  // Expose method to parent components
  useEffect(() => {
    (window as any).__setSyncStatus = showSyncing;
    return () => {
      delete (window as any).__setSyncStatus;
    };
  }, [isOnline]);

  if (status === "online") {
    return null; // Don't show anything when online and synced
  }

  const getStatusConfig = () => {
    switch (status) {
      case "syncing":
        return {
          icon: Loader2,
          text: "Syncing...",
          color: "bg-blue-100 text-blue-700 border-blue-200",
          iconColor: "text-blue-600",
        };
      case "synced":
        return {
          icon: CheckCircle2,
          text: "Synced",
          color: "bg-green-100 text-green-700 border-green-200",
          iconColor: "text-green-600",
        };
      case "offline":
        return {
          icon: CloudOff,
          text: "Offline",
          color: "bg-gray-100 text-gray-700 border-gray-200",
          iconColor: "text-gray-600",
        };
      default:
        return {
          icon: Cloud,
          text: "Online",
          color: "bg-gray-100 text-gray-700 border-gray-200",
          iconColor: "text-gray-600",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-lg ${config.color}`}
    >
      <Icon
        className={`h-4 w-4 ${config.iconColor} ${status === "syncing" ? "animate-spin" : ""}`}
      />
      <span>{config.text}</span>
    </div>
  );
}

// Hook to use sync status in components
export function useSyncStatus() {
  const showSyncing = (syncing: boolean) => {
    if ((window as any).__setSyncStatus) {
      (window as any).__setSyncStatus(syncing);
    }
  };

  return { showSyncing };
}
