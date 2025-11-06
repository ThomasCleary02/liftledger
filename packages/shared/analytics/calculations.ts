import { Workout, Exercise } from "../firestore/workouts";
import { ExerciseDoc } from "../firestore/exercises";
import { AnalyticsSummary, ExercisePR, VolumeDataPoint, MuscleGroupStats, TimePeriod } from "./types";

/**
 * Calculate total volume from workouts
 */
export function calculateTotalVolume(workouts: Workout[]): number {
  return workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
}

/**
 * Helper function to get unique workout dates (normalized to midnight)
 */
function getUniqueWorkoutDates(workouts: Workout[]): Date[] {
  const dateMap = new Map<string, Date>();
  
  workouts.forEach(workout => {
    const workoutDate = (workout.date as any)?.toDate 
      ? (workout.date as any).toDate() 
      : new Date(workout.date as any);
    workoutDate.setHours(0, 0, 0, 0);
    
    // Use date string as key to deduplicate
    const dateKey = workoutDate.toISOString().split('T')[0];
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, workoutDate);
    }
  });
  
  return Array.from(dateMap.values()).sort((a, b) => b.getTime() - a.getTime());
}

/**
 * Calculate current streak (consecutive days with workouts ending today or yesterday)
 */
export function calculateCurrentStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;
  
  const uniqueDates = getUniqueWorkoutDates(workouts);
  if (uniqueDates.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let expectedDate = new Date(today);
  
  for (const workoutDate of uniqueDates) {
    const daysDiff = Math.floor((expectedDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If the workout date matches the expected date (today, yesterday, etc.)
    if (daysDiff === 0) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (daysDiff > 0) {
      // If there's a gap, the streak is broken
      break;
    }
    // If daysDiff < 0, it's a future date, skip it
  }
  
  return streak;
}

/**
 * Calculate longest streak (any period in history)
 */
export function calculateLongestStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;
  
  const uniqueDates = getUniqueWorkoutDates(workouts);
  if (uniqueDates.length === 0) return 0;
  
  // Sort oldest to newest for longest streak calculation
  uniqueDates.sort((a, b) => a.getTime() - b.getTime());
  
  let longestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = uniqueDates[i - 1];
    const currDate = uniqueDates[i];
    
    // Calculate days difference
    const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day - increment streak
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      // Gap in dates - reset current streak
      currentStreak = 1;
    }
  }
  
  return longestStreak;
}

/**
 * Find favorite exercise (most frequently performed)
 * Now accepts exercises map to return the actual exercise name
 */
export function findFavoriteExercise(
  workouts: Workout[], 
  exercises?: Map<string, ExerciseDoc>
): string | undefined {
  const exerciseCounts = new Map<string, number>();
  
  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      const key = ex.exerciseId || ex.name;
      exerciseCounts.set(key, (exerciseCounts.get(key) || 0) + 1);
    });
  });

  let maxCount = 0;
  let favoriteId: string | undefined;
  
  exerciseCounts.forEach((count, exerciseId) => {
    if (count > maxCount) {
      maxCount = count;
      favoriteId = exerciseId;
    }
  });

  if (!favoriteId) return undefined;

  // If exercises map is provided, look up the name
  if (exercises && exercises.has(favoriteId)) {
    return exercises.get(favoriteId)!.name;
  }

  // Fallback: try to find the name from workouts
  for (const workout of workouts) {
    for (const ex of workout.exercises) {
      if ((ex.exerciseId || ex.name) === favoriteId) {
        return ex.name; // Return the actual name from the exercise object
      }
    }
  }

  // Last resort: return the ID (shouldn't happen)
  return favoriteId;
}

/**
 * Calculate total cardio distance
 */
export function calculateTotalCardioDistance(workouts: Workout[]): number {
  return workouts.reduce((sum, w) => {
    const cardioDistance = w.exercises
      .filter(ex => ex.modality === "cardio" && ex.cardioData?.distance)
      .reduce((s, ex) => s + (ex.cardioData?.distance || 0), 0);
    return sum + cardioDistance;
  }, 0);
}

/**
 * Calculate total cardio duration (already stored in workout)
 */
export function calculateTotalCardioDuration(workouts: Workout[]): number {
  return workouts.reduce((sum, w) => sum + (w.totalCardioDuration || 0), 0);
}

