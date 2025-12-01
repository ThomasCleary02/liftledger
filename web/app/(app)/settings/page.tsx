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
  List,
  Check,
  FileText,
  Plus,
  ChevronRight as ChevronRightIcon,
  Pencil,
} from "lucide-react";
import { toast } from "../../../lib/toast";
import { logger } from "../../../lib/logger";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { getFavoriteExercises, toggleFavoriteExercise, getTrackedExercises, setTrackedExercises } from "../../../lib/firestore/account";
import { getExercise, type ExerciseDoc } from "../../../lib/firestore/exercises";
import { FavoritesModal } from "../../../components/FavoritesModal";
import { getAllExercises } from "../../../lib/firestore/exercises";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type WorkoutTemplate
} from "../../../lib/firestore/workoutTemplates";
import { Exercise } from "../../../lib/firestore/workouts";

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

  // Add state for My Exercises
  const [myExercisesOpen, setMyExercisesOpen] = useState(false);
  const [trackedExercises, setTrackedExercises] = useState<string[]>([]);
  const [allExercises, setAllExercises] = useState<ExerciseDoc[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Add state for Workout Templates
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [templateExercises, setTemplateExercises] = useState<Exercise[]>([]);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    if (!user) {
      router.replace("/login");
    } else {
      // Load favorites when user is authenticated
      loadFavorites();
      loadTrackedExercises(); // Add this
      loadTemplates(); // Add this
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

  // Add function to load tracked exercises
  const loadTrackedExercises = useCallback(async () => {
    if (!user) return;
    setLoadingExercises(true);
    try {
      const [tracked, all] = await Promise.all([
        getTrackedExercises(),
        getAllExercises()
      ]);
      setTrackedExercises(tracked);
      setAllExercises(all);
    } catch (error) {
      console.error("Failed to load exercises", error);
      toast.error("Failed to load exercises");
    } finally {
      setLoadingExercises(false);
    }
  }, [user]);

  // Add function to load templates
  const loadTemplates = useCallback(async () => {
    if (!user) return;
    setLoadingTemplates(true);
    try {
      const templateList = await listTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error("Failed to load templates", error);
      toast.error("Failed to load templates");
    } finally {
      setLoadingTemplates(false);
    }
  }, [user]);

  // Add function to create template from current workout
  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    // This will be called from the workout page, so we'll handle it differently
    // For now, just show the modal
    setShowCreateTemplate(true);
  };

  // Add function to delete template
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      await loadTemplates();
      toast.success("Template deleted");
    } catch (error) {
      console.error("Failed to delete template", error);
      toast.error("Failed to delete template");
    }
  };

  const handleCreateNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateExercises([]);
    setShowCreateTemplate(true);
  };

  const handleEditTemplate = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateExercises(template.exercises.map(ex => ({ ...ex }))); // Deep copy
    setShowCreateTemplate(true);
  };

  const handleSaveTemplate = async (name: string, exercises: Exercise[]) => {
    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (exercises.length === 0) {
      toast.error("Add at least one exercise to the template");
      return;
    }

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          name: name.trim(),
          exercises: exercises,
        });
        toast.success("Template updated successfully");
      } else {
        await createTemplate({
          name: name.trim(),
          exercises: exercises,
        });
        toast.success("Template created successfully");
      }
      setShowCreateTemplate(false);
      setEditingTemplate(null);
      setTemplateName("");
      setTemplateExercises([]);
      await loadTemplates();
    } catch (error) {
      console.error("Failed to save template", error);
      toast.error("Failed to save template");
    }
  };

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

  // Add toggle function for My Exercises
  const handleToggleTrackedExercise = async (exerciseId: string) => {
    try {
      const isTracked = trackedExercises.includes(exerciseId);
      const newTracked = isTracked
        ? trackedExercises.filter(id => id !== exerciseId)
        : [...trackedExercises, exerciseId];
      
      await setTrackedExercises(newTracked); // Use the imported function, not state setter
      setTrackedExercises(newTracked); // Update local state
      toast.success(isTracked ? "Removed from tracked exercises" : "Added to tracked exercises");
    } catch (error) {
      console.error("Failed to update tracked exercises", error);
      toast.error("Failed to update tracked exercises");
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
      loadTrackedExercises(); // Add this
      loadTemplates(); // Add this
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, loadFavorites, loadTrackedExercises, loadTemplates]);

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
              <SettingItem
                icon={List}
                title="My Exercises"
                subtitle={`${trackedExercises.length} exercises tracked for PRs`}
                onClick={() => {
                  setMyExercisesOpen(true);
                  loadTrackedExercises();
                }}
              />
              <SettingItem
                icon={FileText}
                title="Workout Templates"
                subtitle={`${templates.length} template${templates.length !== 1 ? 's' : ''}`}
                onClick={() => {
                  setTemplatesOpen(true);
                  loadTemplates();
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

          {/* My Exercises Modal */}
          <MyExercisesModal
            open={myExercisesOpen}
            trackedExercises={trackedExercises}
            allExercises={allExercises}
            loading={loadingExercises}
            onClose={() => setMyExercisesOpen(false)}
            onToggleTrackedExercise={handleToggleTrackedExercise}
          />

          {/* Workout Templates Modal */}
          <TemplatesModal
            open={templatesOpen}
            templates={templates}
            loading={loadingTemplates}
            onClose={() => setTemplatesOpen(false)}
            onDelete={handleDeleteTemplate}
            onRefresh={loadTemplates}
            onEdit={handleEditTemplate}
            onCreate={handleCreateNewTemplate}
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

      <TemplateEditorModal
        open={showCreateTemplate}
        templateName={templateName}
        templateExercises={templateExercises}
        onClose={() => {
          setShowCreateTemplate(false);
          setEditingTemplate(null);
          setTemplateName("");
          setTemplateExercises([]);
        }}
        onSave={handleSaveTemplate}
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

function MyExercisesModal({
  open,
  trackedExercises,
  allExercises,
  loading,
  onClose,
  onToggleTrackedExercise,
}: {
  open: boolean;
  trackedExercises: string[];
  allExercises: ExerciseDoc[];
  loading: boolean;
  onClose: () => void;
  onToggleTrackedExercise: (exerciseId: string) => Promise<void>;
}) {
  const [selectedExercises, setSelectedExercises] = useState<string[]>(trackedExercises);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedExercises(trackedExercises);
      setSearchQuery("");
    }
  }, [open, trackedExercises]);

  if (!open) return null;

  const handleToggle = (exerciseId: string) => {
    setSelectedExercises(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId);
      } else {
        return [...prev, exerciseId];
      }
    });
  };

  const handleSave = async () => {
    try {
      // Update all exercises at once
      await setTrackedExercises(selectedExercises);
      // Close modal - the parent will reload the data
      onClose();
      toast.success("Tracked exercises updated");
    } catch (error) {
      console.error("Failed to save tracked exercises", error);
      toast.error("Failed to save tracked exercises");
    }
  };

  const filteredExercises = allExercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 md:items-center md:justify-center">
      <div className="w-full max-h-[80vh] rounded-t-3xl bg-white p-6 md:max-w-2xl md:rounded-2xl flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">My Exercises</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <p className="mb-4 text-gray-600">Select exercises to track for PRs</p>

        {/* Search input */}
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-blue-500 focus:bg-white"
        />

        {/* Exercises list */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading exercises...</p>
          ) : filteredExercises.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No exercises found.</p>
          ) : (
            filteredExercises.map(exercise => (
              <button
                key={exercise.id}
                onClick={() => handleToggle(exercise.id)}
                className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-colors ${
                  selectedExercises.includes(exercise.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <div className={`mr-3 h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                    selectedExercises.includes(exercise.id)
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}>
                    {selectedExercises.includes(exercise.id) && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{exercise.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{exercise.modality}</p>
                  </div>
                </div>
              </button>
            ))
          )}
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

function TemplatesModal({
  open,
  templates,
  loading,
  onClose,
  onDelete,
  onRefresh,
  onEdit,  // Add this
  onCreate, // Add this
}: {
  open: boolean;
  templates: WorkoutTemplate[];
  loading: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onEdit: (template: WorkoutTemplate) => void;  // Add this
  onCreate: () => void;  // Add this
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!open) return null;

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 md:items-center md:justify-center">
      <div className="w-full max-h-[80vh] rounded-t-3xl bg-white p-6 md:max-w-2xl md:rounded-2xl flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Workout Templates</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Add Create Button */}
        <div className="mb-4">
          <button
            onClick={onCreate}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 font-bold text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-5 w-5" />
            Create New Template
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading templates...</p>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No templates yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Click "Create New Template" to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(template)}
                      className="rounded-full bg-blue-50 p-2 text-blue-600 transition-colors hover:bg-blue-100"
                      title="Edit template"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      disabled={deletingId === template.id}
                      className="rounded-full bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                      title="Delete template"
                    >
                      {deletingId === template.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateEditorModal({
  open,
  templateName: initialName,
  templateExercises: initialExercises,
  onClose,
  onSave,
}: {
  open: boolean;
  templateName: string;
  templateExercises: Exercise[];
  onClose: () => void;
  onSave: (name: string, exercises: Exercise[]) => Promise<void>; // Change this
}) {
  const [name, setName] = useState(initialName);
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises.map(ex => ({ ...ex })));
  const [selectedExercise, setSelectedExercise] = useState<{ id: string; name: string; modality: "strength" | "cardio" | "calisthenics" } | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [allExercises, setAllExercises] = useState<ExerciseDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [strengthSets, setStrengthSets] = useState<{ reps: string; weight: string }[]>([{ reps: "10", weight: "135" }]);
  const [cardioData, setCardioData] = useState<{ duration: string; distance: string }>({ duration: "30", distance: "5" });
  const [calisthenicsSets, setCalisthenicsSets] = useState<{ reps: string; duration?: string }[]>([{ reps: "10" }]);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setExercises(initialExercises.map(ex => ({ ...ex })));
      loadAllExercises();
    }
  }, [open, initialName, initialExercises]);

  const loadAllExercises = async () => {
    try {
      const all = await getAllExercises();
      setAllExercises(all);
    } catch (error) {
      console.error("Failed to load exercises", error);
    }
  };

  const handleExerciseSelect = (id: string, exerciseName: string, modality: "strength" | "cardio" | "calisthenics") => {
    setSelectedExercise({ id, name: exerciseName, modality });
    if (modality === "cardio") {
      setCardioData({ duration: "30", distance: "5" });
    } else if (modality === "calisthenics") {
      setCalisthenicsSets([{ reps: "10" }]);
    } else {
      setStrengthSets([{ reps: "10", weight: "135" }]);
    }
  };

  const startEditingExercise = (idx: number) => {
    const ex = exercises[idx];
    setEditingIndex(idx);
    setSelectedExercise({
      id: ex.exerciseId ?? "",
      name: ex.name,
      modality: ex.modality,
    });

    if (ex.modality === "strength") {
      setStrengthSets(
        ex.strengthSets?.map((s) => ({
          reps: String(s.reps),
          weight: String(s.weight),
        })) ?? [{ reps: "10", weight: "135" }]
      );
    } else if (ex.modality === "cardio") {
      setCardioData({
        duration: ex.cardioData ? String(Math.round(ex.cardioData.duration / 60)) : "30",
        distance: ex.cardioData?.distance != null ? String(ex.cardioData.distance) : "5",
      });
    } else {
      setCalisthenicsSets(
        ex.calisthenicsSets?.map((s) => ({
          reps: String(s.reps),
          duration: s.duration != null ? String(s.duration) : undefined,
        })) ?? [{ reps: "10" }]
      );
    }
  };

  const addExercise = () => {
    if (!selectedExercise) return;

    let exercise: Exercise;

    if (selectedExercise.modality === "cardio") {
      const durationMinutes = Number(cardioData.duration);
      const duration = durationMinutes * 60;
      const distance = cardioData.distance ? Number(cardioData.distance) : undefined;

      exercise = {
        exerciseId: selectedExercise.id,
        name: selectedExercise.name,
        modality: "cardio",
        cardioData: {
          duration,
          distance: distance && isFinite(distance) && distance > 0 ? distance : undefined,
          pace: distance && distance > 0 && duration > 0 ? duration / distance : undefined,
        },
      };
    } else if (selectedExercise.modality === "calisthenics") {
      const sets = calisthenicsSets
        .map((s) => {
          const reps = Number(s.reps);
          const duration = s.duration ? Number(s.duration) : undefined;
          if (!isFinite(reps) || reps <= 0) return null;
          const setObj: { reps: number; duration?: number } = { reps };
          if (duration && isFinite(duration) && duration > 0) {
            setObj.duration = duration;
          }
          return setObj;
        })
        .filter((s): s is { reps: number; duration?: number } => s !== null);

      if (sets.length === 0) {
        toast.error("Add at least one valid set with reps.");
        return;
      }

      exercise = {
        exerciseId: selectedExercise.id,
        name: selectedExercise.name,
        modality: "calisthenics",
        calisthenicsSets: sets,
      };
    } else {
      const sets = strengthSets
        .map((s) => {
          const reps = Number(s.reps);
          const weight = Number(s.weight);
          if (!isFinite(reps) || reps <= 0 || !isFinite(weight) || weight < 0) return null;
          return { reps, weight };
        })
        .filter((s): s is { reps: number; weight: number } => s !== null);

      if (sets.length === 0) {
        toast.error("Add at least one valid set.");
        return;
      }

      exercise = {
        exerciseId: selectedExercise.id,
        name: selectedExercise.name,
        modality: "strength",
        strengthSets: sets,
      };
    }

    setExercises((prev) => {
      if (editingIndex !== null) {
        return prev.map((item, i) => (i === editingIndex ? exercise : item));
      }
      return [...prev, exercise];
    });
    setSelectedExercise(null);
    setEditingIndex(null);
  };

  const removeExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
    setEditingIndex((prev) => (prev !== null && prev === idx ? null : prev !== null && prev > idx ? prev - 1 : prev));
    if (editingIndex === idx) {
      setSelectedExercise(null);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (exercises.length === 0) {
      toast.error("Add at least one exercise");
      return;
    }
    
    // Update parent state before calling onSave
    // We need to pass the values to the parent
    await onSave(name.trim(), exercises); // Pass the values
  };

  if (!open) return null;

  const filteredExercises = allExercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialName ? "Edit Template" : "Create Template"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Template Name */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Leg Day, Chest Day"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Exercises List */}
          {exercises.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                Exercises ({exercises.length})
              </h3>
              <div className="space-y-3">
                {exercises.map((ex, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{ex.name}</h4>
                      <p className="text-sm text-gray-500 capitalize">{ex.modality}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditingExercise(idx)}
                        className="rounded-full bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeExercise(idx)}
                        className="rounded-full bg-red-50 p-2 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Exercise Section */}
          <div className="border-t pt-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Add Exercise</h3>
            
            {!selectedExercise ? (
              <div>
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-blue-500 focus:bg-white"
                />
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredExercises.slice(0, 20).map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleExerciseSelect(ex.id, ex.name, ex.modality)}
                      className="w-full text-left rounded-xl border border-gray-200 bg-white p-3 hover:border-blue-500 hover:bg-blue-50"
                    >
                      <p className="font-semibold text-gray-900">{ex.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{ex.modality}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedExercise.name}</h4>
                    <p className="text-sm text-gray-500 capitalize">{selectedExercise.modality}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedExercise(null);
                      setEditingIndex(null);
                    }}
                    className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    Change
                  </button>
                </div>

                {/* Exercise input based on modality - simplified version */}
                {selectedExercise.modality === "strength" && (
                  <div className="space-y-2">
                    {strengthSets.map((set, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(e) => {
                            const newSets = [...strengthSets];
                            newSets[i].reps = e.target.value;
                            setStrengthSets(newSets);
                          }}
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-2"
                        />
                        <input
                          type="number"
                          placeholder="Weight"
                          value={set.weight}
                          onChange={(e) => {
                            const newSets = [...strengthSets];
                            newSets[i].weight = e.target.value;
                            setStrengthSets(newSets);
                          }}
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-2"
                        />
                        <button
                          onClick={() => setStrengthSets(strengthSets.filter((_, idx) => idx !== i))}
                          className="rounded-lg bg-red-50 px-3 py-2 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setStrengthSets([...strengthSets, { reps: "10", weight: "135" }])}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                    >
                      Add Set
                    </button>
                  </div>
                )}

                {selectedExercise.modality === "cardio" && (
                  <div className="space-y-3">
                    <input
                      type="number"
                      placeholder="Duration (minutes)"
                      value={cardioData.duration}
                      onChange={(e) => setCardioData({ ...cardioData, duration: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Distance (optional)"
                      value={cardioData.distance}
                      onChange={(e) => setCardioData({ ...cardioData, distance: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    />
                  </div>
                )}

                {selectedExercise.modality === "calisthenics" && (
                  <div className="space-y-2">
                    {calisthenicsSets.map((set, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(e) => {
                            const newSets = [...calisthenicsSets];
                            newSets[i].reps = e.target.value;
                            setCalisthenicsSets(newSets);
                          }}
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-2"
                        />
                        <button
                          onClick={() => setCalisthenicsSets(calisthenicsSets.filter((_, idx) => idx !== i))}
                          className="rounded-lg bg-red-50 px-3 py-2 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setCalisthenicsSets([...calisthenicsSets, { reps: "10" }])}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                    >
                      Add Set
                    </button>
                  </div>
                )}

                <button
                  onClick={addExercise}
                  className="mt-4 w-full rounded-xl bg-black px-4 py-3 font-bold text-white"
                >
                  {editingIndex !== null ? "Update Exercise" : "Add Exercise"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 border-t p-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-semibold text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-black px-4 py-3 font-bold text-white"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}