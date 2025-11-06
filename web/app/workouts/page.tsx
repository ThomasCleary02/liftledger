"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../providers/Auth";
import { listWorkouts, subscribeToWorkouts, deleteWorkout, Workout } from "../../lib/firestore/workouts";
import WorkoutCard from "../../components/WorkoutCard";
import { Dumbbell, Plus } from "lucide-react";
import { toast } from "../../lib/toast";
import { logger } from "../../lib/logger";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { WorkoutCardSkeleton } from "../../components/LoadingSkeleton";

export default function Workouts() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ workout: Workout | null; open: boolean }>({
    workout: null,
    open: false,
  });

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    let first = true;
    const unsub = subscribeToWorkouts(
      (ws) => {
        setItems(ws);
        if (first) {
          first = false;
          setLoading(false);
        }
      },
      (err) => {
        logger.error("Failed to subscribe to workouts", err);
        if (first) {
          first = false;
          setLoading(false);
        }
      },
      { limit: 50, order: "desc" }
    );
    return () => unsub();
  }, [user, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await listWorkouts({ limit: 50, order: "desc" });
      setItems(data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleDeleteClick = useCallback((workout: Workout) => {
    setDeleteConfirm({ workout, open: true });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.workout) return;
    
    try {
      await deleteWorkout(deleteConfirm.workout.id);
      toast.success("Workout deleted");
      setDeleteConfirm({ workout: null, open: false });
    } catch (error: unknown) {
      logger.error("Failed to delete workout", error);
      const message = error instanceof Error ? error.message : "Failed to delete";
      toast.error(message);
    }
  }, [deleteConfirm.workout]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
        <header className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Workouts</h1>
            <p className="mt-1 text-sm text-gray-500">Track your training</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 md:px-8 md:max-w-4xl">
            {[1, 2, 3].map((i) => (
              <WorkoutCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* Fixed Header */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-4 md:px-8 md:py-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Workouts</h1>
          <p className="mt-1 text-sm text-gray-500">Track your training</p>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 md:px-8 md:max-w-4xl">
          {items.length === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-6">
                <Dumbbell className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">No workouts yet</h2>
              <p className="mb-8 leading-6 text-gray-500">
                Start tracking your fitness journey by creating your first workout.
              </p>
              <button
                onClick={() => router.push("/workout/new")}
                className="flex items-center rounded-xl bg-black px-6 py-4 font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create First Workout
              </button>
            </div>
          ) : (
            <div className="space-y-4 pb-24 md:pb-6">
              {items.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  id={workout.id}
                  date={workout.date}
                  exercises={workout.exercises}
                  totalVolume={workout.totalVolume}
                  totalCardioDuration={workout.totalCardioDuration}
                  onPress={() => router.push(`/workout/${workout.id}`)}
                  onLongPress={() => handleDeleteClick(workout)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Add Button - Mobile */}
      <button
        onClick={() => router.push("/workout/new")}
        className="fixed bottom-24 right-6 z-50 rounded-full bg-black p-5 shadow-xl transition-all hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
        aria-label="Create new workout"
      >
        <Plus className="h-7 w-7 text-white" />
      </button>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Workout"
        message="Are you sure you want to delete this workout? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ workout: null, open: false })}
      />
    </div>
  );
}
