"use client";

import { useEffect, useState } from "react";

const PALETTE = ["#14532d", "#1d4ed8", "#9a3412", "#854d0e", "#6b21a8", "#0f766e", "#be185d", "#0369a1"];

function paletteIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash % PALETTE.length;
}

function isLocalUrl(url: string): boolean {
  return url.startsWith("data:") || url.startsWith("blob:");
}

export function Avatar({
  name,
  photoURL,
  size = 40,
  busy = false,
}: {
  name?: string | null;
  photoURL?: string | null;
  size?: number;
  busy?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState<string | null>(photoURL ?? null);

  useEffect(() => {
    setFailed(false);
    if (!photoURL) {
      setShown(null);
      return;
    }
    if (isLocalUrl(photoURL)) setShown(photoURL);
  }, [photoURL]);

  const label = (name || "?").replace(/^@/, "").trim() || "?";
  const letter = label.charAt(0).toUpperCase();
  const placeholder = shown && shown !== photoURL ? shown : null;
  const showLetter = failed || !photoURL;

  return (
    <div className="relative flex-shrink-0 overflow-hidden rounded-full bg-gray-200" style={{ width: size, height: size }}>
      {placeholder && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={placeholder} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {photoURL && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoURL}
          alt=""
          width={size}
          height={size}
          className={`relative h-full w-full rounded-full object-cover ${placeholder ? "opacity-0" : ""}`}
          onLoad={() => {
            setFailed(false);
            setShown(photoURL);
          }}
          onError={() => {
            if (!placeholder) setFailed(true);
          }}
        />
      )}
      {showLetter && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full font-semibold text-white"
          style={{ fontSize: Math.max(11, Math.round(size * 0.4)), backgroundColor: PALETTE[paletteIndex(label)] }}
          aria-hidden
        >
          {letter}
        </div>
      )}
      {busy && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <span className="spinner-sm border-white/30 border-t-white" />
        </div>
      )}
    </div>
  );
}
