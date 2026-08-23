"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

/** Full-screen overlay pinned to visualViewport so the iOS PWA keyboard does not crush a bottom sheet. */
export function AddLiftModal({ open, title = "Add a lift", onClose, children }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

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
      if (!vv) {
        el.style.top = "0px";
        el.style.left = "0px";
        el.style.width = "100%";
        el.style.height = "100dvh";
        return;
      }
      el.style.top = `${vv.offsetTop}px`;
      el.style.left = `${vv.offsetLeft}px`;
      el.style.width = `${vv.width}px`;
      el.style.height = `${vv.height}px`;
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
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      aria-labelledby={titleId}
      className="fixed z-[60] flex flex-col bg-white"
      style={{
        top: 0,
        left: 0,
        width: "100%",
        height: "100dvh",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 py-2">
        <h2 id={titleId} className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          aria-label="Close add sheet"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
    </div>
  );
}
