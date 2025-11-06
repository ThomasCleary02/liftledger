"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../providers/Auth";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Pages that shouldn't have left margin (no sidebar)
  const noMarginPages = ["/", "/login", "/privacy", "/terms"];
  const shouldHaveMargin = user && !noMarginPages.includes(pathname || "");

  return (
    <div className={`pb-16 ${shouldHaveMargin ? "md:ml-64" : ""}`}>
      {children}
    </div>
  );
}
