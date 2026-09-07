"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import { focusInitial, trapFocusKeydown } from "../lib/focusTrap";

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
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => {
      if (panelRef.current) focusInitial(panelRef.current, "[data-confirm-cancel]");
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancelRef.current();
        return;
      }
      if (panelRef.current) trapFocusKeydown(event, panelRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="modal-backdrop fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={panelRef}
        className="w-full max-w-sm rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.14)]"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p className="mt-2 text-gray-600">{message}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            data-confirm-cancel
            onClick={onCancel}
            className="btn-secondary min-h-[48px] flex-1"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={danger ? "btn-danger min-h-[48px] flex-1" : "btn-primary min-h-[48px] flex-1"}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
