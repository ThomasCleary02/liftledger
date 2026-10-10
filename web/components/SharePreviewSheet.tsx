"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { lockFullScreenChrome, unlockFullScreenChrome } from "./fullScreenChrome";

type Props = {
  open: boolean;
  imageUrl: string | null;
  title?: string;
  sharing?: boolean;
  onClose: () => void;
  onShare: () => void;
  onSave: () => void;
};

/** Portaled to document.body so it stacks above FullScreenSheet (also portaled). */
export default function SharePreviewSheet({
  open,
  imageUrl,
  title = "Share preview",
  sharing = false,
  onClose,
  onShare,
  onSave,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    lockFullScreenChrome();
    return () => {
      unlockFullScreenChrome();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // Only when `open` flips — onClose identity must not rebind Escape.
  }, [open]);

  if (!mounted || !open || !imageUrl) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[min(90dvh,90vh)] w-full max-w-md flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-[0_1px_0_rgb(20_83_45/0.08)] dark:border-gray-700 dark:bg-gray-950 dark:shadow-none"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Share preview"
            className="mx-auto w-full rounded-md border border-gray-200 dark:border-gray-700"
          />
        </div>
        <div className="flex gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
          <button type="button" onClick={onSave} className="btn-secondary flex-1" disabled={sharing}>
            Save
          </button>
          <button type="button" onClick={onShare} className="btn-primary flex-1" disabled={sharing}>
            {sharing ? "Sharing…" : "Share"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
