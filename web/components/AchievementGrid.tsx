"use client";

import type { LucideIcon } from "lucide-react";
import {
  Award,
  Calendar,
  Dumbbell,
  Flame,
  Heart,
  Medal,
  Moon,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import type { AchievementDef, AchievementIcon, EarnedMap } from "@liftledger/shared";

const ICONS: Record<AchievementIcon, LucideIcon> = {
  dumbbell: Dumbbell,
  flame: Flame,
  trophy: Trophy,
  heart: Heart,
  moon: Moon,
  medal: Medal,
  zap: Zap,
  calendar: Calendar,
  target: Target,
  award: Award,
};

const TIER_RING = {
  1: "border-amber-300",
  2: "border-sky-400",
  3: "border-violet-500",
};

export function AchievementMedal({
  def,
  earned,
  featured,
  size = 72,
  onClick,
}: {
  def: AchievementDef;
  earned: boolean;
  featured?: boolean;
  size?: number;
  onClick?: () => void;
}) {
  const Icon = ICONS[def.icon];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[44px] min-w-[44px] flex-col items-center gap-1.5"
      aria-label={def.title}
    >
      <span
        className={`flex items-center justify-center rounded-full border-4 ${
          earned ? `${TIER_RING[def.tier]} bg-brand text-brand-fg` : "border-gray-200 bg-gray-100 text-gray-400"
        } ${featured ? "ring-2 ring-offset-2 ring-brand" : ""} ${earned ? "" : "opacity-50"}`}
        style={{ width: size, height: size }}
      >
        <Icon className={earned ? "h-7 w-7" : "h-6 w-6"} />
      </span>
      <span className={`max-w-[4.5rem] text-center text-[11px] font-semibold leading-tight ${earned ? "text-gray-900" : "text-gray-400"}`}>
        {def.title}
      </span>
    </button>
  );
}

export function AchievementGrid({
  items,
  earned,
  featuredIds,
  onSelect,
}: {
  items: AchievementDef[];
  earned: EarnedMap;
  featuredIds: string[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-y-5 sm:grid-cols-4">
      {items.map((def) => (
        <AchievementMedal
          key={def.id}
          def={def}
          earned={Boolean(earned[def.id])}
          featured={featuredIds.includes(def.id)}
          onClick={() => onSelect(def.id)}
        />
      ))}
    </div>
  );
}