/**
 * Calculate total calisthenics reps
 */
export function calculateTotalCalisthenicsReps(workouts: Workout[]): number {
  return workouts.reduce((sum, w) => {
    const calisthenicsReps = w.exercises
      .filter(ex => ex.modality === "calisthenics" && ex.calisthenicsSets)
      .reduce((s, ex) => {
        const reps = ex.calisthenicsSets?.reduce((r, set) => r + set.reps, 0) || 0;
        return s + reps;
      }, 0);
    return sum + calisthenicsReps;
  }, 0);
}

/**
 * Get comprehensive analytics summary
 */
export function getAnalyticsSummary(
  workouts: Workout[],
  exercises?: Map<string, ExerciseDoc>
): AnalyticsSummary {
  return {
    totalWorkouts: workouts.length,
    currentStreak: calculateCurrentStreak(workouts),
    longestStreak: calculateLongestStreak(workouts),
    favoriteExercise: findFavoriteExercise(workouts, exercises),
    totalVolume: calculateTotalVolume(workouts),
    totalCardioDistance: calculateTotalCardioDistance(workouts),
    totalCardioDuration: calculateTotalCardioDuration(workouts),
    totalCalisthenicsReps: calculateTotalCalisthenicsReps(workouts),
  };
}

/**
 * Get volume data points for chart (grouped by date)
 */
