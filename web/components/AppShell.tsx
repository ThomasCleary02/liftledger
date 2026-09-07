"use client";

import { Navigation } from "./Navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <div className="app-shell md:ml-64">{children}</div>
    </>
  );
}
