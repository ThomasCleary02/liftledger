"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../providers/Auth";
import { db, auth } from "../../../../../lib/firebase";
import { fetchDaysForLeaderboard } from "@liftledger/shared/firestore/leaderboards";
import {
  getVolumeLeaderboard,
  getCardioDurationLeaderboard,
  getCardioDistanceLeaderboard,
  getCardioDistanceLeaderboardUnit,
  getConsistencyLeaderboard,
  availableCardioDistanceFamilies,
  type LeaderboardTimePeriod,
} from "@liftledger/shared/analytics/leaderboards";
import {
  CARDIO_DISTANCE_FAMILY_LABELS,
  type CardioDistanceFamily,
} from "@liftledger/shared/cardio";
import { formatWeight, formatCardioDuration, formatDistance } from "../../../../../lib/utils/units";
import { usePreferences } from "../../../../../lib/hooks/usePreferences";
import { Trophy, ArrowLeft, ChevronDown } from "lucide-react";
import { Avatar } from "../../../../../components/Avatar";
import { logger } from "../../../../../lib/logger";
import { accountService } from "../../../../../lib/firebase";
import { rememberDays } from "../../../../../lib/sessionCache";
import type { Day } from "../../../../../lib/firestore/days";

type MetricType = "volume" | "cardio" | "consistency" | CardioDistanceFamily;

function isDistanceFamily(metric: MetricType): metric is CardioDistanceFamily {
  return metric === "foot" || metric === "bike" || metric === "row" || metric === "stair";
}

