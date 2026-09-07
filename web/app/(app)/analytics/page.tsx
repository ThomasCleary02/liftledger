"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../providers/Auth";
import { listDays, getDaysInRange, Day } from "../../../lib/firestore/days";
import { getAllExercises } from "../../../lib/firestore/exercises";
import {
  getAnalyticsSummaryFromDays,
  getStrengthAnalytics,
  getCardioAnalytics,
  filterDaysByPeriod,
  findAllPRs,
  collapsePRsByExercise,
  getLiftProgress,
  getBodyweightPoints,
  getBodyweightChangeLbs,
  type CardioTypeStats,
} from "../../../lib/analytics/calculations";
import { AnalyticsSummary, ExercisePR, TimePeriod } from "../../../lib/analytics/types";
import { ExerciseDoc } from "../../../lib/firestore/exercises";
import { usePreferences } from "../../../lib/hooks/usePreferences";
import {
  formatWeight,
  formatDistance,
  formatCardioDuration,
  formatPace,
  formatPaceAsSpeed,
  formatSpeed,
  formatGroupedNumber,
} from "../../../lib/utils/units";
import {
  Dumbbell,
  BarChart3,
  Heart,
  Trophy,
  Flame,
  TrendingUp,
  Map as MapIcon,
  Clock,
  Gauge,
  Share,
} from "lucide-react";
import { format, startOfWeek, eachDayOfInterval, addDays } from "date-fns";
import { logger } from "../../../lib/logger";
import { toast } from "../../../lib/toast";
import { getAccountSummary } from "../../../lib/firestore/account";
import { CARDIO_ACTIVITY_LABELS, cardioPaceKind, type CardioActivityType } from "@liftledger/shared";
import { ExerciseNameLabel } from "../../../components/ExerciseNameLabel";
import { shareWeekPng } from "../../../lib/shareWeekPng";
import { peekCatalog, peekDaysArray, daysListIsComplete } from "../../../lib/sessionCache";

type TabType = "overview" | "strength" | "cardio" | "prs";

const ALL_HISTORY_LIMIT = 250;
const LIFETIME_HISTORY_LIMIT = 1000;

const PERIODS: { id: TimePeriod; short: string; label: string }[] = [
  { id: "week", short: "7d", label: "Last 7 days" },
  { id: "month", short: "30d", label: "Last 30 days" },
  { id: "year", short: "1y", label: "Last year" },
  { id: "all", short: "All", label: "All time" },
];

function prTypeLabel(prType: ExercisePR["prType"]): string {
  if (prType === "maxWeight") return "Best weight";
  if (prType === "maxDistance") return "Longest";
  if (prType === "maxDuration") return "Longest time";
  if (prType === "bestPace") return "Best pace";
  if (prType === "maxReps") return "Best reps";
  return prType;
}

function periodStart(period: TimePeriod): Date | null {
  if (period === "all") return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === "week") start.setDate(start.getDate() - 7);
  else if (period === "month") start.setDate(start.getDate() - 30);
  else start.setFullYear(start.getFullYear() - 1);
  return start;
}

