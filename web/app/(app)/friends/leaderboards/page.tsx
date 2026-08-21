"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../providers/Auth";
import { db, auth } from "../../../../lib/firebase";
import { fetchDaysForLeaderboard } from "@liftledger/shared/firestore/leaderboards";
import {
  getVolumeLeaderboard,
  getCardioDistanceLeaderboard,
  getConsistencyLeaderboard,
  type LeaderboardTimePeriod,
} from "@liftledger/shared/analytics/leaderboards";
import { formatWeight, formatCardioDuration } from "../../../../lib/utils/units";
import { usePreferences } from "../../../../lib/hooks/usePreferences";
import { Trophy, ArrowLeft } from "lucide-react";
import { Avatar } from "../../../../components/Avatar";
import { logger } from "../../../../lib/logger";
import { accountService } from "../../../../lib/firebase";
import { rememberDays } from "../../../../lib/sessionCache";
import type { Day } from "../../../../lib/firestore/days";

type MetricType = "volume" | "cardio" | "consistency";

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

  const leaderboardData = useMemo(() => {
    if (!daysByUser) return [];
    if (metric === "volume") return getVolumeLeaderboard(daysByUser, timePeriod);
    if (metric === "cardio") return getCardioDistanceLeaderboard(daysByUser, timePeriod);
    return getConsistencyLeaderboard(daysByUser, timePeriod);
  }, [daysByUser, metric, timePeriod]);

  const formatValue = (value: number): string => {
    if (metric === "volume") {
      return formatWeight(value, units);
    } else if (metric === "cardio") {
      return formatCardioDuration(value);
    }
    return `${value} days`;
  };

  if (!authLoading && !user) {
    return null;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      <header className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/friends"
              prefetch
              className="mb-2 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Back</span>
            </Link>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Leaderboards</h1>
            <p className="text-sm text-gray-500">Compete with your friends</p>
          </div>

          <div className="mx-auto mt-4 max-w-4xl border-t border-gray-100 pt-4">
            <div className="flex gap-2">
              {(["volume", "cardio", "consistency"] as MetricType[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`flex-1 rounded-lg py-2 px-3 text-xs font-semibold transition-colors ${
                    metric === m
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {m === "volume" ? "Volume" : m === "cardio" ? "Cardio time" : "Consistency"}
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-4 max-w-4xl border-t border-gray-100 pt-4">
            <div className="flex items-center justify-end">
              <div className="flex rounded-lg bg-gray-100 p-1">
                {(["7days", "30days", "all"] as LeaderboardTimePeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimePeriod(period)}
                    className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
                      timePeriod === period
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {period === "7days" ? "7D" : period === "30days" ? "30D" : "All"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 md:px-8 md:max-w-4xl">
          {loading || authLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
              <p className="font-medium text-gray-900">Could not load leaderboards</p>
              <p className="mt-2 text-sm text-gray-500">Check your connection and try again.</p>
              <button
                type="button"
                onClick={loadDays}
                className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
              <Trophy className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">
                No leaderboard data yet. Add friends and start logging workouts!
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
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
