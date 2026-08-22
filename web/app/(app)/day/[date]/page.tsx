"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO, isValid, differenceInDays, addDays, subDays } from "date-fns";
import { useAuth } from "../../../../providers/Auth";
import {
  getDayByDate,
  createDay,
  updateDay,
  listDays,
  getDaysInRange,
  Day,
} from "../../../../lib/firestore/days";
import { accountService } from "../../../../lib/firebase";
import { type DayStatus } from "@liftledger/shared";
import type { Exercise } from "../../../../lib/firestore/workouts";
import type { StrengthSet } from "../../../../components/StrengthSetInput";
import type { CalisthenicsSet } from "../../../../components/CalisthenicsSetInput";
import type { CardioData } from "../../../../components/CardioInput";
import {
  createTemplate,
  cloneExercisesForTemplate,
  listTemplates,
  type WorkoutTemplate,
} from "../../../../lib/firestore/workoutTemplates";
import DayNavigation from "../../../../components/DayNavigation";
import { Trash2, Dumbbell, Heart, Activity, Pencil, Plus, Moon, FileText, Upload, Link2, Unlink, MoreHorizontal, X, Bandage, History } from "lucide-react";
import { usePreferences } from "../../../../lib/hooks/usePreferences";
import { formatWeight, formatDistance, formatCardioDuration, formatWeightInput, formatDistanceInput, toStoredWeight, toStoredDistance } from "../../../../lib/utils/units";
import { toast } from "../../../../lib/toast";
import { logger } from "../../../../lib/logger";
import { DayNavigationSkeleton, ExerciseListSkeleton } from "../../../../components/LoadingSkeleton";
import { SyncStatusIndicator, useSyncStatus } from "../../../../components/SyncStatus";
import {
  rememberExercises,
  rememberLastWorkout,
  getCachedLastExercise,
  getCachedLastWorkout,
  hydrateCacheFromDays,
} from "../../../../lib/lastExerciseCache";
import {
  daysListCovers,
  peekDay,
  peekDaysArray,
} from "../../../../lib/sessionCache";
import {
  analyzeProgress,
  extractExerciseHistory,
  shouldFetchInsight,
  isNewPR,
  getMetricName,
  inferCardioActivityType,
  resolveCardioActivityType,
  CARDIO_ACTIVITY_LABELS,
  type CardioActivityType,
} from "@liftledger/shared";

const composerFallback = () => <div className="h-24 animate-pulse rounded-xl bg-gray-100" />;

const ExerciseSearch = dynamic(() => import("../../../../components/ExerciseSearch"), {
  ssr: false,
  loading: () => <div className="h-14 animate-pulse rounded-xl bg-gray-100" />,
});
const StrengthSetInput = dynamic(() => import("../../../../components/StrengthSetInput"), {
  ssr: false,
  loading: composerFallback,
});
const CalisthenicsSetInput = dynamic(() => import("../../../../components/CalisthenicsSetInput"), {
  ssr: false,
  loading: composerFallback,
});
const CardioInput = dynamic(() => import("../../../../components/CardioInput"), {
  ssr: false,
  loading: composerFallback,
});
const RestTimer = dynamic(
  () => import("../../../../components/RestTimer").then((mod) => mod.RestTimer),
  { ssr: false }
);
const ConfirmDialog = dynamic(
  () => import("../../../../components/ConfirmDialog").then((mod) => mod.ConfirmDialog),
  { ssr: false }
);
const TemplatePicker = dynamic(
  () => import("../../../../components/TemplatePicker").then((mod) => mod.TemplatePicker),
  { ssr: false }
);

type SelectedExercise = {
  id: string;
  name: string;
  modality: "strength" | "cardio" | "calisthenics";
};

function formatLastHint(
  exercise: Exercise | null,
  units: "metric" | "imperial"
): string | null {
  if (!exercise) return null;
  if (exercise.modality === "strength" && exercise.strengthSets && exercise.strengthSets.length > 0) {
    const last = exercise.strengthSets[exercise.strengthSets.length - 1];
    return `Last: ${exercise.strengthSets.length} set${exercise.strengthSets.length === 1 ? "" : "s"}, last ${last.reps} × ${formatWeight(last.weight, units)}`;
  }
  if (exercise.modality === "cardio" && exercise.cardioData) {
    const dist = exercise.cardioData.distance
      ? ` • ${formatDistance(exercise.cardioData.distance, units)}`
      : "";
    return `Last: ${formatCardioDuration(exercise.cardioData.duration)}${dist}`;
  }
  if (exercise.modality === "calisthenics" && exercise.calisthenicsSets && exercise.calisthenicsSets.length > 0) {
    const last = exercise.calisthenicsSets[exercise.calisthenicsSets.length - 1];
    return `Last: ${last.reps} reps`;
  }
  return null;
}

