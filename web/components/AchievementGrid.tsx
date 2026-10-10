"use client";

import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bike,
  Calendar,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Medal,
  Mountain,
  Moon,
  PersonStanding,
  Repeat,
  Shield,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap,
  Layers,
} from "lucide-react";
import type {
  AchievementDef,
  AchievementIcon,
  AchievementProgressMetric,
  EarnedMap,
  MedalTier,
} from "@liftledger/shared";
import { formatAchievementProgress } from "@liftledger/shared";

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
  footprints: Footprints,
  bike: Bike,
  mountain: Mountain,
  person: PersonStanding,
  repeat: Repeat,
  sparkles: Sparkles,
  timer: Timer,
  shield: Shield,
  // Lucide 0.468 has no Stairs — layered bars read as steps.
  stairs: Layers,
};

/** Tailwind face classes — hex source: packages/shared/medalTiers.ts */
export const TIER_FACE: Record<MedalTier, string> = {
  1: "from-[#e8953a] via-[#c46a1a] to-[#6b3510] text-[#fff8eb]",
  2: "from-[#f0f5fa] via-[#a8b8c8] to-[#4a5d72] text-[#0f172a]",
  3: "from-[#ffe566] via-[#f5b800] to-[#b8860b] text-[#3f2a08]",
  4: "from-[#f5fffe] via-[#b8e8e0] to-[#3d9a8f] text-[#0a2f2c]",
  5: "from-[#a5f3fc] via-[#22d3ee] to-[#1e3a8a] text-[#ecfeff]",
};

const TIER_RING: Record<MedalTier, string> = {
  1: "ring-[#5c2e0a]/80",
  2: "ring-[#3d4f63]/85",
  3: "ring-[#8a6500]/80",
  4: "ring-[#14b8a6]/90",
  5: "ring-[#06b6d4]/90",
};

export function AchievementMedal({
  def,
  earned,
  featured,
  size = 64,
  metric,
  /** Show full tier color even when locked (detail sheet). */
  forceColor = false,
  showTitle = true,
  onClick,
}: {
  def: AchievementDef;
  earned: boolean;
  featured?: boolean;
  size?: number;
  metric?: AchievementProgressMetric;
  forceColor?: boolean;
  showTitle?: boolean;
  onClick?: () => void;
}) {
  const Icon = ICONS[def.icon];
  const iconPx = Math.round(size * 0.36);
  const showProgress = !earned && metric && metric.target > 0 && !forceColor;
  const ratio = showProgress ? Math.min(1, metric.current / metric.target) : 0;
  const colored = earned || forceColor;
  const tier = def.tier as MedalTier;
  const progressLabel = showProgress && metric ? formatAchievementProgress(metric) : null;
  const statusHint = [earned ? "earned" : "locked", progressLabel].filter(Boolean).join(", ");

  const face = (
    <span
      className={`relative flex items-center justify-center rounded-full bg-gradient-to-b ring-2 ${
        colored
          ? `${TIER_FACE[tier]} ${TIER_RING[tier]} shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.2)]`
          : "from-[#cfc4b4] to-[#b5a894] text-gray-600 ring-[#a89880]/35 opacity-55 dark:from-[#3a322a] dark:to-[#2a241e] dark:text-gray-500 dark:ring-[#4a4036]/40 dark:opacity-60"
      }`}
      style={{ width: size, height: size }}
    >
      {colored ? (
        <span
          className="pointer-events-none absolute left-[18%] top-[14%] h-[26%] w-[40%] rounded-full bg-white/30 motion-reduce:opacity-80"
          aria-hidden
        />
      ) : null}
      <span
        className={`relative z-[1] flex items-center justify-center rounded-full ${
          colored ? "bg-black/28" : "bg-black/8"
        }`}
        style={{ width: size * 0.58, height: size * 0.58 }}
      >
        <Icon style={{ width: iconPx, height: iconPx }} strokeWidth={2.25} aria-hidden />
      </span>
      {featured && earned && (
        <span className="absolute inset-0 rounded-full ring-2 ring-brand ring-offset-2 ring-offset-paper" />
      )}
    </span>
  );

  const inner = (
    <>
      {face}
      {showTitle ? (
        <span
          className={`text-center text-[11px] font-semibold leading-tight ${
            earned ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {def.title}
        </span>
      ) : null}
      {showProgress ? (
        <span className="flex w-full flex-col items-center gap-1">
          <span className="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <span
              className="block h-full rounded-full bg-brand/70 transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${Math.max(6, ratio * 100)}%` }}
            />
          </span>
          <span className="font-mono text-[9px] tabular-nums text-gray-400 dark:text-gray-500">
            {progressLabel}
          </span>
        </span>
      ) : null}
    </>
  );

  if (!onClick) {
    return <div className="flex flex-col items-center gap-1.5">{inner}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[5.25rem] flex-col items-center gap-1.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      aria-label={showTitle ? undefined : def.title}
      aria-description={statusHint || undefined}
    >
      {inner}
    </button>
  );
}

export function AchievementGrid({
  items,
  earned,
  featuredIds,
  progressById,
  onSelect,
}: {
  items: AchievementDef[];
  earned: EarnedMap;
  featuredIds: string[];
  progressById?: Record<string, AchievementProgressMetric>;
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
          metric={progressById?.[def.id]}
          onClick={() => onSelect(def.id)}
        />
      ))}
    </div>
  );
}
