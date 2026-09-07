"use client";

import { useEffect, useState } from "react";
import { getToasts, removeToast, subscribe, Toast } from "../lib/toast";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Medal } from "lucide-react";

const toastConfig = {
  success: {
    icon: CheckCircle,
    bg: "bg-success-muted",
    border: "border-success/30",
    text: "text-success-fg",
    iconColor: "text-success",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-danger-muted",
    border: "border-danger/30",
    text: "text-danger-fg",
    iconColor: "text-danger",
  },
  info: {
    icon: Info,
    bg: "bg-info-muted",
    border: "border-info/30",
    text: "text-info-fg",
    iconColor: "text-info",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-warning-muted",
    border: "border-warning/30",
    text: "text-warning-fg",
    iconColor: "text-warning",
  },
  medal: {
    icon: Medal,
    bg: "bg-brand/10",
    border: "border-brand/40",
    text: "text-gray-900",
    iconColor: "text-brand",
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setToasts(getToasts());
    const unsubscribe = subscribe(() => {
      setToasts(getToasts());
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed-below-status fixed left-4 right-4 z-[110] flex flex-col gap-2 md:right-6 md:left-auto md:max-w-md"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const config = toastConfig[toast.type];
        const Icon = config.icon;
        return (
          <div
            key={toast.id}
            className={`flex w-full items-start gap-3 rounded-lg border ${config.border} ${config.bg} px-4 py-3 shadow-lg`}
          >
            <Icon className={`mt-0.5 h-5 w-5 ${config.iconColor} flex-shrink-0`} />
            <div className="min-w-0 flex-1">
              {toast.type === "medal" ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand">Medal unlocked</p>
                  <p className={`mt-0.5 text-sm font-semibold ${config.text}`}>{toast.title ?? toast.message}</p>
                  {toast.title ? <p className="mt-0.5 text-sm text-gray-600">{toast.message}</p> : null}
                </>
              ) : (
                <p className={`text-sm font-medium ${config.text}`}>{toast.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className={`${config.iconColor} transition-opacity hover:opacity-70`}
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
