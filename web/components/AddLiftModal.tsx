"use client";

import { FullScreenSheet } from "./FullScreenSheet";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

/** Full-screen overlay on document.body, sized to visualViewport so iOS chrome cannot cover search or Done. */
export function AddLiftModal({ open, title = "Add a lift", onClose, children }: Props) {
  return (
    <FullScreenSheet open={open} title={title} onClose={onClose} closeAriaLabel="Close add sheet">
      {children}
    </FullScreenSheet>
  );
}
