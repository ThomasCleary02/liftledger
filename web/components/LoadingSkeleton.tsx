
"use client";

export function WorkoutCardSkeleton() {
  return (
    <div className="mb-4 animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
      <div className="mb-3 h-6 w-32 rounded bg-gray-200"></div>
      <div className="mb-3 flex gap-2">
        <div className="h-6 w-20 rounded-full bg-gray-200"></div>
        <div className="h-6 w-16 rounded-full bg-gray-200"></div>
      </div>
      <div className="mb-3 h-4 w-full rounded bg-gray-200"></div>
      <div className="h-4 w-3/4 rounded bg-gray-200"></div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4">
      <div className="mb-3 h-12 w-12 rounded-full bg-gray-200"></div>
      <div className="mb-1 h-4 w-24 rounded bg-gray-200"></div>
      <div className="h-6 w-16 rounded bg-gray-200"></div>
    </div>
  );
}

export function DayNavigationSkeleton() {
  return (
    <div className="animate-pulse border-b border-gray-200 bg-white px-3 py-2 md:px-8">
      <div className="flex items-center justify-between">
        <div className="h-6 w-36 rounded bg-gray-200"></div>
        <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
      </div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-10 flex-1 rounded-md bg-gray-200"></div>
        ))}
      </div>
    </div>
  );
}

export function ExerciseListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-lg border border-gray-100 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-6 w-32 rounded bg-gray-200"></div>
            <div className="h-8 w-8 rounded bg-gray-200"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-gray-200"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
          </div>
        </div>
      ))}
    </div>
  );
}