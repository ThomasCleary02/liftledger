"use client";

export function Avatar({
  name,
  photoURL,
  size = 40,
}: {
  name?: string | null;
  photoURL?: string | null;
  size?: number;
}) {
  const letter = (name || "?").replace(/^@/, "").trim().charAt(0).toUpperCase() || "?";
  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoURL}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700"
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.4)) }}
    >
      {letter}
    </div>
  );
}