export default function DayView() {
  const params = useParams();
  const dateParam = params.date as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [day, setDay] = useState<Day | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const currentDateRef = useRef("");

  const [selectedExercise, setSelectedExercise] = useState<SelectedExercise | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [strengthSets, setStrengthSets] = useState<StrengthSet[]>([{ reps: "10", weight: "135" }]);
  const [cardioData, setCardioData] = useState<CardioData>({ duration: "30", distance: "" });
  const [cardioActivityType, setCardioActivityType] = useState<CardioActivityType>("other");
  const [calisthenicsSets, setCalisthenicsSets] = useState<CalisthenicsSet[]>([{ reps: "10" }]);

  const { units, restTimerSeconds } = usePreferences();
  const [localToday, setLocalToday] = useState<string | null>(null);

  useEffect(() => {
    setLocalToday(format(new Date(), "yyyy-MM-dd"));
  }, []);
  const { showSyncing } = useSyncStatus();

  const [allDays, setAllDays] = useState<Day[]>([]);
  const [nearbyDays, setNearbyDays] = useState<Day[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showDayMenu, setShowDayMenu] = useState(false);
  const [dayMenuPos, setDayMenuPos] = useState({ top: 0, right: 16 });
  const dayMenuRef = useRef<HTMLDivElement>(null);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [resting, setResting] = useState(false);
  const [restKey, setRestKey] = useState(0);
  const [lastHint, setLastHint] = useState<string | null>(null);
  const [exerciseToRemove, setExerciseToRemove] = useState<number | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRest = () => {
    if (restTimerSeconds <= 0) return;
    setRestKey((key) => key + 1);
    setResting(true);
  };

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const beginSave = () => {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    return true;
  };

  const endSave = () => {
    savingRef.current = false;
    setSaving(false);
  };

  const applyDayIfCurrent = (next: Day) => {
    if (currentDateRef.current === next.date) setDay(next);
  };

  const resetComposer = () => {
    setSelectedExercise(null);
    setEditingIndex(null);
    setLastHint(null);
    setShowTemplateSelector(false);
    setStrengthSets([{ reps: "10", weight: formatWeightInput(135, units) }]);
    setCardioData({ duration: "30", distance: "" });
    setCardioActivityType("other");
    setCalisthenicsSets([{ reps: "10" }]);
  };

  const loadTemplates = async () => {
    try {
      const templateList = await listTemplates();
      setTemplates(templateList);
    } catch (error) {
      logger.error("Failed to load templates", error);
      toast.error("Failed to load templates");
    }
  };

  useEffect(() => {
    if (!showDayMenu) return;
    const onPointer = (event: MouseEvent) => {
      if (dayMenuRef.current && !dayMenuRef.current.contains(event.target as Node)) {
        setShowDayMenu(false);
      }
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [showDayMenu]);

  // Helper to clean exercise data (remove undefined values)
  const cleanExercise = (ex: Exercise): Exercise => {
    const cleaned: any = {
      exerciseId: ex.exerciseId,
      name: ex.name,
      modality: ex.modality,
    };
    if (ex.importId) cleaned.importId = ex.importId;
    if (ex.supersetGroup) cleaned.supersetGroup = ex.supersetGroup;
    
    // Clean strength sets
    if (ex.strengthSets && Array.isArray(ex.strengthSets)) {
      cleaned.strengthSets = ex.strengthSets.map((set: any) => {
        const cleanSet: any = { reps: set.reps, weight: set.weight };
        if (set.warmup) cleanSet.warmup = true;
        return cleanSet;
      });
    }
    
    // Clean cardio data
    if (ex.cardioData) {
      const cleanCardio: any = { duration: ex.cardioData.duration };
      if (ex.cardioData.distance !== undefined && ex.cardioData.distance !== null) {
        cleanCardio.distance = ex.cardioData.distance;
      }
      if (ex.cardioData.pace !== undefined && ex.cardioData.pace !== null) {
        cleanCardio.pace = ex.cardioData.pace;
      }
      if (ex.cardioData.activityType) {
        cleanCardio.activityType = ex.cardioData.activityType;
      }
      cleaned.cardioData = cleanCardio;
    }
    
    // Clean calisthenics sets
    if (ex.calisthenicsSets && Array.isArray(ex.calisthenicsSets)) {
      cleaned.calisthenicsSets = ex.calisthenicsSets.map((set: any) => {
        const cleanSet: any = { reps: set.reps };
        if (set.duration !== undefined && set.duration !== null) {
          cleanSet.duration = set.duration;
        }
        if (set.addedWeight !== undefined && set.addedWeight !== null) {
          cleanSet.addedWeight = set.addedWeight;
        }
        return cleanSet;
      });
    }
    
    return cleaned as Exercise;
  };

  const loadTemplate = async (template: WorkoutTemplate, mode: "append" | "replace") => {
    if (!template.exercises || template.exercises.length === 0) {
      toast.error("Template has no exercises");
      return;
    }
    if (!beginSave()) return;

    showSyncing(true);
    try {
      const currentDay = await ensureDayExists();
      const existingExercises = currentDay.exercises || [];
      const templateExercises = template.exercises.map(cleanExercise);
      const nextExercises =
        mode === "replace" ? templateExercises : [...existingExercises, ...templateExercises];

      if (currentDay.id) {
        await updateDay(currentDay.id, { exercises: nextExercises, isRestDay: false });
        applyDayIfCurrent({ ...currentDay, exercises: nextExercises, isRestDay: false });
        toast.success(mode === "replace" ? `Replaced with ${template.name}` : `Added ${template.name}`);
      }
      setShowTemplateSelector(false);
      showSyncing(false);
    } catch (error) {
      logger.error("Failed to load template", error);
      toast.error("Failed to load template");
      showSyncing(false);
    } finally {
      endSave();
    }
  };

  const saveCurrentAsTemplate = async (name: string) => {
    const exercises = day?.date === currentDate ? day.exercises : [];
    if (!exercises.length) {
      toast.error("Log at least one exercise first");
      return;
    }
    try {
      await createTemplate({
        name,
        exercises: cloneExercisesForTemplate(exercises),
      });
      toast.success(`Saved “${name}”`);
      await loadTemplates();
    } catch (error) {
      logger.error("Failed to save template", error);
      toast.error("Could not save template");
    }
  };

  const repeatLastWorkout = async () => {
    if (!user) return;
    if (!beginSave()) return;

    const cached = getCachedLastWorkout(user.uid);
    const fromRecent = allDays.find(
      (item) => item.date !== currentDate && !item.isRestDay && item.exercises.length > 0
    );
    let source =
      cached && cached.date !== currentDate && cached.exercises.length > 0
        ? cached
        : fromRecent
          ? { date: fromRecent.date, exercises: fromRecent.exercises }
          : null;

    if (!source) {
      try {
        const older = await listDays({ limit: 180, order: "desc" });
        const found = older.find(
          (item) => item.date !== currentDate && !item.isRestDay && item.exercises.length > 0
        );
        if (found) source = { date: found.date, exercises: found.exercises };
      } catch (error) {
        logger.warn("Failed to search older workouts", error);
      }
    }

    if (!source) {
      toast.error("No previous workout to copy yet");
      endSave();
      return;
    }

    showSyncing(true);
    try {
      const currentDay = await ensureDayExists();
      const nextExercises = [
        ...(currentDay.exercises || []).map(cleanExercise),
        ...source.exercises.map(cleanExercise),
      ];
      if (currentDay.id) {
        await updateDay(currentDay.id, { exercises: nextExercises });
        applyDayIfCurrent({ ...currentDay, exercises: nextExercises });
        rememberExercises(user.uid, source.exercises);
        rememberLastWorkout(user.uid, currentDay.date, nextExercises);
        toast.success(`Copied workout from ${source.date}`);
      }
      showSyncing(false);
    } catch (error) {
      logger.error("Failed to repeat last workout", error);
      toast.error("Failed to copy last workout");
      showSyncing(false);
    } finally {
      endSave();
    }
  };

  useEffect(() => {
    if (showTemplateSelector) {
      loadTemplates();
    }
  }, [showTemplateSelector]);

  // Normalize date param to YYYY-MM-DD
  const getCurrentDate = (): string => {
    if (dateParam === "today") {
      return localToday ?? "";
    }
    // Validate date format
    const parsed = parseISO(dateParam);
    if (!isValid(parsed)) {
      return localToday ?? "";
    }
    return format(parsed, "yyyy-MM-dd");
  };

  const currentDate = getCurrentDate();
  currentDateRef.current = currentDate;

  useEffect(() => {
    if (authLoading) return;
    if (!currentDate) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    let mounted = true;
    resetComposer();
    const cached = peekDay(currentDate);
    if (cached !== undefined) {
      setDay(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const today = format(new Date(), "yyyy-MM-dd");
    [-1, 1, -2, 2].forEach((offset) => {
      const neighbor = format(addDays(parseISO(currentDate), offset), "yyyy-MM-dd");
      if (neighbor <= today) router.prefetch(`/day/${neighbor}`);
    });

    (async () => {
      const start = format(subDays(parseISO(currentDate), 3), "yyyy-MM-dd");
      const end = format(addDays(parseISO(currentDate), 3), "yyyy-MM-dd");
      const needRecent = peekDaysArray().length < 20;
      try {
        const [d, nearby, recent] = await Promise.all([
          getDayByDate(currentDate),
          getDaysInRange(start, end).catch((error) => {
            logger.warn("Failed to load nearby days", error);
            return [] as Day[];
          }),
          needRecent
            ? listDays({ limit: 20, order: "desc" }).catch((error) => {
                logger.warn("Failed to load recent days", error);
                return [] as Day[];
              })
            : Promise.resolve(peekDaysArray().slice(0, 20)),
        ]);
        if (!mounted) return;
        setDay(d);
        setNearbyDays(nearby);
        setAllDays(recent);
        setLoading(false);
        hydrateCacheFromDays(user.uid, recent, currentDate);
      } catch (error) {
        logger.error("Failed to load day", error);
        if (mounted) {
          toast.error("Failed to load day. Please try again.");
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentDate, user, router, authLoading]);

  const handleDateChange = (newDate: string) => {
    router.push(`/day/${newDate}`);
  };

  const handleTodayClick = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    router.push(`/day/${today}`);
  };

  const getLastExerciseData = (days: Day[], exerciseId: string): Exercise | null => {
    const sortedDays = [...days].sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    for (const day of sortedDays) {
      const exercise = day.exercises.find(
        (ex) => (ex.exerciseId || ex.name) === exerciseId
      );
      if (exercise) {
        return exercise;
      }
    }
    return null;
  };

  /**
   * Fetch and display progress insight for an exercise
   * Called asynchronously after exercise is saved
   */
  const fetchAndDisplayInsight = async (exercise: Exercise, allDays: Day[]) => {
    try {
      // Use exerciseId if available, otherwise use name
      // This must match how extractExerciseHistory matches exercises
      const exerciseId = exercise.exerciseId || exercise.name;
      const modality = exercise.modality;

      if (!modality || (modality !== "strength" && modality !== "cardio" && modality !== "calisthenics")) {
        logger.warn(`[Insights] Invalid modality for ${exercise.name}: ${modality}`);
        return; // Invalid modality
      }

      const hasDistance = modality === "cardio" && exercise.cardioData?.distance !== undefined && exercise.cardioData.distance > 0;
      let historyDays = allDays;
      const cachedHistory = peekDaysArray();
      if (daysListCovers(200) || cachedHistory.length >= 200) {
        const byId = new Map<string, Day>();
        cachedHistory.forEach((d) => byId.set(d.id || d.date, d));
        allDays.forEach((d) => byId.set(d.id || d.date, d));
        historyDays = Array.from(byId.values());
      } else {
        try {
          const deepHistory = await listDays({ limit: 200, order: "desc" });
          const byId = new Map<string, Day>();
          deepHistory.forEach((d) => byId.set(d.id || d.date, d));
          allDays.forEach((d) => byId.set(d.id || d.date, d));
          historyDays = Array.from(byId.values());
        } catch (error) {
          logger.warn("Could not load extra history for insights", error);
        }
      }
      const history = extractExerciseHistory(
        historyDays,
        exerciseId,
        modality,
        modality === "cardio" ? { cardioMetric: hasDistance ? "distance" : "duration" } : undefined
      );

      if (history.length === 0) {
        logger.warn(`[Insights] No history found for ${exercise.name} (id: ${exerciseId}, modality: ${modality})`);
        return; // No history available
      }

      // Check if we should fetch insights
      const isPR = isNewPR(history);
      const meetsMinReqs = shouldFetchInsight(history);
      const shouldFetch = meetsMinReqs || isPR;

      if (!shouldFetch) {
        // Log why requirements aren't met for debugging
        if (history.length > 0) {
          const firstDate = parseISO(history[0].date);
          const latestDate = parseISO(history[history.length - 1].date);
          const daysDiff = Math.abs(differenceInDays(latestDate, firstDate));
          logger.info(`[Insights] Requirements not met for ${exercise.name}: history=${history.length}, isPR=${isPR}, meetsMinReqs=${meetsMinReqs}, daysSpan=${daysDiff}`);
        } else {
          logger.info(`[Insights] Requirements not met for ${exercise.name}: history=${history.length}, isPR=${isPR}, meetsMinReqs=${meetsMinReqs}`);
        }
        return; // Don't fetch if requirements not met
      }

      logger.info(`[Insights] Computing insight for ${exercise.name}: history=${history.length}, isPR=${isPR}`);

      const metric = getMetricName(modality, hasDistance);
      const insight = analyzeProgress({
        exercise: exercise.name,
        metric,
        history,
      });
      const delay = insight.isNewPR ? 1000 : 2000;
      setTimeout(() => {
        displayInsight(insight, metric);
        logger.info(`[Insights] Successfully displayed insight for ${exercise.name}`);
      }, delay);
    } catch (error) {
      // Handle any synchronous errors (shouldn't happen, but be safe)
      if (error instanceof Error) {
        logger.error(`[Insights] Unexpected error for ${exercise.name}:`, error.message);
      }
    }
  };

  /**
   * Convert stored magnitudes in insight copy (lbs / miles / seconds) to the user's units.
   */
  const formatInsightText = (text: string, metric: string): string => {
    const numberThenWord = (word: string) =>
      new RegExp(`(-?\\d+(?:\\.\\d+)?)\\s+${word}\\b`, "gi");

    if (metric === "weight") {
      return text.replace(numberThenWord("weight"), (_, raw) =>
        formatWeight(Number(raw), units)
      );
    }
    if (metric === "distance") {
      return text.replace(numberThenWord("distance"), (_, raw) =>
        formatDistance(Number(raw), units)
      );
    }
    if (metric === "duration") {
      return text.replace(numberThenWord("duration"), (_, raw) =>
        formatCardioDuration(Number(raw))
      );
    }
    if (metric === "reps") {
      return text.replace(numberThenWord("reps"), (_, raw) => {
        const n = Number(raw);
        return `${n} rep${n === 1 ? "" : "s"}`;
      });
    }
    return text;
  };

  /**
   * Display insight as toast notification
   */
  const displayInsight = (insight: { isNewPR: boolean; insightText: string }, metric: string) => {
    if (!insight.insightText || insight.insightText.trim() === "") {
      logger.warn(`[Insights] Attempted to display insight with empty text`);
      return;
    }
    
    // Format the text with proper units
    const formattedText = formatInsightText(insight.insightText, metric);
    
    logger.info(`[Insights] Displaying toast: isPR=${insight.isNewPR}, text="${formattedText.substring(0, 50)}..."`);
    
    if (insight.isNewPR) {
      // PR insights get success toast (8 seconds - shorter since they're exciting and easy to read)
      toast.success(formattedText, 8000);
    } else {
      // Regular insights get info toast (15 seconds - longer since they're more detailed and harder to read)
      toast.info(formattedText, 15000);
    }
  };

  const startEditingExercise = (idx: number) => {
    if (!day) return;
    const ex = day.exercises[idx];
    if (!ex) return;

    setEditingIndex(idx);
    setSelectedExercise({
      id: ex.exerciseId ?? "",
      name: ex.name,
      modality: ex.modality,
    });

    if (ex.modality === "strength") {
      setStrengthSets(
        ex.strengthSets?.map((s) => ({
          reps: String(s.reps),
          weight: formatWeightInput(s.weight, units),
          warmup: Boolean(s.warmup),
        })) ?? [{ reps: "10", weight: formatWeightInput(135, units) }]
      );
    } else if (ex.modality === "cardio") {
      setCardioActivityType(resolveCardioActivityType(ex.cardioData?.activityType, ex.name, ex.exerciseId));
      setCardioData({
        duration: ex.cardioData ? String(Math.round(ex.cardioData.duration / 60)) : "",
        distance: ex.cardioData?.distance != null ? formatDistanceInput(ex.cardioData.distance, units) : "",
      });
    } else {
      setCalisthenicsSets(
        ex.calisthenicsSets?.map((s) => ({
          reps: String(s.reps),
          duration: s.duration != null ? String(s.duration) : "",
          addedWeight: s.addedWeight != null ? formatWeightInput(s.addedWeight, units) : "",
        })) ?? [{ reps: "10" }]
      );
    }
    setAddSheetOpen(true);
    window.requestAnimationFrame(() => {
      document.getElementById("log-composer")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  };

  const ensureDayExists = async (): Promise<Day> => {
    if (day && day.date === currentDate) return day;

    const newDay = await createDay({
      date: currentDate,
      isRestDay: false,
      exercises: [],
    });
    applyDayIfCurrent(newDay);
    return newDay;
  };

  const addExercise = async (options?: {
    stayOpen?: boolean;
    silent?: boolean;
    skipInsight?: boolean;
    exercise?: SelectedExercise;
    strengthSets?: StrengthSet[];
    calisthenicsSets?: CalisthenicsSet[];
  }) => {
    const target = options?.exercise ?? selectedExercise;
    if (!target) return;

    const stayOpen = options?.stayOpen ?? false;
    const silent = options?.silent ?? false;
    const skipInsight = options?.skipInsight ?? false;
    const strengthSource = options?.strengthSets ?? strengthSets;
    const calisthenicsSource = options?.calisthenicsSets ?? calisthenicsSets;

    let exercise: Exercise;

    if (target.modality === "cardio") {
      const durationMinutes = Number(cardioData.duration);
      const duration = durationMinutes * 60;
      const distanceDisplay = cardioData.distance ? Number(cardioData.distance) : undefined;

      if (!isFinite(durationMinutes) || durationMinutes <= 0) {
        if (!silent) toast.error("Duration must be a positive number of minutes.");
        return;
      }

      const cardioDataObj: any = { duration, activityType: cardioActivityType };
      if (distanceDisplay && isFinite(distanceDisplay) && distanceDisplay > 0) {
        const distance = toStoredDistance(distanceDisplay, units);
        cardioDataObj.distance = distance;
        if (duration > 0) {
          cardioDataObj.pace = duration / distance;
        }
      }
      
      exercise = {
        exerciseId: target.id,
        name: target.name,
        modality: "cardio",
        cardioData: cardioDataObj,
      };
    } else if (target.modality === "calisthenics") {
      const sets = calisthenicsSource
        .map((s) => {
          const reps = Number(s.reps);
          const duration = s.duration ? Number(s.duration) : undefined;
          const added = s.addedWeight ? Number(s.addedWeight) : undefined;
          if (!isFinite(reps) || reps <= 0) return null;
          const setObj: { reps: number; duration?: number; addedWeight?: number } = { reps };
          if (duration && isFinite(duration) && duration > 0) {
            setObj.duration = duration;
          }
          if (added && isFinite(added) && added > 0) {
            setObj.addedWeight = toStoredWeight(added, units);
          }
          return setObj;
        })
        .filter((s): s is { reps: number; duration?: number; addedWeight?: number } => s !== null);

      if (sets.length === 0) {
        if (!silent) toast.error("Add at least one valid set with reps.");
        return;
      }

      exercise = {
        exerciseId: target.id,
        name: target.name,
        modality: "calisthenics",
        calisthenicsSets: sets,
      };
    } else {
      const sets = strengthSource
        .map((s) => {
          const reps = Number(s.reps);
          const weight = Number(s.weight);
          if (!isFinite(reps) || reps <= 0 || !isFinite(weight) || weight < 0) return null;
          return { reps, weight: toStoredWeight(weight, units), ...(s.warmup ? { warmup: true as const } : {}) };
        })
        .filter((s): s is { reps: number; weight: number; warmup?: true } => s !== null);

      if (sets.length === 0) {
        if (!silent) toast.error("Add at least one valid set.");
        return;
      }

      exercise = {
        exerciseId: target.id,
        name: target.name,
        modality: "strength",
        strengthSets: sets,
      };
    }

    if (editingIndex !== null && day?.exercises[editingIndex]) {
      const previous = day.exercises[editingIndex];
      if (previous.importId) exercise.importId = previous.importId;
      if (previous.supersetGroup) exercise.supersetGroup = previous.supersetGroup;
    }

    if (!beginSave()) {
      if (silent) {
        persistTimerRef.current = setTimeout(() => {
          void addExercise(options);
        }, 280);
      }
      return;
    }
    showSyncing(true);
    try {
      const currentDay = await ensureDayExists();
      const cleanedExercise = cleanExercise(exercise);
      const nextExercises =
        editingIndex !== null
          ? currentDay.exercises.map((item, i) => (i === editingIndex ? cleanedExercise : cleanExercise(item)))
          : [...(currentDay.exercises || []).map(cleanExercise), cleanedExercise];

      if (currentDay.id) {
        await updateDay(currentDay.id, { exercises: nextExercises });
        applyDayIfCurrent({ ...currentDay, exercises: nextExercises });
        if (user) {
          rememberExercises(user.uid, [cleanedExercise]);
          rememberLastWorkout(user.uid, currentDay.date, nextExercises);
        }
      }
      const wasUpdate = editingIndex !== null;
      if (stayOpen) {
        setEditingIndex(wasUpdate ? editingIndex : nextExercises.length - 1);
      } else {
        setSelectedExercise(null);
        setEditingIndex(null);
        setLastHint(null);
        setStrengthSets([{ reps: "10", weight: formatWeightInput(135, units) }]);
        setCardioData({ duration: "30", distance: "" });
        setCalisthenicsSets([{ reps: "10" }]);
      }
      if (!silent) {
        toast.success(wasUpdate ? "Exercise updated" : "Saved to log");
      }
      showSyncing(false);
      if (
        !stayOpen &&
        restTimerSeconds > 0 &&
        (target.modality === "strength" || target.modality === "calisthenics")
      ) {
        startRest();
      }

      if (!isDesktop) {
        setAddSheetOpen(stayOpen);
      }
      if (skipInsight) {
        return;
      }

      // Fetch and display insights asynchronously (non-blocking)
      // Build a complete list of days including the updated current day
      const updatedDay = { ...currentDay, exercises: nextExercises };
      
      // Create a map of all days, replacing the current day with the updated version
      const daysMap = new Map<string, Day>();
      
      // Add all existing days to the map
      allDays.forEach((d) => {
        if (d.id) {
          daysMap.set(d.id, d);
        }
      });
      
      // Add or update the current day with the latest exercises
      if (updatedDay.id) {
        daysMap.set(updatedDay.id, updatedDay);
      } else {
        // If day doesn't have an ID yet, add it anyway (shouldn't happen, but be safe)
        daysMap.set(updatedDay.date, updatedDay);
      }
      
      // Convert map back to array
      const daysWithUpdate = Array.from(daysMap.values());
      
      // Also ensure we have the current day even if it wasn't in allDays
      const hasCurrentDay = daysWithUpdate.some((d) => 
        d.id === updatedDay.id || d.date === updatedDay.date
      );
      if (!hasCurrentDay) {
        daysWithUpdate.push(updatedDay);
      }
      
      // Sort by date to ensure proper history extraction
      daysWithUpdate.sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateA.getTime() - dateB.getTime();
      });
      
      try {
        await fetchAndDisplayInsight(cleanedExercise, daysWithUpdate);
      } catch (error) {
        // Fail silently - insights are non-critical
        if (error instanceof Error && !error.message.includes("CORS") && !error.message.includes("Failed to fetch")) {
          logger.error("Failed to fetch insight", error);
        }
      }
    } catch (error) {
      logger.error("Failed to save exercise", error);
      const message = error instanceof Error ? error.message : "Failed to save exercise";
      toast.error(message);
      showSyncing(false);
    } finally {
      endSave();
    }
  };

  const queueComposerSave = (patch: { strengthSets?: StrengthSet[]; calisthenicsSets?: CalisthenicsSet[] }) => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      void addExercise({ stayOpen: true, silent: true, skipInsight: true, ...patch });
    }, 400);
  };

  const handleExerciseSelect = async (
    exerciseId: string,
    name: string,
    modality: "strength" | "cardio" | "calisthenics"
  ) => {
    setSelectedExercise({ id: exerciseId, name, modality });

    const lastExercise =
      (user ? getCachedLastExercise(user.uid, exerciseId) : null) ||
      getLastExerciseData(allDays, exerciseId);

    setLastHint(formatLastHint(lastExercise, units));

    if (modality === "cardio") {
      setCardioActivityType(
        lastExercise?.modality === "cardio"
          ? resolveCardioActivityType(lastExercise.cardioData?.activityType, name, exerciseId)
          : inferCardioActivityType(name, exerciseId)
      );
      if (lastExercise?.modality === "cardio" && lastExercise.cardioData) {
        setCardioData({
          duration: String(Math.round(lastExercise.cardioData.duration / 60)),
          distance: lastExercise.cardioData.distance
            ? formatDistanceInput(lastExercise.cardioData.distance, units)
            : "",
        });
      } else {
        setCardioData({ duration: "30", distance: "" });
      }
      return;
    }

    if (modality === "calisthenics") {
      const nextSets =
        lastExercise?.modality === "calisthenics" && lastExercise.calisthenicsSets && lastExercise.calisthenicsSets.length > 0
          ? lastExercise.calisthenicsSets.map((s) => ({
              reps: String(s.reps),
              duration: s.duration ? String(s.duration) : "",
              addedWeight: s.addedWeight ? formatWeightInput(s.addedWeight, units) : "",
            }))
          : [{ reps: "10" }];
      setCalisthenicsSets(nextSets);
      void addExercise({
        exercise: { id: exerciseId, name, modality },
        stayOpen: true,
        silent: true,
        skipInsight: true,
        calisthenicsSets: nextSets,
      });
      return;
    }

    const nextSets =
      lastExercise?.modality === "strength" && lastExercise.strengthSets && lastExercise.strengthSets.length > 0
        ? lastExercise.strengthSets.map((s) => ({
            reps: String(s.reps),
            weight: formatWeightInput(s.weight, units),
            warmup: Boolean(s.warmup),
          }))
        : [{ reps: "10", weight: formatWeightInput(135, units) }];
    setStrengthSets(nextSets);
    void addExercise({
      exercise: { id: exerciseId, name, modality },
      stayOpen: true,
      silent: true,
      skipInsight: true,
      strengthSets: nextSets,
    });
  };

  const removeExercise = async (idx: number) => {
    if (!day) return;
    if (!beginSave()) return;
    showSyncing(true);
    try {
      const next = day.exercises.filter((_, i: number) => i !== idx).map(cleanExercise);
      await updateDay(day.id, { exercises: next });
      applyDayIfCurrent({ ...day, exercises: next });
      toast.success("Exercise removed");
      if (next.length === 0) {
        setAddSheetOpen(false);
      }
      if (editingIndex === idx) {
        setSelectedExercise(null);
        setEditingIndex(null);
      } else if (editingIndex !== null && editingIndex > idx) {
        setEditingIndex(editingIndex - 1);
      }
      showSyncing(false);
    } catch (error) {
      logger.error("Failed to remove exercise", error);
      const message = error instanceof Error ? error.message : "Failed to remove exercise";
      toast.error(message);
      showSyncing(false);
    } finally {
      endSave();
    }
  };

  const toggleRestDay = async () => {
    if (!beginSave()) return;
    showSyncing(true);
    try {
      const currentDay = day && day.date === currentDate
        ? day
        : await createDay({
            date: currentDate,
            isRestDay: true,
            exercises: [],
          });
      const nextRest = currentDay === day ? !currentDay.isRestDay : true;
      if (nextRest) {
        await updateDay(currentDay.id, { isRestDay: true, status: null });
        applyDayIfCurrent({ ...currentDay, isRestDay: true, status: undefined });
      } else {
        await updateDay(currentDay.id, { isRestDay: false });
        applyDayIfCurrent({ ...currentDay, isRestDay: false });
      }
      toast.success(nextRest ? "Marked as rest day" : "Removed rest day");
      showSyncing(false);
    } catch (error) {
      logger.error("Failed to toggle rest day", error);
      toast.error("Failed to toggle rest day");
      showSyncing(false);
    } finally {
      endSave();
    }
  };

  const setDayStatus = async (status: DayStatus | null) => {
    if (!beginSave()) return;
    showSyncing(true);
    try {
      const currentDay = day && day.date === currentDate
        ? day
        : await createDay({ date: currentDate, isRestDay: false, exercises: [], status: status || undefined });
      const next = currentDay.status === status ? null : status;
      await updateDay(currentDay.id, { status: next, isRestDay: next ? false : currentDay.isRestDay });
      applyDayIfCurrent({
        ...currentDay,
        status: next || undefined,
        isRestDay: next ? false : currentDay.isRestDay,
      });
      toast.success(next === "injured" ? "Marked as injury / skip" : "Cleared injury flag");
      showSyncing(false);
    } catch (error) {
      logger.error("Failed to update day status", error);
      toast.error("Failed to update day");
      showSyncing(false);
    } finally {
      endSave();
    }
  };

  const pairSuperset = async (idx: number) => {
    if (!day || idx < 1) return;
    if (!beginSave()) return;
    const group = day.exercises[idx - 1].supersetGroup || day.exercises[idx].supersetGroup || Date.now();
    const next = day.exercises.map((item, i) =>
      i === idx || i === idx - 1 ? { ...item, supersetGroup: group } : item
    );
    try {
      await updateDay(day.id, { exercises: next.map(cleanExercise) });
      applyDayIfCurrent({ ...day, exercises: next.map(cleanExercise) });
    } finally {
      endSave();
    }
  };

  const unlinkSuperset = async (idx: number) => {
    if (!day || !day.exercises[idx].supersetGroup) return;
    if (!beginSave()) return;
    const next = day.exercises.map((item, i) => {
      if (i !== idx) return item;
      const { supersetGroup: _drop, ...rest } = item;
      return rest;
    });
    try {
      await updateDay(day.id, { exercises: next.map(cleanExercise) });
      applyDayIfCurrent({ ...day, exercises: next.map(cleanExercise) });
    } finally {
      endSave();
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}min`;
    return `${mins}min ${secs}s`;
  };

  const getModalityColor = (mod: string) => {
    if (mod === "strength") return "bg-brand/15 text-brand";
    if (mod === "cardio") return "bg-info-muted text-info-fg";
    return "bg-success-muted text-success-fg";
  };

  const getModalityIcon = (mod: string) => {
    if (mod === "strength") return Dumbbell;
    if (mod === "cardio") return Heart;
    return Activity;
  };

  if ((authLoading && !user) || !currentDate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DayNavigationSkeleton />
        <main className="container mx-auto max-w-4xl px-4 py-6 md:px-8">
          <div className="mb-6 h-12 w-full rounded-lg bg-gray-200 animate-pulse"></div>
          <ExerciseListSkeleton />
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const visibleDay = day && day.date === currentDate ? day : null;
  const showBodySkeleton = loading && !visibleDay;
  const hasExercises = visibleDay && visibleDay.exercises.length > 0;
  const isRestDay = visibleDay?.isRestDay ?? false;
  const hasLastWorkout = Boolean(getCachedLastWorkout(user.uid));
  const sheetMode = Boolean(hasExercises && addSheetOpen && !isDesktop);
  const showInlineComposer = Boolean((!isRestDay || hasExercises) && (isDesktop || !hasExercises));

  const closeAddSheet = () => {
    setAddSheetOpen(false);
    setSelectedExercise(null);
    setEditingIndex(null);
    setLastHint(null);
  };

  const logComposer = (!isRestDay || hasExercises) && (
          <div id="log-composer" className="rounded-lg border border-gray-200 bg-white px-4 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{hasExercises ? "Add another" : "Log"}</h2>
            </div>

            {editingIndex !== null && (
              <div className="mb-3 rounded-xl border border-info/30 bg-info-muted px-4 py-3 text-sm text-info-fg">
                Editing {selectedExercise?.name ?? "exercise"}. Changes save as you add sets.
              </div>
            )}

            {!selectedExercise ? (
              <div>
                <ExerciseSearch onSelect={handleExerciseSelect} placeholder="Search a lift..." />
                {hasLastWorkout && !hasExercises && (
                  <button
                    type="button"
                    onClick={() => void repeatLastWorkout()}
                    disabled={saving}
                    className="mt-3 text-sm font-medium text-brand underline-offset-2 hover:underline"
                  >
                    Repeat last workout
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedExercise.name}</h3>
                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getModalityColor(
                        selectedExercise.modality
                      )}`}
                    >
                      {selectedExercise.modality}
                    </span>
                    {lastHint && (
                      <p className="mt-2 text-sm text-gray-500">{lastHint}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedExercise(null);
                      setEditingIndex(null);
                      setLastHint(null);
                    }}
                    className="text-sm text-gray-600 transition-colors hover:text-gray-700"
                    aria-label="Change exercise"
                  >
                    Change
                  </button>
                </div>

                {selectedExercise.modality === "strength" && (
                  <StrengthSetInput
                    sets={strengthSets}
                    onSetsChange={(next) => {
                      setStrengthSets(next);
                      queueComposerSave({ strengthSets: next });
                    }}
                    onAddedSet={(next) => {
                      startRest();
                      void addExercise({
                        stayOpen: true,
                        silent: true,
                        skipInsight: true,
                        strengthSets: next,
                      });
                    }}
                    exerciseName={selectedExercise.name}
                  />
                )}

                {selectedExercise.modality === "cardio" && (
                  <CardioInput
                    data={cardioData}
                    onDataChange={setCardioData}
                    activityType={cardioActivityType}
                    onActivityTypeChange={setCardioActivityType}
                  />
                )}

                {selectedExercise.modality === "calisthenics" && (
                  <CalisthenicsSetInput
                    sets={calisthenicsSets}
                    onSetsChange={(next) => {
                      setCalisthenicsSets(next);
                      queueComposerSave({ calisthenicsSets: next });
                    }}
                    showDuration
                    onAddedSet={(next) => {
                      startRest();
                      void addExercise({
                        stayOpen: true,
                        silent: true,
                        skipInsight: true,
                        calisthenicsSets: next,
                      });
                    }}
                  />
                )}

                <button
                  onClick={() => void addExercise()}
                  disabled={saving}
                  className="btn-primary mt-4 flex w-full items-center justify-center gap-2"
                  aria-label={editingIndex !== null ? "Save changes" : "Save to log"}
                >
                  <Plus className="h-5 w-5" />
                  {saving ? "Saving..." : editingIndex !== null ? "Save changes" : "Save to log"}
                </button>
              </div>
            )}
          </div>
        );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      <SyncStatusIndicator />
      {/* Fixed Header */}
      <header className="z-20 flex-shrink-0 bg-white">
      <DayNavigation
        currentDate={currentDate}
        onDateChange={handleDateChange}
        onTodayClick={handleTodayClick}
        loggedDates={new Set(nearbyDays.filter((d) => !d.isRestDay && d.exercises.length > 0).map((d) => d.date))}
        restDates={new Set(nearbyDays.filter((d) => d.isRestDay).map((d) => d.date))}
        injuredDates={new Set(nearbyDays.filter((d) => d.status === "injured").map((d) => d.date))}
        trailing={
      <div ref={dayMenuRef} className="relative flex-shrink-0">
        <button
          type="button"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setDayMenuPos({ top: rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right) });
            setShowDayMenu((open) => !open);
          }}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
          aria-label="More for this day"
          aria-expanded={showDayMenu}
          aria-haspopup="menu"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {showDayMenu && (
          <div
            role="menu"
            className="fixed z-40 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            style={{ top: dayMenuPos.top, right: dayMenuPos.right }}
          >
            <button
              type="button"
              role="menuitem"
              disabled={saving}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => {
                setShowDayMenu(false);
                void toggleRestDay();
              }}
            >
              <Moon className="h-4 w-4 shrink-0 text-gray-600" />
              {isRestDay ? "Turn rest off" : "Mark rest day"}
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={saving}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => {
                setShowDayMenu(false);
                void setDayStatus("injured");
              }}
            >
              <Bandage className="h-4 w-4 shrink-0 text-gray-600" />
              {visibleDay?.status === "injured" ? "Clear injured" : "Mark injured"}
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50"
              onClick={() => {
                setShowDayMenu(false);
                setShowTemplateSelector(true);
                void loadTemplates();
              }}
            >
              <FileText className="h-4 w-4 shrink-0 text-gray-600" />
              Templates
            </button>
            {hasLastWorkout && (
              <button
                type="button"
                role="menuitem"
                disabled={saving}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                onClick={() => {
                  setShowDayMenu(false);
                  void repeatLastWorkout();
                }}
              >
                <History className="h-4 w-4 shrink-0 text-gray-600" />
                Repeat last workout
              </button>
            )}
            <Link
              href={`/settings/import?tab=file&date=${currentDate}`}
              prefetch
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50"
              onClick={() => setShowDayMenu(false)}
            >
              <Upload className="h-4 w-4 shrink-0 text-gray-600" />
              Import log
            </Link>
          </div>
        )}
      </div>
        }
      />
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-6 md:px-8">
        {showBodySkeleton ? (
          <>
            <div className="mb-6 h-12 w-full rounded-lg bg-gray-200 animate-pulse"></div>
            <ExerciseListSkeleton />
          </>
        ) : (
        <>
        {visibleDay?.status === "injured" && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger-muted px-4 py-3 text-sm text-danger-fg">
            Injury / skip. This day does not count toward your streak. You can still log modified work.
          </div>
        )}
        {!isRestDay && !hasExercises && !selectedExercise && (
          <p className="mb-4 text-sm text-gray-500">Search a lift to start today’s log.</p>
        )}
        <div>
        {hasExercises && (
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Exercises</h2>
              <div className="space-y-3">
                {day!.exercises.map((ex: Exercise, idx: number) => {
                  const Icon = getModalityIcon(ex.modality);
                  return (
                    <div key={`${ex.name}-${idx}`} className="cv-auto rounded-lg border border-gray-200 bg-white p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-gray-900">
                            {ex.supersetGroup ? "⇄ " : ""}
                            {ex.name}
                          </h3>
                          <span
                            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getModalityColor(
                              ex.modality
                            )}`}
                          >
                            {ex.modality === "cardio"
                              ? CARDIO_ACTIVITY_LABELS[
                                  resolveCardioActivityType(ex.cardioData?.activityType, ex.name, ex.exerciseId)
                                ]
                              : ex.modality}
                          </span>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {ex.supersetGroup ? (
                            <button
                              onClick={() => unlinkSuperset(idx)}
                              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
                              aria-label="Unlink superset"
                              title="Unlink superset"
                            >
                              <Unlink className="h-4 w-4" />
                            </button>
                          ) : idx > 0 ? (
                            <button
                              onClick={() => pairSuperset(idx)}
                              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
                              aria-label="Superset with previous"
                              title="Superset with previous"
                            >
                              <Link2 className="h-4 w-4" />
                            </button>
                          ) : null}
                          <button
                            onClick={() => startEditingExercise(idx)}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
                            aria-label={`Edit ${ex.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setExerciseToRemove(idx)}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-danger-muted p-2 text-danger transition-colors hover:opacity-80"
                            aria-label={`Remove ${ex.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ex.modality === "strength" &&
                          ex.strengthSets?.map((st: any, i: number) => (
                            <div key={i} className="rounded bg-gray-100 px-3 py-1">
                              <span className="text-sm text-gray-700">
                                {st.warmup ? (
                                  <span className="mr-1 text-xs font-semibold text-warning-fg" title="Warmup">
                                    W
                                  </span>
                                ) : null}
                                {st.reps}×{formatWeight(st.weight, units)}
                              </span>
                            </div>
                          ))}
                        {ex.modality === "cardio" && ex.cardioData && (
                          <div className="rounded bg-gray-100 px-3 py-1">
                            <span className="text-sm text-gray-700">
                              {formatCardioDuration(ex.cardioData.duration)}
                              {ex.cardioData.distance
                                ? ` • ${formatDistance(ex.cardioData.distance, units)}`
                                : null}
                            </span>
                          </div>
                        )}
                        {ex.modality === "calisthenics" &&
                          ex.calisthenicsSets?.map((st: any, i: number) => (
                            <div key={i} className="rounded bg-gray-100 px-3 py-1">
                              <span className="text-sm text-gray-700">
                                {st.reps} reps
                                {st.addedWeight ? ` • +${formatWeight(st.addedWeight, units)}` : ""}
                                {st.duration ? ` • ${formatDuration(st.duration)}` : null}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
        )}
        {showInlineComposer && <div className="mb-6">{logComposer}</div>}
        </div>

        {sheetMode && (
          <div className="fixed inset-0 z-[60]">
            <button
              type="button"
              className="modal-backdrop absolute inset-0"
              aria-label="Dismiss add sheet"
              onClick={closeAddSheet}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Add a lift"
              className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border border-gray-200 bg-white px-4 pt-3 shadow-xl"
              style={{ paddingBottom: "max(1.5rem, calc(var(--safe-area-bottom) + 1rem))" }}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">Add to this day</p>
                <button
                  type="button"
                  onClick={closeAddSheet}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                  aria-label="Close add sheet"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-2">{logComposer}</div>
            </div>
          </div>
        )}

        {hasExercises && !sheetMode && !isDesktop && (
          <button
            type="button"
            onClick={() => {
              setEditingIndex(null);
              setSelectedExercise(null);
              setLastHint(null);
              setAddSheetOpen(true);
            }}
            className="fixed-above-nav fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-fg shadow-lg"
            aria-label="Add a lift"
          >
            <Plus className="h-7 w-7" />
          </button>
        )}

        {isRestDay && !hasExercises && (
          <div className="rounded-lg border border-info/30 bg-info-muted p-8 text-center">
            <Moon className="mx-auto mb-4 h-12 w-12 text-info" />
            <p className="text-lg font-semibold text-info-fg">Rest Day</p>
            <p className="mt-2 text-sm text-info-fg">Recovery day. Turn rest off to log work.</p>
          </div>
        )}

        {showTemplateSelector && (
          <TemplatePicker
            templates={templates}
            saving={saving}
            dayHasWork={Boolean(hasExercises)}
            canSaveCurrent={Boolean(hasExercises)}
            onClose={() => setShowTemplateSelector(false)}
            onSelect={(template, mode) => void loadTemplate(template, mode)}
            onSaveCurrent={(name) => void saveCurrentAsTemplate(name)}
          />
        )}
        </>
        )}
        </div>
      </main>
      {resting && restTimerSeconds > 0 && (
        <RestTimer
          key={restKey}
          seconds={restTimerSeconds}
          onDone={() => setResting(false)}
          onSkip={() => setResting(false)}
        />
      )}
      {exerciseToRemove !== null && (
      <ConfirmDialog
        open
        title="Remove exercise?"
        message="This set data will be deleted from today."
        confirmText="Remove"
        danger
        onCancel={() => setExerciseToRemove(null)}
        onConfirm={() => {
          const idx = exerciseToRemove;
          setExerciseToRemove(null);
          if (idx != null) void removeExercise(idx);
        }}
      />
      )}
    </div>
  );
}
