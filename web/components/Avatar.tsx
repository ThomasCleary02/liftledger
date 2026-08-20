"use client";

import { useState } from "react";

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
  const letter = (name || "?").replace(/^@/, "").trim().charAt(0).toUpperCase() || "?";
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
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700"
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.4)) }}
    >
      {letter}
    </div>
  );
}