export default function Leaderboards() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { units } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<MetricType>("volume");
  const [timePeriod, setTimePeriod] = useState<LeaderboardTimePeriod>("7days");
  const [daysByUser, setDaysByUser] = useState<Record<string, Day[]> | null>(null);
  const [profiles, setProfiles] = useState<Record<string, { username: string | null; photoURL: string | null }>>({});
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }
    loadDays();
  }, [user, router, authLoading]);

  const loadDays = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const fetched = await fetchDaysForLeaderboard(db, auth);
      setDaysByUser(fetched);
      if (user?.uid && fetched[user.uid]) {
        rememberDays(fetched[user.uid], {
          listComplete: fetched[user.uid].length < 1000,
          listLimit: 1000,
        });
      }
      const userIds = Object.keys(fetched);
      const profileMap: Record<string, { username: string | null; photoURL: string | null }> = {};
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            profileMap[userId] = await accountService.getProfileForUser(userId);
          } catch (error) {
            console.error(`Error fetching profile for ${userId}:`, error);
          }
        })
      );
      setProfiles(profileMap);
    } catch (error) {
      logger.error("Error loading leaderboard", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const distanceFamilies = useMemo(() => {
    if (!daysByUser) return [] as CardioDistanceFamily[];
    return availableCardioDistanceFamilies(daysByUser, timePeriod);
  }, [daysByUser, timePeriod]);

  // If the selected family chip disappears for this period, fall back to Cardio time.
  useEffect(() => {
    if (isDistanceFamily(metric) && !distanceFamilies.includes(metric)) {
      setMetric("cardio");
    }
  }, [metric, distanceFamilies]);

  const distanceUnit = useMemo(() => {
    if (!daysByUser || !isDistanceFamily(metric)) return null;
    return getCardioDistanceLeaderboardUnit(daysByUser, timePeriod, metric);
  }, [daysByUser, metric, timePeriod]);

  const leaderboardData = useMemo(() => {
    if (!daysByUser) return [];
    if (metric === "volume") return getVolumeLeaderboard(daysByUser, timePeriod);
    if (metric === "cardio") return getCardioDurationLeaderboard(daysByUser, timePeriod);
    if (isDistanceFamily(metric)) return getCardioDistanceLeaderboard(daysByUser, timePeriod, metric);
    return getConsistencyLeaderboard(daysByUser, timePeriod);
  }, [daysByUser, metric, timePeriod]);

  const formatValue = (value: number): string => {
    if (metric === "volume") return formatWeight(value, units);
    if (metric === "cardio") return formatCardioDuration(value);
    if (metric === "consistency") return `${value} days`;
    if (distanceUnit === "steps") {
      return `${Math.round(value).toLocaleString()} steps`;
    }
    if (distanceUnit === "seconds") return formatCardioDuration(value);
    return formatDistance(value, units);
  };

  const emptyCopy = (): string => {
    if (metric === "cardio") {
      return "Cardio time needs logged cardio sessions from you or your friends.";
    }
    if (metric === "volume") {
      return "Volume needs strength work logged in this period.";
    }
    if (metric === "consistency") {
      return "Consistency counts days with a workout or rest day logged.";
    }
    if (metric === "stair") {
      return "Stairs needs step counts logged for stair sessions.";
    }
    if (metric === "row" && distanceUnit === "seconds") {
      return "Row needs logged rowing sessions from you or your friends.";
    }
    return `${CARDIO_DISTANCE_FAMILY_LABELS[metric]} needs distance logged in this period.`;
  };

  const metricOptions = useMemo(() => {
    const base: Array<{ id: MetricType; label: string }> = [
      { id: "volume", label: "Volume (strength)" },
      { id: "cardio", label: "Cardio time (all modalities)" },
      { id: "consistency", label: "Consistency (active days)" },
    ];
    return [
      ...base,
      ...distanceFamilies.map((family) => ({
        id: family as MetricType,
        label: CARDIO_DISTANCE_FAMILY_LABELS[family],
      })),
    ];
  }, [distanceFamilies]);

  if (!authLoading && !user) {
    return null;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      <header className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/profile/friends"
              prefetch
              className="mb-3 flex min-h-[44px] items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-semibold">Friends</span>
            </Link>
            <p className="kicker mb-1">Profile</p>
            <h1 className="mb-2 text-2xl font-semibold text-gray-900 md:text-3xl">Leaderboards</h1>
            <p className="text-sm text-gray-500">
              Compare volume, cardio time, consistency (active days), and distance by family
            </p>
          </div>

          <div className="mx-auto mt-4 flex max-w-4xl flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <label className="kicker mb-2 block" htmlFor="leaderboard-metric">
                Board
              </label>
              <div className="relative">
                <select
                  id="leaderboard-metric"
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as MetricType)}
                  className="w-full appearance-none rounded-md border border-gray-200 bg-white py-3 pl-3 pr-10 text-sm font-semibold text-gray-900 shadow-[0_1px_0_rgb(20_83_45/0.06)] outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  {metricOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
              </div>
            </div>
            <div className="flex shrink-0 justify-end">
              <div className="flex rounded-lg bg-gray-100 p-1" role="group" aria-label="Time period">
                {(
                  [
                    { id: "7days", label: "7 days", aria: "Last 7 days" },
                    { id: "30days", label: "30 days", aria: "Last 30 days" },
                    { id: "all", label: "All time", aria: "All time" },
                  ] as const
                ).map((period) => (
                  <button
                    key={period.id}
                    type="button"
                    onClick={() => setTimePeriod(period.id)}
                    aria-label={period.aria}
                    aria-pressed={timePeriod === period.id}
                    className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      timePeriod === period.id
                        ? "bg-brand text-brand-fg"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 pb-8 md:px-8 md:max-w-4xl">
          {loading || authLoading ? (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
          ) : loadError ? (
            <div className="rounded-md border border-gray-100 bg-white p-12 text-center shadow-sm">
              <p className="font-medium text-gray-900">Could not load leaderboards</p>
              <p className="mt-2 text-sm text-gray-500">Check your connection and try again.</p>
              <button
                type="button"
                onClick={loadDays}
                className="btn-primary mt-4"
              >
                Retry
              </button>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="rounded-md border border-gray-100 bg-white p-12 text-center shadow-sm">
              <Trophy className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 font-medium text-gray-900">Nothing to rank yet</p>
              <p className="mt-1 text-sm text-gray-500">{emptyCopy()}</p>
              <Link
                href="/profile/friends"
                prefetch
                className="mt-4 inline-block text-sm font-semibold text-brand"
              >
                Add friends
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
              {leaderboardData.map((entry) => {
                const isCurrentUser = entry.userId === user?.uid;
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0 ${
                      isCurrentUser ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex flex-1 items-center">
                      <div
                        className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full ${
                          entry.rank === 1
                            ? "bg-yellow-100"
                            : entry.rank === 2
                            ? "bg-gray-100"
                            : entry.rank === 3
                            ? "bg-orange-100"
                            : "bg-gray-50"
                        }`}
                      >
                        <span
                          className={`text-sm font-bold ${
                            entry.rank === 1
                              ? "text-yellow-700"
                              : entry.rank === 2
                              ? "text-gray-700"
                              : entry.rank === 3
                              ? "text-orange-700"
                              : "text-gray-600"
                          }`}
                        >
                          {entry.rank}
                        </span>
                      </div>
                      <Avatar
                        name={isCurrentUser ? "You" : profiles[entry.userId]?.username}
                        photoURL={profiles[entry.userId]?.photoURL}
                        size={40}
                      />
                      <div className="ml-3 min-w-0 flex-1">
                        <p className={`truncate font-semibold ${isCurrentUser ? "text-blue-700" : "text-gray-900"}`}>
                          {isCurrentUser
                            ? "You"
                            : profiles[entry.userId]?.username || "Unknown user"}
                        </p>
                        {isCurrentUser && (
                          <p className="text-xs text-blue-600 mt-0.5">Your rank</p>
                        )}
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{formatValue(entry.value)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
