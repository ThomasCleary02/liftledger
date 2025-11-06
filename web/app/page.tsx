"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/Auth";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait for auth state to be determined before redirecting
    // This ensures we check localStorage for persisted sessions
    if (!loading) {
      if (user) {
        router.replace("/workouts");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  // Show loading while auth state is being determined
  // This is important for checking persisted sessions
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}
