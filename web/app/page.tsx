"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../providers/Auth";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only redirect if we're actually on the root path
    if (pathname !== "/") return;
    
    // Wait for auth state to be determined before redirecting
    if (!loading) {
      if (user) {
        router.replace("/workouts");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router, pathname]);

  // Show loading while auth state is being determined
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
