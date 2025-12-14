"use client";

import { useState, useEffect } from "react";
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
import { formatWeight, formatDistance } from "../../../../lib/utils/units";
import { usePreferences } from "../../../../lib/hooks/usePreferences";
import { Trophy, ArrowLeft, BarChart3, Map as MapIcon, Calendar } from "lucide-react";
import { logger } from "../../../../lib/logger";
import { accountService } from "../../../../lib/firebase";

type MetricType = "volume" | "cardio" | "consistency";

export default function Leaderboards() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { units } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<MetricType>("volume");
  const [timePeriod, setTimePeriod] = useState<LeaderboardTimePeriod>("7days");
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.replace("/login");
      return;
    }
    loadLeaderboard();
  }, [user, router, authLoading, metric, timePeriod]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const daysByUser = await fetchDaysForLeaderboard(db, auth);

      let data: any[] = [];
      if (metric === "volume") {
        data = getVolumeLeaderboard(daysByUser, timePeriod);
      } else if (metric === "cardio") {
        data = getCardioDistanceLeaderboard(daysByUser, timePeriod);
      } else {
        data = getConsistencyLeaderboard(daysByUser, timePeriod);
      }

      setLeaderboardData(data);
      
      // Fetch usernames for all users in the leaderboard
      const userIds = Array.from(new Set(data.map((entry) => entry.userId)));
      const usernameMap: Record<string, string> = {};
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const username = await accountService.getUsernameForUser(userId);
            if (username) {
              usernameMap[userId] = username;
            }
          } catch (error) {
            console.error(`Error fetching username for ${userId}:`, error);
          }
        })
      );
      setUsernames(usernameMap);
    } catch (error) {
      logger.error("Error loading leaderboard", error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number): string => {
    if (metric === "volume") {
      return formatWeight(value, units);
    } else if (metric === "cardio") {
      return formatDistance(value, units);
    } else {
      return `${value} days`;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
          <p className="mt-4 text-gray-500">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* Fixed Header */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto max-w-4xl">
            <button
              onClick={() => router.back()}
              className="mb-2 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Back</span>
            </button>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Leaderboards</h1>
            <p className="text-sm text-gray-500">Compete with your friends</p>
          </div>

          {/* Metric Selector */}
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
                  {m === "volume" ? "Volume" : m === "cardio" ? "Cardio" : "Consistency"}
                </button>
              ))}
            </div>
          </div>

          {/* Time Period Filter */}
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

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 md:px-8 md:max-w-4xl">
          {leaderboardData.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
              <Trophy className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">
                No leaderboard data yet. Add friends and start logging workouts!
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {leaderboardData.map((entry, index) => {
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
                      <div className="flex-1">
                        <p className={`font-semibold ${isCurrentUser ? "text-blue-700" : "text-gray-900"}`}>
                          {isCurrentUser 
                            ? "You" 
                            : usernames[entry.userId] || entry.userId.substring(0, 8)}
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
