"use client";

import { Navigation } from "./Navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="absolute left-4 top-4 z-[200] -translate-y-[200%] rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-md focus:translate-y-0"
      >
        Skip to main content
      </a>
      <Navigation />
      <div id="main-content" className="app-shell md:ml-64" tabIndex={-1}>
        {children}
      </div>
    </>
  );
}
