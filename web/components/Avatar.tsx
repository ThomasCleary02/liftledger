"use client";

import { useState } from "react";

const PALETTE = ["#14532d", "#1d4ed8", "#9a3412", "#854d0e", "#6b21a8", "#0f766e", "#be185d", "#0369a1"];

function paletteIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash % PALETTE.length;
}

export function Avatar({
  name,
  photoURL,
  size = 40,
}: {
  name?: string | null;
  photoURL?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const label = (name || "?").replace(/^@/, "").trim() || "?";
  const letter = label.charAt(0).toUpperCase();
  if (photoURL && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoURL}
        alt=""
        width={size}
        height={size}
        className="flex-shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
      />
    );
  }
  const bg = PALETTE[paletteIndex(label)];
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.4)), backgroundColor: bg }}
      aria-hidden
    >
      {letter}
    </div>
  );
}
