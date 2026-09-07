"use client";

type ToastType = "success" | "error" | "info" | "warning" | "medal";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  /** Optional headline (used for medal unlocks). */
  title?: string;
}

let toasts: Toast[] = [];
let listeners: Array<() => void> = [];

export const toast = {
  success: (message: string, duration?: number) => {
    return addToast({ message, type: "success" }, duration);
  },
  error: (message: string, duration?: number) => {
    return addToast({ message, type: "error" }, duration);
  },
  info: (message: string, duration?: number) => {
    return addToast({ message, type: "info" }, duration);
  },
  warning: (message: string, duration?: number) => {
    return addToast({ message, type: "warning" }, duration);
  },
  medal: (title: string, detail?: string, duration?: number) => {
    return addToast(
      {
        type: "medal",
        title,
        message: detail?.trim() || "Pinned to your collection if there is room.",
      },
      duration
    );
  },
};

function addToast(
  partial: { message: string; type: ToastType; title?: string },
  duration?: number
): string {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    toasts.push({ id, ...partial });
    notifyListeners();

    const timeoutDuration = duration ?? 4000;
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notifyListeners();
    }, timeoutDuration);

    return id;
  } catch (error) {
    console.error("[Toast] Error adding toast:", error);
    return "error";
  }
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
}

export function getToasts(): Toast[] {
  return toasts;
}

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}
