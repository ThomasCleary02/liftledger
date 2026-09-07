"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dumbbell, BarChart3, CircleUser, Settings } from "lucide-react";
import { useAuth } from "../providers/Auth";
import { BrandMark } from "./BrandMark";
import { getAllExercises } from "../lib/firestore/exercises";
import { listDays } from "../lib/firestore/days";

type NavItem = {
  path: string;
  label: string;
  icon: typeof Dumbbell;
  matchPrefix?: string;
};

const navItems: NavItem[] = [
  { path: "/day/today", label: "Log", icon: Dumbbell, matchPrefix: "/day/" },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/profile", label: "Profile", icon: CircleUser, matchPrefix: "/profile" },
  { path: "/settings", label: "Settings", icon: Settings, matchPrefix: "/settings" },
];

function isNavActive(pathname: string | null, item: NavItem): boolean {
  if (!pathname) return false;
  if (item.matchPrefix) return pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`) || pathname.startsWith(item.matchPrefix);
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}
export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const run = () => {
      navItems.forEach((item) => {
        router.prefetch(item.path);
      });
      void getAllExercises().catch(() => undefined);
      void listDays({ limit: 20, order: "desc" }).catch(() => undefined);
    };
    const idle = window.requestIdleCallback;
    if (typeof idle === "function") {
      const id = idle(run, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 200);
    return () => window.clearTimeout(t);
  }, [user, router]);

  // Only show nav for authenticated users
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav aria-label="Primary" className="app-tabbar fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-paper md:hidden" style={{ paddingBottom: "var(--safe-area-bottom)", paddingLeft: "env(safe-area-inset-left, 0px)", paddingRight: "env(safe-area-inset-right, 0px)" }}>
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavActive(pathname, item);
            return (
              <Link
                key={item.path}
                href={item.path}
                prefetch
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 px-1 py-2 transition-colors ${
                  isActive ? "text-brand" : "text-gray-500"
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? "fill-current" : ""}`} />
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <aside className="app-tabbar hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col md:border-r md:border-gray-200 md:bg-paper">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <BrandMark size="sm" />
        </div>
        <nav aria-label="Primary" className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavActive(pathname, item);
            return (
              <Link
                key={item.path}
                href={item.path}
                prefetch
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                  isActive
                    ? "bg-brand text-brand-fg"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "fill-current" : ""}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
