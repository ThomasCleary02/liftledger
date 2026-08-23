"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

/** Full-screen overlay on document.body, sized to visualViewport so iOS chrome cannot cover search or Done. */
export function AddLiftModal({ open, title = "Add a lift", onClose, children }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previousOverflow = document.body.style.overflow;
    root.classList.add("add-modal-open");
    document.body.style.overflow = "hidden";
    window.visualViewport?.dispatchEvent(new Event("resize"));
    return () => {
      root.classList.remove("add-modal-open");
      document.body.style.overflow = previousOverflow;
      window.visualViewport?.dispatchEvent(new Event("resize"));
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = panelRef.current;
    if (!el) return;

    const sync = () => {
      const vv = window.visualViewport;
      el.style.right = "auto";
      el.style.bottom = "auto";
      if (!vv) {
        el.style.top = "0px";
        el.style.left = "0px";
        el.style.width = "100%";
        el.style.height = "100dvh";
        setKeyboardOpen(false);
        return;
      }
      el.style.top = `${vv.offsetTop}px`;
      el.style.left = `${vv.offsetLeft}px`;
      el.style.width = `${vv.width}px`;
      el.style.height = `${vv.height}px`;
      const occluded = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardOpen((prev) => {
        const next = occluded > 80;
        return prev === next ? prev : next;
      });
    };

    sync();
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, [open, mounted]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      aria-labelledby={titleId}
      className="fixed z-[100] flex flex-col overflow-hidden bg-white"
      style={{
        top: 0,
        left: 0,
        width: "100%",
        height: "100dvh",
        overscrollBehavior: "none",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      <div
        className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px), var(--safe-area-top, 0px))" }}
      >
        <h2 id={titleId} className="min-w-0 truncate text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary min-h-[44px] shrink-0 px-4 text-sm font-semibold"
          aria-label="Close add sheet"
        >
          Done
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
      {!keyboardOpen && (
        <div
          className="flex-shrink-0 border-t border-gray-200 bg-white px-4 pt-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <button type="button" onClick={onClose} className="btn-primary w-full min-h-[48px]">
            Done
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