function mergeDays(existing: Day[], incoming: Day[]): Day[] {
  const map = new Map(existing.map((day) => [day.date, day]));
  incoming.forEach((day) => map.set(day.date, day));
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

function catalogToMap(): Map<string, ExerciseDoc> {
  const map = new Map<string, ExerciseDoc>();
  const catalog = peekCatalog();
  if (catalog) {
    catalog.forEach((ex) => map.set(ex.id, ex));
  }
  return map;
}

export default function Analytics() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [days, setDays] = useState<Day[]>(() => peekDaysArray());
  const [exercises, setExercises] = useState<Map<string, ExerciseDoc>>(catalogToMap);
  const [loading, setLoading] = useState(() => peekDaysArray().length === 0);
  const { defaultChartView } = usePreferences();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(defaultChartView);
  const [trackedExerciseIds, setTrackedExerciseIds] = useState<string[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [historyComplete, setHistoryComplete] = useState(() => daysListIsComplete());
  const [lifetimeDays, setLifetimeDays] = useState<Day[]>(() => peekDaysArray());
  const [lifetimeComplete, setLifetimeComplete] = useState(() => daysListIsComplete());
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    if (!user) {
      router.replace("/login");
      return;
    }
    void loadData(timePeriod);
  }, [user, router, authLoading, timePeriod]);

  useEffect(() => {
    setDays([]);
    setLifetimeDays([]);
    setHistoryComplete(false);
    setLifetimeComplete(false);
  }, [user?.uid]);

  const loadData = async (period: TimePeriod) => {
    try {
      setLoadError(false);
      const start = periodStart(period);
      const [dayData, exerciseData, account] = await Promise.all([
        start
          ? getDaysInRange(start, new Date())
          : listDays({ limit: ALL_HISTORY_LIMIT, order: "desc" }),
        getAllExercises(),
        getAccountSummary(),
      ]);

      setDays(dayData);
      setLifetimeDays((prev) => mergeDays(prev, dayData));
      const complete = daysListIsComplete() || (!start && dayData.length < ALL_HISTORY_LIMIT);
      setHistoryComplete(complete);
      if (!start) setLifetimeComplete(complete);
      setTrackedExerciseIds(account.trackedExercises);
      setUsername(account.username);

      const exerciseMap = new Map<string, ExerciseDoc>();
      exerciseData.forEach((ex: ExerciseDoc) => exerciseMap.set(ex.id, ex));
      setExercises(exerciseMap);
    } catch (error) {
      logger.error("Error loading analytics", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadOlderHistory = async () => {
    try {
      const older = await listDays({ limit: LIFETIME_HISTORY_LIMIT, order: "desc" });
      setDays((prev) => mergeDays(prev, older));
      setLifetimeDays((prev) => mergeDays(prev, older));
      const complete = daysListIsComplete() || older.length < LIFETIME_HISTORY_LIMIT;
      setHistoryComplete(complete);
      setLifetimeComplete(complete);
    } catch (error) {
      logger.error("Error loading older analytics", error);
      toast.error("Could not load older history");
    }
  };

  const filteredDays = useMemo(() => filterDaysByPeriod(days, timePeriod), [days, timePeriod]);
  const summary = useMemo(() => getAnalyticsSummaryFromDays(filteredDays, exercises), [filteredDays, exercises]);
  const catalogList = useMemo(() => Array.from(exercises.values()), [exercises]);
  const historyForLifetime = lifetimeDays.length > 0 ? lifetimeDays : days;

  // PRs and identity helpers need all-time history, not the Month/Year chart window.
  useEffect(() => {
    if (!user || authLoading || lifetimeComplete) return;
    let cancelled = false;
    void listDays({ limit: LIFETIME_HISTORY_LIMIT, order: "desc" })
      .then((older) => {
        if (cancelled) return;
        setLifetimeDays((prev) => mergeDays(prev, older));
        // One page is the PR ceiling for now — stop the loading banner even at the cap.
        setLifetimeComplete(true);
      })
      .catch((error) => {
        logger.error("Error loading lifetime history", error);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, lifetimeComplete]);

  const prs = useMemo(() => {
    if (activeTab !== "prs") return [];
    if (historyForLifetime.length === 0) return [];
    return collapsePRsByExercise(
      findAllPRs(
        historyForLifetime,
        trackedExerciseIds.length > 0 ? trackedExerciseIds : undefined,
        catalogList
      )
    );
  }, [activeTab, historyForLifetime, trackedExerciseIds, catalogList]);

  if (!authLoading && !user) {
    return null;
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "strength", label: "Strength" },
    { id: "cardio", label: "Cardio" },
    { id: "prs", label: "PRs" },
  ];

  const showSpinner = (authLoading || loading) && days.length === 0 && !loadError;
  const showEmpty = !loading && !loadError && days.length === 0 && timePeriod === "all";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      {/* Fixed Header */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="px-4 pt-3 md:px-8">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
            <h1 className="min-w-0 truncate text-xl font-semibold text-gray-900 md:text-2xl">Analytics</h1>
            {activeTab === "prs" ? (
              <p className="shrink-0 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-600">
                All time
              </p>
            ) : (
              <div className="flex shrink-0 rounded-lg bg-gray-100 p-0.5">
                {PERIODS.map((period) => (
                  <button
                    key={period.id}
                    type="button"
                    onClick={() => setTimePeriod(period.id)}
                    aria-label={period.label}
                    aria-current={timePeriod === period.id ? "true" : undefined}
                    className={`rounded px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      timePeriod === period.id
                        ? "bg-brand text-brand-fg"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {period.short}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mx-auto mt-3 flex max-w-4xl">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex-1 border-b-2 py-2.5 text-sm font-semibold transition-colors ${
                    isActive ? "border-brand text-gray-900" : "border-transparent text-gray-500"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 md:px-8 md:max-w-4xl">
          {showSpinner ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="spinner" />
            </div>
          ) : loadError ? (
            <div className="rounded-md border border-gray-100 bg-white p-12 text-center shadow-sm">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Could not load analytics</h2>
              <p className="mb-6 text-gray-500">Check your connection and try again.</p>
              <button
                onClick={() => {
                  setLoading(true);
                  loadData(timePeriod);
                }}
                className="btn-primary rounded-xl px-6"
              >
                Retry
              </button>
            </div>
          ) : showEmpty ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <BarChart3 className="mb-4 h-16 w-16 text-gray-300" />
              <h2 className="mb-2 text-2xl font-bold text-gray-900">No analytics data yet</h2>
              <p className="mb-6 max-w-md text-gray-500">
                Start logging workouts to see your progress and analytics here.
              </p>
              <Link
                href="/day/today"
                prefetch
                className="btn-primary rounded-xl px-6"
              >
                Log your first workout
              </Link>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <OverviewView
                  summary={summary}
                  allDays={historyForLifetime}
                  username={username}
                />
              )}
              {activeTab === "strength" && (
                <StrengthView days={filteredDays} exercises={exercises} timePeriod={timePeriod} />
              )}
              {activeTab === "cardio" && (
                <CardioView days={filteredDays} timePeriod={timePeriod} />
              )}
              {activeTab === "prs" && (
                <PRsView
                  prs={prs}
                  trackingEmpty={trackedExerciseIds.length === 0}
                  lifetimeLoading={!lifetimeComplete}
                />
              )}
              {timePeriod === "all" && activeTab !== "prs" && !historyComplete && days.length > 0 && (
                <button
                  type="button"
                  onClick={() => void loadOlderHistory()}
                  className="btn-secondary mt-6 w-full"
                >
                  Load older history
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Overview Component
function OverviewView({
  summary,
  allDays,
  username,
}: {
  summary: AnalyticsSummary;
  allDays: Day[];
  username: string | null;
}) {
  const { units, trackBodyweight } = usePreferences();
  const [sharing, setSharing] = useState(false);
  const weighIns = useMemo(() => getBodyweightPoints(allDays), [allDays]);
  const weightChange = getBodyweightChangeLbs(weighIns);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDates = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const trained = new Set(
    allDays.filter((d) => !d.isRestDay && d.exercises.length > 0).map((d) => d.date)
  );
  const trainedThisWeek = weekDates.filter((date) => trained.has(format(date, "yyyy-MM-dd"))).length;

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const result = await shareWeekPng(allDays, username, units);
      if (result === "previewed") {
        toast.success("Opened image — long-press to save");
      }
    } catch (error) {
      logger.error("Share week failed", error);
      toast.error("Could not create that image");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Dumbbell}
          label="Workouts"
          value={summary.totalWorkouts.toString()}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={`${summary.currentStreak}d`}
          color="bg-orange-100 text-orange-700"
        />
        <StatCard
          icon={TrendingUp}
          label="Volume"
          value={formatWeight(summary.totalVolume, units)}
          color="bg-purple-100 text-purple-700"
        />
      </div>

      <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">This week</p>
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">{trainedThisWeek} of 7 days with work</p>
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-semibold text-gray-800 disabled:opacity-50"
              aria-label="Share this week as an image"
              disabled={sharing}
              onClick={() => void handleShare()}
            >
              <Share className="h-4 w-4" />
              {sharing ? "Sharing…" : "Share"}
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {weekDates.map((date) => {
            const key = format(date, "yyyy-MM-dd");
            const didTrain = trained.has(key);
            const isToday = key === format(new Date(), "yyyy-MM-dd");
            return (
              <Link
                key={key}
                href={`/day/${key}`}
                prefetch
                className="flex flex-1 flex-col items-center gap-1"
              >
                <span className="text-xs text-gray-500">{format(date, "EEEEE")}</span>
                <div
                  className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-semibold ${
                    didTrain
                      ? "bg-brand text-brand-fg"
                      : isToday
                        ? "border border-gray-300 text-gray-700"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {format(date, "d")}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      {trackBodyweight && weighIns.length === 0 && (
        <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Bodyweight</p>
          <p className="mt-1 text-sm text-gray-500">
            Log a weigh-in on any day. Trends show up here after two readings.
          </p>
        </div>
      )}
      {trackBodyweight && weighIns.length > 0 && (
        <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Bodyweight</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatWeight(weighIns[weighIns.length - 1].bodyweightLbs, units)}
              </p>
            </div>
            {weightChange != null && (
              <p className={`text-sm font-semibold ${weightChange <= 0 ? "text-success-fg" : "text-gray-700"}`}>
                {weightChange > 0 ? "+" : ""}
                {formatWeight(Math.abs(weightChange), units)}
                {weightChange > 0 ? " up" : weightChange < 0 ? " down" : ""}
                <span className="font-normal text-gray-500"> · {weighIns.length} weigh-ins</span>
              </p>
            )}
          </div>
          <BodyweightSparkline points={weighIns} />
        </div>
      )}
    </div>
  );
}

// Strength View Component
function StrengthView({
  days,
  exercises,
  timePeriod,
}: {
  days: Day[];
  exercises: Map<string, ExerciseDoc>;
  timePeriod: TimePeriod;
}) {
  const strengthAnalytics = useMemo(
    () => getStrengthAnalytics(days, exercises, timePeriod),
    [days, exercises, timePeriod]
  );
  const { units } = usePreferences();
  const lifts = strengthAnalytics.exercisesByFrequency;
  const PREVIEW = 10;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setExpandedId(null);
    setShowAll(false);
  }, [timePeriod]);

  const visibleLifts = showAll || lifts.length <= PREVIEW ? lifts : lifts.slice(0, PREVIEW);
  const hiddenCount = lifts.length - visibleLifts.length;

  if (strengthAnalytics.totalVolume === 0 && lifts.length === 0) {
    return (
      <div className="rounded-md border border-gray-100 bg-white p-12 text-center shadow-sm">
        <Dumbbell className="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p className="font-medium text-gray-900">No strength work in this period</p>
        <p className="mt-1 text-sm text-gray-500">Log barbell or machine sets to see volume here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
        <StatRow label="Volume" value={formatWeight(strengthAnalytics.totalVolume, units)} />
        <StatRow
          label="Lifts"
          value={`${lifts.length} exercise${lifts.length === 1 ? "" : "s"}`}
        />
      </div>

      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-700">In this period</h2>
        <p className="mb-3 text-sm text-gray-500">Most logged first. Tap a row for the trend.</p>
        <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
          {visibleLifts.map((exercise, idx) => {
            const isOpen = expandedId === exercise.exerciseId;
            const progress = isOpen ? getLiftProgress(days, exercise.exerciseId) : null;
            const delta = progress?.delta;
            const lastDay =
              progress?.last?.dayId.includes("_")
                ? progress.last.dayId.slice(progress.last.dayId.indexOf("_") + 1)
                : progress?.last?.date;

            return (
              <div
                key={exercise.exerciseId}
                className={idx < visibleLifts.length - 1 ? "border-b border-gray-100" : ""}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setExpandedId((prev) => (prev === exercise.exerciseId ? null : exercise.exerciseId))
                  }
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">
                      <ExerciseNameLabel name={exercise.name} />
                    </p>
                    <p className="text-sm text-gray-500">
                      {exercise.count} session{exercise.count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="ml-3 text-right">
                    <p className="text-lg font-bold tabular-nums text-gray-900">
                      {formatWeight(exercise.maxWeight, units)}
                    </p>
                    <p className="text-xs text-gray-400">Best in period</p>
                  </div>
                </button>
                {isOpen && progress?.last && (
                  <div className="border-t border-gray-50 bg-gray-50 px-5 py-4">
                    <div className="mb-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-2xl font-bold tabular-nums text-gray-900">
                          {formatWeight(progress.last.weight, units)}
                        </p>
                        <p className="text-sm text-gray-500">Last working set</p>
                      </div>
                      {delta != null && (
                        <p
                          className={`text-sm font-semibold ${
                            delta > 0 ? "text-success-fg" : delta < 0 ? "text-gray-700" : "text-gray-500"
                          }`}
                        >
                          {delta > 0 ? "+" : ""}
                          {formatWeight(Math.abs(delta), units)}
                          {delta === 0 ? " same" : " vs prior session"}
                        </p>
                      )}
                    </div>
                    <WeightSparkline points={progress.points.map((point) => point.weight)} />
                    {lastDay && (
                      <Link
                        href={`/day/${lastDay}`}
                        prefetch
                        className="mt-3 inline-block text-sm font-semibold text-gray-800"
                      >
                        Open that day
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full border-t border-gray-100 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Show {hiddenCount} more
            </button>
          )}
          {showAll && lifts.length > PREVIEW && (
            <button
              type="button"
              onClick={() => {
                setShowAll(false);
                setExpandedId(null);
              }}
              className="w-full border-t border-gray-100 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Show less
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Cardio View Component
function CardioView({
  days,
  timePeriod,
}: {
  days: Day[];
  timePeriod: TimePeriod;
}) {
  const cardioAnalytics = useMemo(() => getCardioAnalytics(days, timePeriod), [days, timePeriod]);
  const { units } = usePreferences();
  const [selectedType, setSelectedType] = useState<CardioActivityType | "all">("all");

  const types = cardioAnalytics.byType;
  const activeType: CardioTypeStats | undefined =
    selectedType === "all" ? undefined : types.find((t) => t.type === selectedType);

  if (cardioAnalytics.sessions === 0) {
    return (
      <div className="rounded-md border border-gray-100 bg-white p-8 text-center shadow-sm">
        <Heart className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="font-medium text-gray-900">No cardio in this period</p>
        <p className="mt-1 text-sm text-gray-500">
          Log a run, walk, bike, or row from the day view. Types stay separate so pace stays honest.
        </p>
      </div>
    );
  }

  const showChips = types.length > 1;
  const detail = types.length === 1 ? types[0] : activeType;

  return (
    <div className="space-y-6">
      {showChips && (
        <div className="flex flex-wrap gap-2">
          <TypeChip
            label="All"
            selected={selectedType === "all"}
            onClick={() => setSelectedType("all")}
          />
          {types.map((t) => (
            <TypeChip
              key={t.type}
              label={CARDIO_ACTIVITY_LABELS[t.type]}
              selected={selectedType === t.type}
              onClick={() => setSelectedType(t.type)}
            />
          ))}
        </div>
      )}

      {!detail && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Heart}
              label="Sessions"
              value={String(cardioAnalytics.sessions)}
              color="bg-red-100 text-red-700"
            />
            <StatCard
              icon={Clock}
              label="Total time"
              value={formatCardioDuration(cardioAnalytics.totalDuration)}
              color="bg-orange-100 text-orange-700"
            />
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-700">By type</h2>
            <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
              {types.map((t, idx) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setSelectedType(t.type)}
                  className={`flex w-full items-center justify-between px-5 py-4 text-left ${
                    idx < types.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div>
                    <p className="font-semibold text-gray-900">{CARDIO_ACTIVITY_LABELS[t.type]}</p>
                    <p className="text-sm text-gray-500">
                      {t.sessions} session{t.sessions === 1 ? "" : "s"} · {formatCardioDuration(t.totalDuration)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {t.totalDistance > 0 ? formatDistance(t.totalDistance, units) : "—"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {detail && <CardioTypeDetail stats={detail} units={units} />}
    </div>
  );
}

function TypeChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        selected ? "bg-brand text-brand-fg" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

function CardioTypeDetail({
  stats,
  units,
}: {
  stats: CardioTypeStats;
  units: "metric" | "imperial";
}) {
  const kind = cardioPaceKind(stats.type);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Time"
          value={formatCardioDuration(stats.totalDuration)}
          color="bg-orange-100 text-orange-700"
        />
        <StatCard
          icon={MapIcon}
          label="Distance"
          value={stats.totalDistance > 0 ? formatDistance(stats.totalDistance, units) : "—"}
          color="bg-red-100 text-red-700"
        />
        {kind === "pace" && (
          <>
            <StatCard
              icon={Gauge}
              label="Avg pace"
              value={formatPace(stats.averagePace || 0, units)}
              hint={formatPaceAsSpeed(stats.averagePace || 0, units) ?? undefined}
              color="bg-pink-100 text-pink-700"
            />
            <StatCard
              icon={Trophy}
              label="Best pace"
              value={formatPace(stats.bestPace || 0, units)}
              hint={formatPaceAsSpeed(stats.bestPace || 0, units) ?? undefined}
              color="bg-yellow-100 text-yellow-700"
            />
          </>
        )}
        {kind === "speed" && (
          <>
            <StatCard
              icon={Gauge}
              label="Avg speed"
              value={formatSpeed(stats.averageSpeed || 0, units)}
              color="bg-pink-100 text-pink-700"
            />
            <StatCard
              icon={Trophy}
              label="Top speed"
              value={formatSpeed(stats.bestSpeed || 0, units)}
              color="bg-yellow-100 text-yellow-700"
            />
          </>
        )}
        {kind === "none" && (
          <StatCard
            icon={Heart}
            label="Sessions"
            value={String(stats.sessions)}
            color="bg-red-100 text-red-700"
          />
        )}
        {stats.longestDuration > 0 && (
          <StatCard
            icon={Clock}
            label="Longest"
            value={formatCardioDuration(stats.longestDuration)}
            color="bg-orange-100 text-orange-700"
          />
        )}
      </div>

      {stats.exercises.length > 1 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-700">Exercises</h2>
          <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
            {stats.exercises.map((exercise, idx) => (
              <div
                key={exercise.exerciseId}
                className={`px-5 py-4 ${idx < stats.exercises.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{exercise.name}</p>
                    <p className="text-sm text-gray-500">
                      {exercise.count} session{exercise.count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCardioDuration(exercise.totalDuration)}
                    </p>
                    {exercise.totalDistance > 0 && (
                      <p className="text-xs text-gray-400">{formatDistance(exercise.totalDistance, units)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// PRs View Component
function PRsView({
  prs,
  trackingEmpty,
  lifetimeLoading,
}: {
  prs: ExercisePR[];
  trackingEmpty: boolean;
  lifetimeLoading: boolean;
}) {
  const { units } = usePreferences();

  const groupedPRs = useMemo(() => {
    const strength = prs.filter((p) => p.modality === "strength");
    const cardio = prs.filter((p) => p.modality === "cardio");
    const calisthenics = prs.filter((p) => p.modality === "calisthenics");
    return { strength, cardio, calisthenics };
  }, [prs]);

  const formatPRValue = (pr: ExercisePR): string => {
    if (pr.prType === "maxWeight") return formatWeight(pr.value, units);
    if (pr.prType === "maxDistance") return formatDistance(pr.value, units);
    if (pr.prType === "maxDuration") return formatCardioDuration(pr.value);
    if (pr.prType === "bestPace") return formatPace(pr.value, units);
    return `${formatGroupedNumber(pr.value, 0)}${pr.prType === "maxReps" ? " reps" : ""}`;
  };

  const formatPRHint = (pr: ExercisePR): string | undefined => {
    if (pr.prType !== "bestPace") return undefined;
    return formatPaceAsSpeed(pr.value, units) ?? undefined;
  };

  const getDateFromDayId = (dayId: string): string => {
    const firstUnderscoreIndex = dayId.indexOf("_");
    if (firstUnderscoreIndex >= 0) return dayId.substring(firstUnderscoreIndex + 1);
    return dayId;
  };

  const PRSection = ({ title, prs: sectionPRs }: { title: string; prs: ExercisePR[] }) => {
    if (sectionPRs.length === 0) return null;
    return (
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-700">{title}</h2>
        <div className="overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm">
          {sectionPRs.map((pr, idx) => {
            const dateStr = getDateFromDayId(pr.dayId);
            const speedHint = formatPRHint(pr);
            return (
              <Link
                key={`${pr.dayId}-${pr.exerciseId}-${pr.prType}`}
                href={`/day/${dateStr}`}
                prefetch
                className={`block w-full px-5 py-4 text-left transition-colors hover:bg-gray-50 ${
                  idx < sectionPRs.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">
                      <ExerciseNameLabel name={pr.exerciseName} />
                    </p>
                    <p className="text-sm text-gray-500">{prTypeLabel(pr.prType)}</p>
                  </div>
                  <div className="ml-3 text-right">
                    <p className="text-lg font-bold tabular-nums text-gray-900">{formatPRValue(pr)}</p>
                    {speedHint ? <p className="text-xs tabular-nums text-gray-500">{speedHint}</p> : null}
                    <p className="text-xs text-gray-400">{pr.date.toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {lifetimeLoading ? (
        <p className="text-sm text-gray-500">Loading full history…</p>
      ) : null}
      {trackingEmpty && prs.length > 0 && (
        <p className="rounded-md border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600">
          Showing every lift with a best.{" "}
          <Link href="/settings" className="font-semibold text-gray-900">
            My exercises
          </Link>{" "}
          can shorten this list — it does not change Strength or Cardio.
        </p>
      )}
      {prs.length === 0 && !lifetimeLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-center text-gray-500">No personal records yet</p>
          <Link href="/settings" className="mt-3 text-sm font-semibold text-gray-800">
            Choose lifts in My exercises
          </Link>
        </div>
      ) : prs.length > 0 ? (
        <>
          <PRSection title="Strength" prs={groupedPRs.strength} />
          <PRSection title="Cardio" prs={groupedPRs.cardio} />
          <PRSection title="Calisthenics" prs={groupedPRs.calisthenics} />
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  /** Optional second line when the card has spare space (e.g. mph under pace). */
  hint?: string;
  color: string;
}) {
  return (
    <div className="rounded-md border border-gray-100 bg-white p-3 shadow-sm">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mb-0.5 text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold tabular-nums text-gray-900">{value}</p>
      {hint ? <p className="text-xs tabular-nums text-gray-500">{hint}</p> : null}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
      <p className="text-gray-600">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function WeightSparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const width = 320;
  const height = 64;
  const pad = 4;
  const coords = points.map((value, index) => {
    const x = pad + (index / Math.max(points.length - 1, 1)) * (width - pad * 2);
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full text-brand" role="img" aria-label="Lift trend">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={coords.join(" ")}
      />
    </svg>
  );
}

function BodyweightSparkline({ points }: { points: { date: string; bodyweightLbs: number }[] }) {
  if (points.length === 0) return null;
  const values = points.map((point) => point.bodyweightLbs);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const width = 320;
  const height = 64;
  const pad = 4;
  const coords = values.map((value, index) => {
    const x = pad + (index / Math.max(values.length - 1, 1)) * (width - pad * 2);
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full text-brand" role="img" aria-label="Bodyweight trend">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={coords.join(" ")}
      />
    </svg>
  );
}
