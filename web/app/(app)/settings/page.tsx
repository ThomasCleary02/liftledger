"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../../providers/Auth";
import { deleteUserAccount } from "../../../lib/firestore/account";
import { UnitSystem, DefaultChartView } from "../../../lib/preferences";
import { usePreferences } from "../../../lib/hooks/usePreferences";
import {
  Scale,
  BarChart3,
  LogOut,
  Trash2,
  ChevronRight,
  X,
  Star,
} from "lucide-react";
import { toast } from "../../../lib/toast";
import { logger } from "../../../lib/logger";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { getFavoriteExercises, toggleFavoriteExercise } from "../../../lib/firestore/account";
import { getExercise, type ExerciseDoc } from "../../../lib/firestore/exercises";
import { FavoritesModal } from "../../../components/FavoritesModal";

export default function Settings() {
  const router = useRouter();
  const pathname = usePathname();
  const { signOutUser, user, loading: authLoading } = useAuth();
  const [unitsModalOpen, setUnitsModalOpen] = useState(false);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const { preferences, updateUnits, updateChartView } = usePreferences();

  // Add state for confirmations
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [deleteAccountConfirmOpen, setDeleteAccountConfirmOpen] = useState(false);

  // Add state in the component
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favoriteExercises, setFavoriteExercises] = useState<ExerciseDoc[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    if (!user) {
      router.replace("/login");
    } else {
      // Load favorites when user is authenticated
      loadFavorites();
    }
  }, [user, router, authLoading]);

  const handleSignOut = () => {
    setSignOutConfirmOpen(true);
  };

  const handleSignOutConfirm = () => {
    setSignOutConfirmOpen(false);
    signOutUser();
    toast.success("Signed out successfully");
  };

  const handleDeleteAccount = () => {
    setDeleteAccountConfirmOpen(true);
  };

  const handleDeleteAccountConfirm = () => {
    setDeleteAccountConfirmOpen(false);
    deleteUserAccount()
      .then(() => {
        toast.success("Account deleted successfully");
      })
      .catch((error: unknown) => {
        logger.error("Failed to delete account", error);
        const message = error instanceof Error ? error.message : "Failed to delete account";
        toast.error(message);
      });
  };

  // Add function to load favorites
  const loadFavorites = useCallback(async () => {
    if (!user) return;
    setLoadingFavorites(true);
    try {
      const favIds = await getFavoriteExercises();
      const exercises = await Promise.all(
        favIds.map(id => getExercise(id))
      );
      const validExercises = exercises.filter(Boolean) as ExerciseDoc[];
      setFavoriteExercises(validExercises);
    } catch (error) {
      console.error("Failed to load favorites", error);
      toast.error("Failed to load favorites");
    } finally {
      setLoadingFavorites(false);
    }
  }, [user]);

  // Add function to remove favorite
  const handleRemoveFavorite = async (exerciseId: string) => {
    try {
      await toggleFavoriteExercise(exerciseId);
      await loadFavorites();
      toast.success("Removed from favorites");
    } catch (error) {
      console.error("Failed to remove favorite", error);
      toast.error("Failed to remove favorite");
    }
  };

  const getUnitLabel = (unit: UnitSystem) => {
    return unit === "imperial" ? "Imperial (lb, mi)" : "Metric (kg, km)";
  };

  const getChartViewLabel = (view: DefaultChartView) => {
    const labels: Record<DefaultChartView, string> = {
      week: "Week",
      month: "Month",
      year: "Year",
    };
    return labels[view];
  };

  useEffect(() => {
    if (user && !authLoading) {
      loadFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-4 md:px-8 md:py-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account and preferences</p>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 md:px-8 md:max-w-4xl">
        <div className="space-y-6">
          {/* Profile Section */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Profile</h2>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-gray-100 p-3">
                  <div className="h-6 w-6 rounded-full bg-gray-300"></div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{user?.email || "User"}</p>
                  <p className="text-sm text-gray-500">Email</p>
                </div>
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Preferences</h2>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <SettingItem
                icon={Scale}
                title="Units"
                subtitle={getUnitLabel(preferences.units)}
                onClick={() => setUnitsModalOpen(true)}
              />
              <SettingItem
                icon={BarChart3}
                title="Default Chart View"
                subtitle={getChartViewLabel(preferences.defaultChartView)}
                onClick={() => setChartModalOpen(true)}
              />
              <SettingItem
                icon={Star}
                title="Favorite Exercises"
                subtitle={`${favoriteExercises.length} favorited`}
                onClick={() => {
                  setFavoritesOpen(true);
                  loadFavorites();
                }}
              />
            </div>
          </section>

          {/* Modals */}
          <FavoritesModal
            open={favoritesOpen}
            favoriteExercises={favoriteExercises}
            loading={loadingFavorites}
            onClose={() => setFavoritesOpen(false)}
            onRemoveFavorite={handleRemoveFavorite}
          />

          {/* Account Section */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Account</h2>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <SettingItem
                icon={LogOut}
                title="Sign Out"
                subtitle="Sign out of your account"
                onClick={handleSignOut}
                danger
              />
              <SettingItem
                icon={Trash2}
                title="Delete Account"
                subtitle="Permanently delete your account and data"
                onClick={handleDeleteAccount}
                danger
              />
            </div>
          </section>

          {/* App Info */}
          <div className="py-6 text-center">
            <p className="text-sm text-gray-400">LiftLedger v1.0.0</p>
          </div>
        </div>
      </main>

      {/* Modals */}
      <UnitsModal
        open={unitsModalOpen}
        onClose={() => setUnitsModalOpen(false)}
        currentUnit={preferences.units}
        onSave={updateUnits}
      />
      <ChartViewModal
        open={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        currentView={preferences.defaultChartView}
        onSave={updateChartView}
      />

      <ConfirmDialog
        open={signOutConfirmOpen}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={handleSignOutConfirm}
        onCancel={() => setSignOutConfirmOpen(false)}
      />

      <ConfirmDialog
        open={deleteAccountConfirmOpen}
        title="Delete Account"
        message="This will permanently delete your account and all your workout data. This action cannot be undone. Are you sure?"
        confirmText="Delete Account"
        cancelText="Cancel"
        danger
        onConfirm={handleDeleteAccountConfirm}
        onCancel={() => setDeleteAccountConfirmOpen(false)}
      />
    </div>
  );
}

function SettingItem({
  icon: Icon,
  title,
  subtitle,
  onClick,
  danger = false,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center px-5 py-4 transition-colors hover:bg-gray-50 ${
        danger ? "text-red-600" : ""
      }`}
    >
      <div className={`mr-4 rounded-full p-2 ${danger ? "bg-red-100" : "bg-gray-100"}`}>
        <Icon className={`h-5 w-5 ${danger ? "text-red-600" : "text-gray-700"}`} />
      </div>
      <div className="flex-1 text-left">
        <p className={`font-semibold ${danger ? "text-red-600" : "text-gray-900"}`}>{title}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400" />
    </button>
  );
}

// Modal Components
function UnitsModal({
  open,
  onClose,
  currentUnit,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  currentUnit: UnitSystem;
  onSave: (unit: UnitSystem) => void;
}) {
  const [selectedUnit, setSelectedUnit] = useState<UnitSystem>(currentUnit);

  useEffect(() => {
    if (open) {
      setSelectedUnit(currentUnit);
    }
  }, [open, currentUnit]);

  if (!open) return null;

  const handleSave = () => {
    onSave(selectedUnit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 md:items-center md:justify-center">
      <div className="w-full rounded-t-3xl bg-white p-6 md:max-w-md md:rounded-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Units</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <p className="mb-4 text-gray-600">Choose your preferred unit system</p>

        <div className="space-y-3">
          <button
            onClick={() => setSelectedUnit("imperial")}
            className={`flex w-full items-center rounded-xl border-2 p-4 ${
              selectedUnit === "imperial"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div
              className={`mr-3 h-6 w-6 rounded-full border-2 ${
                selectedUnit === "imperial" ? "border-blue-500" : "border-gray-300"
              } flex items-center justify-center`}
            >
              {selectedUnit === "imperial" && (
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">Imperial</p>
              <p className="text-sm text-gray-500">Pounds (lb), Miles (mi)</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedUnit("metric")}
            className={`flex w-full items-center rounded-xl border-2 p-4 ${
              selectedUnit === "metric"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div
              className={`mr-3 h-6 w-6 rounded-full border-2 ${
                selectedUnit === "metric" ? "border-blue-500" : "border-gray-300"
              } flex items-center justify-center`}
            >
              {selectedUnit === "metric" && (
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">Metric</p>
              <p className="text-sm text-gray-500">Kilograms (kg), Kilometers (km)</p>
            </div>
          </button>
        </div>

        <button
          onClick={handleSave}
          className="mt-6 w-full rounded-xl bg-black py-4 font-bold text-white transition-opacity hover:opacity-90"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function ChartViewModal({
  open,
  onClose,
  currentView,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  currentView: DefaultChartView;
  onSave: (view: DefaultChartView) => void;
}) {
  const [selectedView, setSelectedView] = useState<DefaultChartView>(currentView);

  useEffect(() => {
    if (open) {
      setSelectedView(currentView);
    }
  }, [open, currentView]);

  if (!open) return null;

  const handleSave = () => {
    onSave(selectedView);
    onClose();
  };

  const options: { value: DefaultChartView; label: string; description: string }[] = [
    { value: "week", label: "Week", description: "Group data by week" },
    { value: "month", label: "Month", description: "Group data by month" },
    { value: "year", label: "Year", description: "Group data by year" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 md:items-center md:justify-center">
      <div className="w-full rounded-t-3xl bg-white p-6 md:max-w-md md:rounded-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Default Chart View</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <p className="mb-4 text-gray-600">Choose your default chart grouping</p>

        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedView(option.value)}
              className={`flex w-full items-center rounded-xl border-2 p-4 ${
                selectedView === option.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div
                className={`mr-3 h-6 w-6 rounded-full border-2 ${
                  selectedView === option.value ? "border-blue-500" : "border-gray-300"
                } flex items-center justify-center`}
              >
                {selectedView === option.value && (
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900">{option.label}</p>
                <p className="text-sm text-gray-500">{option.description}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          className="mt-6 w-full rounded-xl bg-black py-4 font-bold text-white transition-opacity hover:opacity-90"
        >
          Save
        </button>
      </div>
    </div>
  );
}
