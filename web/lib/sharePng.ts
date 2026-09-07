export type SharePngResult = "shared" | "downloaded" | "previewed";

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create image"));
    }, "image/png");
  });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

function openPreview(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(url);
    throw new Error("Could not open image preview. Allow pop-ups, or try again from the browser Share sheet.");
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Prefer OS share, then download, then preview (iOS-safe; never navigates the PWA to a blob URL). */
export async function deliverSharePng(
  canvas: HTMLCanvasElement,
  filename: string,
  shareMeta: { title: string; text: string }
): Promise<SharePngResult> {
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], filename, { type: "image/png" });

  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const canShareFiles = Boolean(
    nav &&
      typeof nav.share === "function" &&
      (typeof nav.canShare !== "function" || nav.canShare({ files: [file] }))
  );

  if (canShareFiles && nav) {
    try {
      await nav.share({
        files: [file],
        title: shareMeta.title,
        text: shareMeta.text,
      });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "shared";
      }
    }
  }

  const isIos =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;

  if (!isIos) {
    triggerDownload(blob, filename);
    return "downloaded";
  }

  try {
    openPreview(blob);
    return "previewed";
  } catch {
    triggerDownload(blob, filename);
    return "downloaded";
  }
}
