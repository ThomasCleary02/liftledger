import { Dumbbell } from "lucide-react";

export function BrandMark({
  size = "md",
  inverted = false,
}: {
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
}) {
  const box = size === "lg" ? "h-14 w-14 rounded-xl" : size === "sm" ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-lg";
  const icon = size === "lg" ? "h-8 w-8" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const word = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";

  return (
    <div className="flex items-center gap-2.5">
      <span className={`inline-flex items-center justify-center bg-brand text-brand-fg ${box}`}>
        <Dumbbell className={icon} strokeWidth={2.25} aria-hidden />
      </span>
      <span className={`wordmark ${word} ${inverted ? "text-white" : "text-gray-900"}`}>
        LiftLedger
      </span>
    </div>
  );
}
