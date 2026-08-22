"use client";

import { useEffect, useState } from "react";
import { Navigation } from "./Navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-dvh bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 md:ml-64">
          <div className="mb-4 h-8 w-40 animate-pulse rounded-md bg-gray-200" />
          <div className="h-48 animate-pulse rounded-md bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="app-shell md:ml-64">{children}</div>
    </>
  );
}
