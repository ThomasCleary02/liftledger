"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/50 md:items-center md:justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full rounded-t-3xl bg-white p-6 md:max-w-md md:rounded-2xl">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="mt-2 text-gray-600">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              danger
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                : "bg-black hover:bg-gray-800 focus:ring-black"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
