"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../providers/Auth";
import { accountService } from "../../../../lib/firebase";
import { ArrowLeft, User } from "lucide-react";
import { toast } from "../../../../lib/toast";
import { logger } from "../../../../lib/logger";

export default function AccountSettings() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [username, setUsername] = useState<string>("");
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.replace("/login");
      return;
    }
    loadUsername();
  }, [user, router, authLoading]);
  
  const loadUsername = async () => {
    try {
      setLoadingUsername(true);
      const currentUsername = await accountService.getUsername();
      setUsername(currentUsername || "");
      setUsernameInput(currentUsername || "");
    } catch (error) {
      logger.error("Error loading username", error);
    } finally {
      setLoadingUsername(false);
    }
  };
  
  const handleSaveUsername = async () => {
    try {
      setSavingUsername(true);
      await accountService.setUsername(usernameInput);
      setUsername(usernameInput);
      toast.success("Username updated successfully");
    } catch (error: any) {
      logger.error("Error saving username", error);
      toast.error(error?.message || "Failed to save username");
    } finally {
      setSavingUsername(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* Fixed Header */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto max-w-4xl">
            <button
              onClick={() => router.back()}
              className="mb-2 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Back</span>
            </button>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Account Settings</h1>
            <p className="text-sm text-gray-500">Customize your profile</p>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 md:px-8 md:max-w-4xl">
          <div className="space-y-6">
            {/* Profile Picture Section */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Profile Picture</h2>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center">
                  <div className="mr-4 rounded-full bg-gray-100 p-4">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Profile Picture</p>
                    <p className="text-sm text-gray-500">Coming soon</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Account Information Section */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Account Information</h2>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">Email</p>
                    <p className="font-semibold text-gray-900">{user?.email || "Not set"}</p>
                    <p className="text-xs text-gray-500 mt-1">Your email address cannot be changed</p>
                  </div>
                </div>
                
                {/* Username */}
                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  {loadingUsername ? (
                    <div className="text-sm text-gray-500">Loading...</div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="Enter username"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        maxLength={20}
                      />
                      <button
                        onClick={handleSaveUsername}
                        disabled={savingUsername || usernameInput === username || !usernameInput.trim()}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800"
                      >
                        {savingUsername ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    3-20 characters, letters, numbers, underscores, and hyphens only
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
