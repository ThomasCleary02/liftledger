"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../providers/Auth";
import { getAccountSummary } from "../../../../lib/firestore/account";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { logger } from "../../../../lib/logger";

/**
 * Sign-in identity only. Photo and username live on Profile so friends see
 * one place to edit how you appear.
 */
export default function AccountSettings() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    void (async () => {
      try {
        const summary = await getAccountSummary();
        setUsername(summary.username);
      } catch (error) {
        logger.error("Error loading account", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, router, authLoading]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      <header className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="px-4 py-4 md:px-8">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              onClick={() => router.push("/settings")}
              className="mb-3 flex min-h-[44px] items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-semibold">Settings</span>
            </button>
            <p className="kicker mb-1">Settings</p>
            <h1 className="text-2xl font-semibold text-gray-900">Sign-in</h1>
            <p className="mt-1 text-sm text-gray-500">Email for this login. Public name and photo are on Profile.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
          <section className="rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_0_rgb(20_83_45/0.08)]">
            <p className="kicker">Email</p>
            <p className="mt-3 font-mono text-base text-gray-900">{user?.email || "Not set"}</p>
            <p className="mt-1 text-xs text-gray-500">Tied to this login. Sign out or delete from Settings.</p>
          </section>

          <Link
            href="/profile"
            className="flex min-h-[52px] items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-4 py-3 shadow-[0_1px_0_rgb(20_83_45/0.08)] transition-colors hover:bg-gray-50"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Photo & username</p>
              <p className="truncate text-xs text-gray-500">
                {loading ? "…" : username ? `@${username.replace(/^@/, "")} on Profile` : "Edit on Profile"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </Link>
        </div>
      </main>
    </div>
  );
}
