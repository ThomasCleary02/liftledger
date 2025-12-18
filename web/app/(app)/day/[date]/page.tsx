"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO, isValid, differenceInDays } from "date-fns";
import { useAuth } from "../../../../providers/Auth";
import {
  getDayByDate,
  createDay,
  updateDay,
  Day,
} from "../../../../lib/firestore/days";
import type { Exercise } from "../../../../lib/firestore/workouts";
import ExerciseSearch from "../../../../components/ExerciseSearch";
import StrengthSetInput, { StrengthSet } from "../../../../components/StrengthSetInput";
import CalisthenicsSetInput, { CalisthenicsSet } from "../../../../components/CalisthenicsSetInput";
import CardioInput, { CardioData } from "../../../../components/CardioInput";
import DayNavigation from "../../../../components/DayNavigation";
import { Trash2, Dumbbell, Heart, Activity, Pencil, Plus, Moon, FileText, X, ChevronRight } from "lucide-react";
import { usePreferences } from "../../../../lib/hooks/usePreferences";
import { formatWeight, formatDistance } from "../../../../lib/utils/units";
import { toast, removeToast } from "../../../../lib/toast";
import { logger } from "../../../../lib/logger";
import { listDays } from "../../../../lib/firestore/days";
import { DayNavigationSkeleton, ExerciseListSkeleton } from "../../../../components/LoadingSkeleton";
import { SyncStatusIndicator, useSyncStatus } from "../../../../components/SyncStatus";
import { listTemplates, type WorkoutTemplate } from "../../../../lib/firestore/workoutTemplates";
import {
  fetchProgressInsight,
  extractExerciseHistory,
  shouldFetchInsight,
  isNewPR,
  getMetricName,
  getCachedInsight,
  setCachedInsight,
  clearCacheEntry,
} from "@liftledger/shared";

type SelectedExercise = {
  id: string;
  name: string;
  modality: "strength" | "cardio" | "calisthenics";
};

