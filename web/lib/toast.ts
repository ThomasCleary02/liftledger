"use client";

type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toasts: Toast[] = [];
let listeners: Array<() => void> = [];

export const toast = {
  success: (message: string, duration?: number) => {
    return addToast(message, "success", duration);
  },
  error: (message: string, duration?: number) => {
    return addToast(message, "error", duration);
  },
  info: (message: string, duration?: number) => {
    return addToast(message, "info", duration);
  },
  warning: (message: string, duration?: number) => {
    return addToast(message, "warning", duration);
  },
};

function addToast(message: string, type: ToastType, duration?: number): string {
  try {
    const id = Math.random().toString(36).substring(2, 9);
    toasts.push({ id, message, type });
    notifyListeners();
    
    // Auto remove after specified duration, or default to 8 seconds
    const timeoutDuration = duration ?? 4000;
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notifyListeners();
    }, timeoutDuration);
    
    return id;
  } catch (error) {
    console.error("[Toast] Error adding toast:", error);
    // Return a dummy ID so the caller doesn't break
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