export function getVolumeDataPoints(workouts: Workout[], period: TimePeriod = "month"): VolumeDataPoint[] {
  const sorted = [...workouts].sort((a, b) => {
    const dateA = (a.date as any)?.toDate ? (a.date as any).toDate() : new Date(a.date as any);
    const dateB = (b.date as any)?.toDate ? (b.date as any).toDate() : new Date(b.date as any);
    return dateA.getTime() - dateB.getTime();
  });

  const grouped = new Map<string, { volume: number; count: number }>();

  sorted.forEach(workout => {
    const date = (workout.date as any)?.toDate 
      ? (workout.date as any).toDate() 
      : new Date(workout.date as any);
    
    let key: string;
    if (period === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (period === "month") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (period === "year") {
      key = String(date.getFullYear());
    } else {
      key = date.toISOString().split('T')[0];
    }

    const existing = grouped.get(key) || { volume: 0, count: 0 };
    grouped.set(key, {
      volume: existing.volume + (workout.totalVolume || 0),
      count: existing.count + 1,
    });
  });

  return Array.from(grouped.entries()).map(([dateStr, data]) => ({
    date: new Date(dateStr),
    volume: data.volume,
    workoutCount: data.count,
  })).sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Find all Personal Records
 */
export function findAllPRs(workouts: Workout[]): ExercisePR[] {
  const prs: ExercisePR[] = [];
  const strengthPRs = new Map<string, { weight: number; reps: number; volume: number; date: Date; workoutId: string; name: string }>();
  const cardioPRs = new Map<string, { distance: number; duration: number; pace: number; date: Date; workoutId: string; name: string }>();
  const calisthenicsPRs = new Map<string, { reps: number; duration?: number; date: Date; workoutId: string; name: string }>();

  workouts.forEach(workout => {
    const workoutDate = (workout.date as any)?.toDate 
      ? (workout.date as any).toDate() 
      : new Date(workout.date as any);

    workout.exercises.forEach(ex => {
      const exerciseId = ex.exerciseId || ex.name;

      if (ex.modality === "strength" && ex.strengthSets) {
        ex.strengthSets.forEach(set => {
          const current = strengthPRs.get(exerciseId);
          
          // Initialize if needed
          if (!current) {
            strengthPRs.set(exerciseId, {
              weight: set.weight,
              reps: set.reps,
              volume: set.reps * set.weight,
              date: workoutDate,
              workoutId: workout.id,
              name: ex.name,
            });
          } else {
            // Update each field independently, preserving others
            const updated: typeof current = { ...current };
            let updatedAny = false;
            
            if (set.weight > current.weight) {
              updated.weight = set.weight;
              updatedAny = true;
            }
            
            // Still track maxReps but don't display it
            if (set.reps > current.reps) {
              updated.reps = set.reps;
              // Don't set updatedAny - we track but don't create PR for it
            }
            
            const volume = set.reps * set.weight;
            if (volume > current.volume) {
              updated.volume = volume;
              updatedAny = true;
            }
            
            // Only update date/workoutId if we found a new PR
            if (updatedAny) {
              updated.date = workoutDate;
              updated.workoutId = workout.id;
            }
            
            strengthPRs.set(exerciseId, updated);
          }
        });
      }

      if (ex.modality === "cardio" && ex.cardioData) {
        const current = cardioPRs.get(exerciseId);
        const data = ex.cardioData;
        
        // Track max distance
        if (!current || (data.distance || 0) > (current.distance || 0)) {
          cardioPRs.set(exerciseId, {
            distance: data.distance || 0,
            duration: current?.duration || data.duration || 0,
            pace: current?.pace || (data.pace || Infinity),
            date: workoutDate,
            workoutId: workout.id,
            name: ex.name,
          });
        }
        
        // Track max duration
        if (!current || data.duration > (current.duration || 0)) {
          cardioPRs.set(exerciseId, {
            distance: current?.distance || (data.distance || 0),
            duration: data.duration,
            pace: current?.pace || (data.pace || Infinity),
            date: workoutDate,
            workoutId: workout.id,
            name: ex.name,
          });
        }
        
        // Track best pace (lower is better)
        if (data.pace && data.pace > 0 && (!current || data.pace < (current.pace || Infinity))) {
          cardioPRs.set(exerciseId, {
            distance: current?.distance || (data.distance || 0),
            duration: current?.duration || data.duration || 0,
            pace: data.pace,
            date: workoutDate,
            workoutId: workout.id,
            name: ex.name,
          });
        }
      }

      if (ex.modality === "calisthenics" && ex.calisthenicsSets) {
        ex.calisthenicsSets.forEach(set => {
          const current = calisthenicsPRs.get(exerciseId);
          
          if (!current || set.reps > current.reps) {
            calisthenicsPRs.set(exerciseId, {
              ...current || { duration: undefined, date: workoutDate, workoutId: workout.id, name: ex.name },
              reps: set.reps,
              date: workoutDate,
              workoutId: workout.id,
            });
          }
          
          if (set.duration && (!current || set.duration > (current.duration || 0))) {
            calisthenicsPRs.set(exerciseId, {
              ...current || { reps: 0, date: workoutDate, workoutId: workout.id, name: ex.name },
              duration: set.duration,
              date: workoutDate,
              workoutId: workout.id,
            });
          }
        });
      }
    });
  });

  // Convert to PR array
  strengthPRs.forEach((pr, exerciseId) => {
    // Only add maxWeight PR if weight > 0
    if (pr.weight > 0) {
      prs.push({
        exerciseId,
        exerciseName: pr.name,
        modality: "strength",
        prType: "maxWeight",
        value: pr.weight,
        date: pr.date,
        workoutId: pr.workoutId,
      });
    }
    
    // REMOVED: maxReps for strength - we track but don't display
    
    // Only add maxVolume PR if volume > 0
    if (pr.volume > 0) {
      prs.push({
        exerciseId,
        exerciseName: pr.name,
        modality: "strength",
        prType: "maxVolume",
        value: pr.volume,
        date: pr.date,
        workoutId: pr.workoutId,
      });
    }
  });

  // Add cardio PRs
  cardioPRs.forEach((pr, exerciseId) => {
    // Max distance PR
    if (pr.distance > 0) {
      prs.push({
        exerciseId,
        exerciseName: pr.name,
        modality: "cardio",
        prType: "maxDistance",
        value: pr.distance,
        date: pr.date,
        workoutId: pr.workoutId,
      });
    }
    
    // Max duration PR
    if (pr.duration > 0) {
      prs.push({
        exerciseId,
        exerciseName: pr.name,
        modality: "cardio",
        prType: "maxDuration",
        value: pr.duration,
        date: pr.date,
        workoutId: pr.workoutId,
      });
    }
    
    // Best pace PR (only if we have a valid pace)
    if (pr.pace && isFinite(pr.pace) && pr.pace > 0 && pr.pace !== Infinity) {
      prs.push({
        exerciseId,
        exerciseName: pr.name,
        modality: "cardio",
        prType: "bestPace",
        value: pr.pace,
        date: pr.date,
        workoutId: pr.workoutId,
      });
    }
  });

  // Add calisthenics PRs (keep maxReps for calisthenics)
  calisthenicsPRs.forEach((pr, exerciseId) => {
    if (pr.reps > 0) {
      prs.push({
        exerciseId,
        exerciseName: pr.name,
        modality: "calisthenics",
        prType: "maxReps",
        value: pr.reps,
        date: pr.date,
        workoutId: pr.workoutId,
      });
    }
  });

  return prs;
}

/**
 * Get strength-specific analytics
 */
export interface StrengthAnalytics {
  totalVolume: number;
  averageVolumePerWorkout: number;
  maxVolumeWorkout: number;
  exercisesByFrequency: Array<{ exerciseId: string; name: string; count: number; maxWeight: number }>;
  volumeByMuscleGroup: MuscleGroupStats[];
  volumeTrend: VolumeDataPoint[];
}

export function getStrengthAnalytics(workouts: Workout[], exercises: Map<string, ExerciseDoc>): StrengthAnalytics {
  const strengthWorkouts = workouts.filter(w => 
    w.exercises.some(ex => ex.modality === "strength")
  );

  const totalVolume = calculateTotalVolume(workouts);
  const averageVolumePerWorkout = strengthWorkouts.length > 0 
    ? totalVolume / strengthWorkouts.length 
    : 0;

  const maxVolumeWorkout = Math.max(...workouts.map(w => w.totalVolume || 0));

  // Exercise frequency and max weight
  const exerciseMap = new Map<string, { name: string; count: number; maxWeight: number }>();
  
  workouts.forEach(workout => {
    workout.exercises
      .filter(ex => ex.modality === "strength" && ex.strengthSets)
      .forEach(ex => {
        const key = ex.exerciseId || ex.name;
        const current = exerciseMap.get(key) || { name: ex.name, count: 0, maxWeight: 0 };
        
        const maxWeight = Math.max(
          ...(ex.strengthSets?.map(s => s.weight) || [0]),
          current.maxWeight
        );
        
        exerciseMap.set(key, {
          name: ex.name,
          count: current.count + 1,
          maxWeight,
        });
      });
  });

  const exercisesByFrequency = Array.from(exerciseMap.entries())
    .map(([exerciseId, data]) => ({ exerciseId, ...data }))
    .sort((a, b) => b.count - a.count);

  // Volume by muscle group
  const muscleGroupMap = new Map<string, { volume: number; frequency: number; exercises: Set<string> }>();
  
  workouts.forEach(workout => {
    workout.exercises
      .filter(ex => ex.modality === "strength" && ex.strengthSets)
      .forEach(ex => {
        const exerciseDoc = exercises.get(ex.exerciseId || "");
        const muscleGroup = exerciseDoc?.muscleGroup || "unknown";
        const volume = ex.strengthSets?.reduce((sum, s) => sum + (s.reps * s.weight), 0) || 0;
        
        const current = muscleGroupMap.get(muscleGroup);
        
        if (current) {
          // Mutate existing entry
          current.volume += volume;
          current.frequency += 1;
          current.exercises.add(ex.exerciseId || ex.name);
        } else {
          // Create new entry
          muscleGroupMap.set(muscleGroup, {
            volume,
            frequency: 1,
            exercises: new Set([ex.exerciseId || ex.name]),
          });
        }
      });
  });

  const volumeByMuscleGroup: MuscleGroupStats[] = Array.from(muscleGroupMap.entries())
    .map(([muscleGroup, data]) => ({
      muscleGroup,
      volume: data.volume,
      frequency: data.frequency,
      exercises: data.exercises.size,
    }))
    .sort((a, b) => b.volume - a.volume);

  const volumeTrend = getVolumeDataPoints(workouts, "month");

  return {
    totalVolume,
    averageVolumePerWorkout,
    maxVolumeWorkout,
    exercisesByFrequency,
    volumeByMuscleGroup,
    volumeTrend,
  };
}

/**
 * Get cardio-specific analytics
 */
export interface CardioAnalytics {
  totalDistance: number;
  totalDuration: number; // seconds
  averagePace: number; // seconds per mile
  longestDistance: number;
  longestDuration: number;
  bestPace: number; // seconds per mile (lower is better)
  distanceTrend: Array<{ date: Date; distance: number; duration: number }>;
  exercisesByFrequency: Array<{ exerciseId: string; name: string; count: number; totalDistance: number }>;
}

export function getCardioAnalytics(workouts: Workout[]): CardioAnalytics {
  const cardioExercises = workouts
    .flatMap(w => w.exercises.filter(ex => ex.modality === "cardio" && ex.cardioData))
    .map(ex => ex.cardioData!);

  const totalDistance = cardioExercises.reduce((sum, data) => sum + (data.distance || 0), 0);
  const totalDuration = cardioExercises.reduce((sum, data) => sum + data.duration, 0);
  const averagePace = totalDistance > 0 ? totalDuration / totalDistance : 0;

  const longestDistance = Math.max(...cardioExercises.map(d => d.distance || 0), 0);
  const longestDuration = Math.max(...cardioExercises.map(d => d.duration), 0);
  const bestPace = Math.min(...cardioExercises.filter(d => d.distance && d.distance > 0).map(d => d.pace || Infinity), Infinity);

  // Distance trend (grouped by month)
  const trendMap = new Map<string, { distance: number; duration: number }>();
  
  workouts.forEach(workout => {
    const workoutDate = (workout.date as any)?.toDate 
      ? (workout.date as any).toDate() 
      : new Date(workout.date as any);
    
    const key = `${workoutDate.getFullYear()}-${String(workoutDate.getMonth() + 1).padStart(2, '0')}`;
    
    const cardioInWorkout = workout.exercises
      .filter(ex => ex.modality === "cardio" && ex.cardioData)
      .reduce((acc, ex) => ({
        distance: acc.distance + (ex.cardioData?.distance || 0),
        duration: acc.duration + (ex.cardioData?.duration || 0),
      }), { distance: 0, duration: 0 });
    
    const existing = trendMap.get(key) || { distance: 0, duration: 0 };
    trendMap.set(key, {
      distance: existing.distance + cardioInWorkout.distance,
      duration: existing.duration + cardioInWorkout.duration,
    });
  });

  const distanceTrend = Array.from(trendMap.entries())
    .map(([dateStr, data]) => ({
      date: new Date(dateStr + "-01"),
      ...data,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Exercise frequency
  const exerciseMap = new Map<string, { name: string; count: number; totalDistance: number }>();
  
  workouts.forEach(workout => {
    workout.exercises
      .filter(ex => ex.modality === "cardio" && ex.cardioData)
      .forEach(ex => {
        const key = ex.exerciseId || ex.name;
        const current = exerciseMap.get(key) || { name: ex.name, count: 0, totalDistance: 0 };
        exerciseMap.set(key, {
          name: ex.name,
          count: current.count + 1,
          totalDistance: current.totalDistance + (ex.cardioData?.distance || 0),
        });
      });
  });

  const exercisesByFrequency = Array.from(exerciseMap.entries())
    .map(([exerciseId, data]) => ({ exerciseId, ...data }))
    .sort((a, b) => b.count - a.count);

  return {
    totalDistance,
    totalDuration,
    averagePace: isFinite(averagePace) ? averagePace : 0,
    longestDistance,
    longestDuration,
    bestPace: isFinite(bestPace) ? bestPace : 0,
    distanceTrend,
    exercisesByFrequency,
  };
}

/**
 * Filter workouts by time period
 */
export function filterWorkoutsByPeriod(workouts: Workout[], period: TimePeriod): Workout[] {
  if (period === "all") return workouts;
  
  const now = new Date();
  let cutoffDate: Date;
  
  if (period === "week") {
    cutoffDate = new Date(now);
    cutoffDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    cutoffDate = new Date(now);
    cutoffDate.setMonth(now.getMonth() - 1);
  } else if (period === "year") {
    cutoffDate = new Date(now);
    cutoffDate.setFullYear(now.getFullYear() - 1);
  } else {
    return workouts;
  }
  
  return workouts.filter(workout => {
    const workoutDate = (workout.date as any)?.toDate 
      ? (workout.date as any).toDate() 
      : new Date(workout.date as any);
    return workoutDate >= cutoffDate;
  });
}
