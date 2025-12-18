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
  success: (message: string) => {
    addToast(message, "success");
  },
  error: (message: string) => {
    addToast(message, "error");
  },
  info: (message: string) => {
    addToast(message, "info");
  },
  warning: (message: string) => {
    addToast(message, "warning");
  },
};

function addToast(message: string, type: ToastType) {
  const id = Math.random().toString(36).substring(2, 9);
  toasts.push({ id, message, type });
  notifyListeners();
  
  // Auto remove after 8 seconds (longer for insights which may have more text)
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  }, 8000);
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
