"use client";

import { TIPS } from "../lib/tips";
import { FullScreenSheet } from "./FullScreenSheet";

export function TipsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <FullScreenSheet open={open} title="Tips" onClose={onClose} closeAriaLabel="Close tips">
      <p className="mb-4 text-sm text-gray-600">Short notes for the less obvious parts of the log.</p>
      <ul className="space-y-3">
        {TIPS.map((tip) => (
          <li
            key={tip.id}
            className="rounded-md border border-gray-200 bg-white px-4 py-3 shadow-[0_1px_0_rgb(20_83_45/0.08)]"
          >
            <p className="font-semibold text-gray-900">{tip.title}</p>
            <p className="mt-1 text-sm text-gray-600">{tip.body}</p>
          </li>
        ))}
      </ul>
    </FullScreenSheet>
  );
}