export default function DayView() {
  const params = useParams();
  const dateParam = params.date as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [day, setDay] = useState<Day | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedExercise, setSelectedExercise] = useState<SelectedExercise | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [strengthSets, setStrengthSets] = useState<StrengthSet[]>([{ reps: "10", weight: "135" }]);
  const [cardioData, setCardioData] = useState<CardioData>({ duration: "30", distance: "5" });
  const [calisthenicsSets, setCalisthenicsSets] = useState<CalisthenicsSet[]>([{ reps: "10" }]);

  const { units } = usePreferences();
  const { showSyncing } = useSyncStatus();

  const [allDays, setAllDays] = useState<Day[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  const loadTemplates = async () => {
    try {
      const templateList = await listTemplates();
      setTemplates(templateList);
    } catch (error) {
      logger.error("Failed to load templates", error);
      toast.error("Failed to load templates");
    }
  };

  // Helper to clean exercise data (remove undefined values)
  const cleanExercise = (ex: Exercise): Exercise => {
    const cleaned: any = {
      exerciseId: ex.exerciseId,
      name: ex.name,
      modality: ex.modality,
    };
    
    // Clean strength sets
    if (ex.strengthSets && Array.isArray(ex.strengthSets)) {
      cleaned.strengthSets = ex.strengthSets.map((set: any) => {
        const cleanSet: any = { reps: set.reps, weight: set.weight };
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
      cleaned.cardioData = cleanCardio;
    }
    
    // Clean calisthenics sets
    if (ex.calisthenicsSets && Array.isArray(ex.calisthenicsSets)) {
      cleaned.calisthenicsSets = ex.calisthenicsSets.map((set: any) => {
        const cleanSet: any = { reps: set.reps };
        if (set.duration !== undefined && set.duration !== null) {
          cleanSet.duration = set.duration;
        }
        return cleanSet;
      });
    }
    
    return cleaned as Exercise;
  };

  const loadTemplate = async (template: WorkoutTemplate) => {
    if (!template.exercises || template.exercises.length === 0) {
      toast.error("Template has no exercises");
      return;
    }

    setSaving(true);
    showSyncing(true);
    try {
      const currentDay = await ensureDayExists();
      const existingExercises = currentDay.exercises || [];
      const templateExercises = template.exercises.map(cleanExercise); // Clean and copy
      const nextExercises = [...existingExercises, ...templateExercises];

      if (currentDay.id) {
        await updateDay(currentDay.id, { exercises: nextExercises });
        setDay({ ...currentDay, exercises: nextExercises });
        toast.success(`Loaded template: ${template.name}`);
      }
      setShowTemplateSelector(false);
      showSyncing(false);
    } catch (error) {
      logger.error("Failed to load template", error);
      toast.error("Failed to load template");
      showSyncing(false);
    } finally {
      setSaving(false);
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
      return format(new Date(), "yyyy-MM-dd");
    }
    // Validate date format
    const parsed = parseISO(dateParam);
    if (!isValid(parsed)) {
      return format(new Date(), "yyyy-MM-dd");
    }
    return format(parsed, "yyyy-MM-dd");
  };

  const currentDate = getCurrentDate();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const d = await getDayByDate(currentDate);
        if (mounted) setDay(d);
      } catch (error) {
        logger.error("Failed to load day", error);
        if (mounted) {
          toast.error("Failed to load day. Please try again.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const loadDays = async () => {
      try {
        const days = await listDays({ limit: 500, order: "desc" });
        setAllDays(days);
      } catch (error) {
        // Silently fail - exercise history is optional
        // This will work once Firestore rules are deployed
        console.warn("Failed to load days for exercise history (non-critical)", error);
      }
    };
    loadDays();

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

      // Extract exercise history
      const history = extractExerciseHistory(allDays, exerciseId, modality);

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

      logger.info(`[Insights] Fetching insight for ${exercise.name}: history=${history.length}, isPR=${isPR}`);

      // Determine metric name
      const hasDistance = modality === "cardio" && exercise.cardioData?.distance !== undefined && exercise.cardioData.distance > 0;
      const metric = getMetricName(modality, hasDistance);

      // Track loading toast ID so we can remove it when the real insight arrives
      let loadingToastId: string | null = null;

      // For new PRs, always fetch fresh data (skip cache)
      // For regular insights, check cache first (but only if it's not a PR insight)
      if (!isPR) {
        const cachedInsight = getCachedInsight(exerciseId, metric);
        if (cachedInsight) {
          // Only use cached insight if it's not a PR (to avoid showing stale PR messages)
          if (!cachedInsight.isNewPR) {
            logger.info(`[Insights] Using cached insight for ${exercise.name}`);
            // Add small delay to ensure React has finished updates
            setTimeout(() => {
              displayInsight(cachedInsight, metric);
            }, 100);
            return;
          } else {
            // Clear stale PR cache
            logger.info(`[Insights] Clearing stale PR cache for ${exercise.name}`);
            clearCacheEntry(exerciseId, metric);
          }
        }
        // Show loading toast for regular insights too (gives immediate feedback)
        loadingToastId = toast.info("Analyzing your progress...");
      } else {
        // Clear cache for PRs to ensure we get fresh insight
        clearCacheEntry(exerciseId, metric);
        // Show immediate feedback for PRs - they're important!
        loadingToastId = toast.info("Analyzing your progress...");
      }

      // Fetch insight from API (non-blocking - fire and forget)
      // The toast will appear when the API responds
      fetchProgressInsight({
        exercise: exercise.name,
        metric: metric,
        history: history,
      })
        .then((insight) => {
          logger.info(`[Insights] Received insight from API for ${exercise.name}:`, {
            isNewPR: insight.isNewPR,
            hasText: !!insight.insightText,
            textLength: insight.insightText?.length || 0,
          });
          
          // Remove loading toast if it exists
          if (loadingToastId) {
            removeToast(loadingToastId);
          }
          
          // Cache the insight
          setCachedInsight(exerciseId, metric, insight);
          
          // Display the insight with a delay to avoid overlapping with "Exercise saved" toast
          // For PRs, show sooner (1 second) since they're more important
          // For regular insights, wait longer (2 seconds) so the success toast can be seen
          const delay = insight.isNewPR ? 1000 : 2000;
          setTimeout(() => {
            displayInsight(insight, metric);
            logger.info(`[Insights] Successfully displayed insight for ${exercise.name}`);
          }, delay);
        })
        .catch((error) => {
          // Error handling is done in the outer catch block, but we need to handle it here too
          // since we're not using await
          if (error instanceof Error) {
            if (!error.message.includes("CORS") && !error.message.includes("Failed to fetch") && !error.message.includes("Network error")) {
              logger.error(`[Insights] Failed to fetch insight for ${exercise.name}:`, error.message);
            }
          }
        });
    } catch (error) {
      // Handle any synchronous errors (shouldn't happen, but be safe)
      if (error instanceof Error) {
        logger.error(`[Insights] Unexpected error for ${exercise.name}:`, error.message);
      }
    }
  };

  /**
   * Format insight text with proper units
   * Replaces "weight" with "lbs" or "kgs" based on user preference
   */
  const formatInsightText = (text: string, metric: string): string => {
    if (metric !== "weight") {
      return text; // Only format weight metrics
    }

    const unitLabel = units === "metric" ? "kgs" : "lbs";
    
    // Replace patterns like "240 weight" or " weight" with the unit
    // Handle both "weight" and " weight" (with space)
    let formatted = text.replace(/\s+weight\b/gi, ` ${unitLabel}`);
    formatted = formatted.replace(/\bweight\b/gi, unitLabel);
    
    return formatted;
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

  const handleExerciseSelect = async (
    exerciseId: string,
    name: string,
    modality: "strength" | "cardio" | "calisthenics"
  ) => {
    setSelectedExercise({ id: exerciseId, name, modality });

    const lastExercise = getLastExerciseData(allDays, exerciseId);

    if (modality === "cardio") {
      if (lastExercise?.modality === "cardio" && lastExercise.cardioData) {
        setCardioData({
          duration: String(Math.round(lastExercise.cardioData.duration / 60)),
          distance: lastExercise.cardioData.distance ? String(lastExercise.cardioData.distance) : "5",
        });
      } else {
        setCardioData({ duration: "30", distance: "5" });
      }
    } else if (modality === "calisthenics") {
      if (lastExercise?.modality === "calisthenics" && lastExercise.calisthenicsSets && lastExercise.calisthenicsSets.length > 0) {
        setCalisthenicsSets(
          lastExercise.calisthenicsSets.map((s) => ({
            reps: String(s.reps),
            duration: s.duration ? String(s.duration) : "",
          }))
        );
      } else {
        setCalisthenicsSets([{ reps: "10" }]);
      }
    } else {
      if (lastExercise?.modality === "strength" && lastExercise.strengthSets && lastExercise.strengthSets.length > 0) {
        setStrengthSets(
          lastExercise.strengthSets.map((s) => ({
            reps: String(s.reps),
            weight: String(s.weight),
          }))
        );
      } else {
        setStrengthSets([{ reps: "10", weight: "135" }]);
      }
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
          weight: String(s.weight),
        })) ?? [{ reps: "10", weight: "135" }]
      );
    } else if (ex.modality === "cardio") {
      setCardioData({
        duration: ex.cardioData ? String(Math.round(ex.cardioData.duration / 60)) : "",
        distance: ex.cardioData?.distance != null ? String(ex.cardioData.distance) : "",
      });
    } else {
      setCalisthenicsSets(
        ex.calisthenicsSets?.map((s) => ({
          reps: String(s.reps),
          duration: s.duration != null ? String(s.duration) : "",
        })) ?? [{ reps: "10" }]
      );
    }
  };

  const ensureDayExists = async (): Promise<Day> => {
    if (day) return day;

    // Create day if it doesn't exist
    const newDay = await createDay({
      date: currentDate,
      isRestDay: false,
      exercises: [],
    });
    setDay(newDay);
    return newDay;
  };

  const addExercise = async () => {
    if (!selectedExercise) return;

    let exercise: Exercise;

    if (selectedExercise.modality === "cardio") {
      const durationMinutes = Number(cardioData.duration);
      const duration = durationMinutes * 60;
      const distance = cardioData.distance ? Number(cardioData.distance) : undefined;

      if (!isFinite(durationMinutes) || durationMinutes <= 0) {
        toast.error("Duration must be a positive number of minutes.");
        return;
      }

      const cardioDataObj: any = { duration };
      if (distance && isFinite(distance) && distance > 0) {
        cardioDataObj.distance = distance;
        if (duration > 0) {
          cardioDataObj.pace = duration / distance;
        }
      }
      
      exercise = {
        exerciseId: selectedExercise.id,
        name: selectedExercise.name,
        modality: "cardio",
        cardioData: cardioDataObj,
      };
    } else if (selectedExercise.modality === "calisthenics") {
      const sets = calisthenicsSets
        .map((s) => {
          const reps = Number(s.reps);
          const duration = s.duration ? Number(s.duration) : undefined;
          if (!isFinite(reps) || reps <= 0) return null;
          const setObj: { reps: number; duration?: number } = { reps };
          if (duration && isFinite(duration) && duration > 0) {
            setObj.duration = duration;
          }
          return setObj;
        })
        .filter((s): s is { reps: number; duration?: number } => s !== null);

      if (sets.length === 0) {
        toast.error("Add at least one valid set with reps.");
        return;
      }

      exercise = {
        exerciseId: selectedExercise.id,
        name: selectedExercise.name,
        modality: "calisthenics",
        calisthenicsSets: sets,
      };
    } else {
      const sets = strengthSets
        .map((s) => {
          const reps = Number(s.reps);
          const weight = Number(s.weight);
          if (!isFinite(reps) || reps <= 0 || !isFinite(weight) || weight < 0) return null;
          return { reps, weight };
        })
        .filter((s): s is { reps: number; weight: number } => s !== null);

      if (sets.length === 0) {
        toast.error("Add at least one valid set.");
        return;
      }

      exercise = {
        exerciseId: selectedExercise.id,
        name: selectedExercise.name,
        modality: "strength",
        strengthSets: sets,
      };
    }

    setSaving(true);
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
        setDay({ ...currentDay, exercises: nextExercises });
      }
      setSelectedExercise(null);
      setEditingIndex(null);
      setStrengthSets([{ reps: "10", weight: "135" }]);
      setCardioData({ duration: "30", distance: "5" });
      setCalisthenicsSets([{ reps: "10" }]);
      toast.success(editingIndex !== null ? "Exercise updated" : "Exercise added successfully");
      showSyncing(false);

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
      setSaving(false);
    }
  };

  const removeExercise = async (idx: number) => {
    if (!day) return;
    setSaving(true);
    showSyncing(true);
    try {
      const next = day.exercises.filter((_, i: number) => i !== idx).map(cleanExercise);
      await updateDay(day.id, { exercises: next });
      setDay({ ...day, exercises: next });
      toast.success("Exercise removed");
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
      setSaving(false);
    }
  };

  const toggleRestDay = async () => {
    if (!day) {
      // Create day as rest day
      setSaving(true);
      showSyncing(true);
      try {
        const newDay = await createDay({
          date: currentDate,
          isRestDay: true,
          exercises: [],
        });
        setDay(newDay);
        toast.success("Marked as rest day");
        showSyncing(false);
      } catch (error) {
        logger.error("Failed to mark rest day", error);
        toast.error("Failed to mark rest day");
        showSyncing(false);
      } finally {
        setSaving(false);
      }
      return;
    }

    setSaving(true);
    showSyncing(true);
    try {
      await updateDay(day.id, { isRestDay: !day.isRestDay });
      setDay({ ...day, isRestDay: !day.isRestDay });
      toast.success(day.isRestDay ? "Removed rest day" : "Marked as rest day");
      showSyncing(false);
    } catch (error) {
      logger.error("Failed to toggle rest day", error);
      toast.error("Failed to toggle rest day");
      showSyncing(false);
    } finally {
      setSaving(false);
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
    if (mod === "strength") return "bg-blue-100 text-blue-700";
    if (mod === "cardio") return "bg-red-100 text-red-700";
    return "bg-green-100 text-green-700";
  };

  const getModalityIcon = (mod: string) => {
    if (mod === "strength") return Dumbbell;
    if (mod === "cardio") return Heart;
    return Activity;
  };

  if (authLoading || loading) {
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

  const hasExercises = day && day.exercises.length > 0;
  const isRestDay = day?.isRestDay ?? false;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <SyncStatusIndicator />
      {/* Fixed Header */}
      <header className="flex-shrink-0">
      <DayNavigation
        currentDate={currentDate}
        onDateChange={handleDateChange}
        onTodayClick={handleTodayClick}
      />
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-6 md:px-8">
        {/* Header with Rest Day Toggle and Template Button */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={toggleRestDay}
            disabled={saving}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              isRestDay
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
            title={isRestDay ? "Marked as Rest Day" : "Mark as Rest Day"}
          >
            <Moon className={`h-4 w-4 ${isRestDay ? "text-blue-600" : "text-gray-600"}`} />
            {isRestDay ? <span>Rest Day</span> : <span>Mark as Rest Day</span>}
          </button>
          {!isRestDay && (
            <button
              onClick={() => {
                setShowTemplateSelector(true);
                loadTemplates();
              }}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              Use Template
            </button>
          )}
        </div>

        {/* Add / Edit Exercise - Moved to Top */}
        {!isRestDay && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white px-4 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add Exercise</h2>
            </div>

            {editingIndex !== null && (
              <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Editing exercise #{editingIndex + 1}. Saving will replace the existing entry.
              </div>
            )}

            {!selectedExercise ? (
              <ExerciseSearch onSelect={handleExerciseSelect} />
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
                  </div>
                  <button
                    onClick={() => {
                      setSelectedExercise(null);
                      setEditingIndex(null);
                    }}
                    className="text-sm text-gray-600 transition-colors hover:text-gray-700"
                    aria-label="Change exercise"
                  >
                    Change
                  </button>
                </div>

                {selectedExercise.modality === "strength" && (
                  <StrengthSetInput sets={strengthSets} onSetsChange={setStrengthSets} />
                )}

                {selectedExercise.modality === "cardio" && (
                  <CardioInput data={cardioData} onDataChange={setCardioData} />
                )}

                {selectedExercise.modality === "calisthenics" && (
                  <CalisthenicsSetInput
                    sets={calisthenicsSets}
                    onSetsChange={setCalisthenicsSets}
                    showDuration={false}
                  />
                )}

                <button
                  onClick={addExercise}
                  disabled={saving}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition-opacity ${
                    saving ? "cursor-not-allowed bg-gray-300 text-gray-600" : "bg-black text-white hover:opacity-90"
                  }`}
                  aria-label={editingIndex !== null ? "Update exercise" : "Add exercise to workout"}
                >
                  <Plus className="h-5 w-5" />
                  {saving ? "Saving..." : editingIndex !== null ? "Update Exercise" : "Add Exercise"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Exercises List */}
        {!isRestDay && (
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Exercises</h2>
            {hasExercises ? (
              <div className="space-y-3">
                {day!.exercises.map((ex: Exercise, idx: number) => {
                  const Icon = getModalityIcon(ex.modality);
                  return (
                    <div key={`${ex.name}-${idx}`} className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{ex.name}</h3>
                          <span
                            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getModalityColor(
                              ex.modality
                            )}`}
                          >
                            {ex.modality}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditingExercise(idx)}
                            className="rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
                            aria-label={`Edit ${ex.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeExercise(idx)}
                            className="rounded-full bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
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
                                {st.reps}×{formatWeight(st.weight, units)}
                              </span>
                            </div>
                          ))}
                        {ex.modality === "cardio" && ex.cardioData && (
                          <div className="rounded bg-gray-100 px-3 py-1">
                            <span className="text-sm text-gray-700">
                              {formatDuration(ex.cardioData.duration)}
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
                                {st.duration ? ` • ${formatDuration(st.duration)}` : null}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                <p className="text-gray-500">No exercises logged for this day</p>
              </div>
            )}
          </div>
        )}

        {isRestDay && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center">
            <Moon className="mx-auto mb-4 h-12 w-12 text-blue-500" />
            <p className="text-lg font-semibold text-blue-900">Rest Day</p>
            <p className="mt-2 text-sm text-blue-700">No exercises logged for this rest day.</p>
          </div>
        )}

        {/* Template Selector Modal */}
        {showTemplateSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">Select Template</h3>
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto px-6 py-4">
                {templates.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    <p className="text-gray-500">No templates found</p>
                    <p className="mt-1 text-sm text-gray-400">Create templates in Settings</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => loadTemplate(template)}
                        disabled={saving}
                        className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{template.name}</h4>
                            <p className="mt-1 text-sm text-gray-500">
                              {template.exercises.length} exercise{template.exercises.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
