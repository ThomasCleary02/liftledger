"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export function RestTimer({
  seconds,
  onDone,
  onSkip,
}: {
  seconds: number;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finishedRef = useRef(false);
  const armedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
    armedRef.current = seconds > 0;
    setRemaining(seconds);
    const id = window.setInterval(() => {
      setRemaining((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  useEffect(() => {
    if (!armedRef.current || remaining > 0 || finishedRef.current) return;
    finishedRef.current = true;
    onDoneRef.current();
  }, [remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="fixed-below-status fixed left-4 right-4 z-40 mx-auto max-w-md rounded-2xl border border-gray-200 bg-white px-4 py-3 md:left-auto md:right-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Rest</p>
          <p className="text-2xl font-bold tabular-nums text-gray-900" aria-live="polite">
            {mins}:{secs.toString().padStart(2, "0")}
          </p>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800"
        >
          <X className="h-4 w-4" />
          Skip
        </button>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-black transition-[width] duration-1000 ease-linear"
          style={{ width: `${seconds > 0 ? Math.max(0, (remaining / seconds) * 100) : 0}%` }}
        />
      </div>
    </div>
  );
}
