"use client";

import { usePathname, useRouter } from "next/navigation";
import { Dumbbell, BarChart3, Settings } from "lucide-react";
import { useAuth } from "../providers/Auth";

const navItems = [
  { path: "/workouts", label: "Workouts", icon: Dumbbell },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  // Don't show nav on login page
  if (!user || pathname === "/login") {
    return null;
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname?.startsWith(item.path + "/");
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
                  isActive ? "text-black" : "text-gray-500"
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? "fill-current" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col md:border-r md:border-gray-200 md:bg-white">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-black p-2">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">LiftLedger</h1>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname?.startsWith(item.path + "/");
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "fill-current" : ""}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
