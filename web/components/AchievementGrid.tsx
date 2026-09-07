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

const TIER_FACE = {
  1: "from-[#d6a15c] via-[#a56b32] to-[#5c3a16] text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
  2: "from-[#f3f6fb] via-[#9aa7b8] to-[#4b5563] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
  3: "from-[#ffe9a3] via-[#e0a526] to-[#8a4b08] text-[#3f2a08] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
};

export function AchievementMedal({
  def,
  earned,
  featured,
  size = 64,
  onClick,
}: {
  def: AchievementDef;
  earned: boolean;
  featured?: boolean;
  size?: number;
  onClick?: () => void;
}) {
  const Icon = ICONS[def.icon];
  const iconPx = Math.round(size * 0.38);
  return (
    <button type="button" onClick={onClick} className="flex w-[4.75rem] flex-col items-center gap-2" aria-label={def.title}>
      <span
        className={`relative flex items-center justify-center rounded-full bg-gradient-to-b ${
          earned ? TIER_FACE[def.tier] : "from-[#d9ccb8] to-[#b7a48c] text-gray-600 dark:from-[#3a322a] dark:to-[#1c1915] dark:text-gray-500"
        }`}
        style={{ width: size, height: size }}
      >
        <span className={`flex items-center justify-center rounded-full ${earned ? "bg-black/25" : "bg-black/10"}`} style={{ width: size * 0.62, height: size * 0.62 }}>
          <Icon style={{ width: iconPx, height: iconPx }} />
        </span>
        {featured && earned && (
          <span className="absolute inset-0 rounded-full ring-2 ring-brand ring-offset-2 ring-offset-paper" />
        )}
      </span>
      <span className={`text-center text-[11px] font-semibold leading-tight ${earned ? "text-gray-900" : "text-gray-400"}`}>
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
    <div className="grid grid-cols-3 justify-items-center gap-x-2 gap-y-6">
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
