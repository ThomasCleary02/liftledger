"use client";

import { useEffect, useState } from "react";
import { getToasts, removeToast, subscribe, Toast } from "../lib/toast";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const toastConfig = {
  success: { icon: CheckCircle, bg: "bg-green-50", border: "border-green-200", text: "text-green-800", iconColor: "text-green-600" },
  error: { icon: AlertCircle, bg: "bg-red-50", border: "border-red-200", text: "text-red-800", iconColor: "text-red-600" },
  info: { icon: Info, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", iconColor: "text-blue-600" },
  warning: { icon: AlertTriangle, bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", iconColor: "text-yellow-600" },
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
    <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 md:top-6 md:right-6 md:left-auto md:max-w-md">
      {toasts.map((toast) => {
        const config = toastConfig[toast.type];
        const Icon = config.icon;
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-lg border ${config.border} ${config.bg} px-4 py-3 shadow-lg min-w-[300px] max-w-[400px] animate-in slide-in-from-right`}
          >
            <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0`} />
            <p className={`flex-1 text-sm font-medium ${config.text}`}>{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className={`${config.iconColor} hover:opacity-70 transition-opacity`}
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
