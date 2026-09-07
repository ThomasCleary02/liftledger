"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clampAvatarCrop, type AvatarCrop } from "../lib/avatar";

export function AvatarCropModal({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (crop: AvatarCrop) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [view, setView] = useState(260);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    setView(Math.min(280, Math.max(200, window.innerWidth - 64)));
  }, []);

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const minSide = Math.min(natural.w || 1, natural.h || 1);
  const scale = (view / minSide) * zoom;
  const displayW = natural.w * scale;
  const displayH = natural.h * scale;

  const clampPos = (next: { x: number; y: number }, width = displayW, height = displayH) => {
    const minX = Math.min(0, view - width);
    const minY = Math.min(0, view - height);
    const maxX = 0;
    const maxY = 0;
    return {
      x: Math.min(maxX, Math.max(minX, next.x)),
      y: Math.min(maxY, Math.max(minY, next.y)),
    };
  };

  const applyZoom = (nextZoom: number) => {
    if (!natural.w) {
      setZoom(nextZoom);
      return;
    }
    const oldScale = (view / minSide) * zoom;
    const newScale = (view / minSide) * nextZoom;
    const cx = (view / 2 - pos.x) / oldScale;
    const cy = (view / 2 - pos.y) / oldScale;
    const width = natural.w * newScale;
    const height = natural.h * newScale;
    setZoom(nextZoom);
    setPos(clampPos({ x: view / 2 - cx * newScale, y: view / 2 - cy * newScale }, width, height));
  };

  const confirm = () => {
    if (!natural.w) return;
    onConfirm(
      clampAvatarCrop(
        { sx: -pos.x / scale, sy: -pos.y / scale, size: view / scale },
        natural.w,
        natural.h
      )
    );
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <h2 className="text-lg font-semibold text-gray-900">Crop photo</h2>
        <p className="mt-1 text-sm text-gray-500">Drag to frame, then zoom. Saved as a circle.</p>
        <div
          className="relative mx-auto mt-4 overflow-hidden rounded-full bg-gray-100"
          style={{ width: view, height: view, touchAction: "none" }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: pos.x, y: pos.y, px: event.clientX, py: event.clientY };
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            setPos(
              clampPos({
                x: drag.current.x + (event.clientX - drag.current.px),
                y: drag.current.y + (event.clientY - drag.current.py),
              })
            );
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              draggable={false}
              onLoad={(event) => {
                const el = event.currentTarget;
                const nextMin = Math.min(el.naturalWidth, el.naturalHeight);
                const nextScale = view / nextMin;
                setNatural({ w: el.naturalWidth, h: el.naturalHeight });
                setPos(
                  clampPos(
                    {
                      x: (view - el.naturalWidth * nextScale) / 2,
                      y: (view - el.naturalHeight * nextScale) / 2,
                    },
                    el.naturalWidth * nextScale,
                    el.naturalHeight * nextScale
                  )
                );
              }}
              className="absolute max-w-none select-none"
              style={{ left: pos.x, top: pos.y, width: displayW || undefined, height: displayH || undefined }}
            />
          )}
        </div>
        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={(event) => applyZoom(Number(event.target.value))}
            className="mt-2 w-full"
          />
        </label>
        <div className="mt-5 flex gap-3">
          <button type="button" className="btn-secondary min-h-[48px] flex-1" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary min-h-[48px] flex-1"
            disabled={!natural.w}
            onClick={confirm}
          >
            Use photo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
