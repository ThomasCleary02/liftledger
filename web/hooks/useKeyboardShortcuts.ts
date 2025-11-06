"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Cmd/Ctrl + K for search (future feature)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Future: Open search modal
      }

      // Escape to go back
      if (e.key === "Escape" && window.history.length > 1) {
        // Don't interfere with modals - they handle their own escape
        if (!document.querySelector('[role="dialog"]')) {
          router.back();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
