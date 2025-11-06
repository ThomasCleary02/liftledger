


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