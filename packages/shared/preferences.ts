/**
 * Platform-agnostic preferences service
 * 
 * CRITICAL: This file must NOT import from 'expo' or 'next' directly.
 * Platform-specific storage implementations are provided by the platform code.
 */

export type UnitSystem = "metric" | "imperial";
export type DefaultChartView = "week" | "month" | "year";
export type ThemePreference = "system" | "light" | "dark";
export type RestTimerSeconds = 0 | 60 | 90 | 120 | 180;
export type CardioPrDisplay = "pace" | "distance" | "both";
/** Per-activity override for Analytics cardio PR rows. Missing keys use cardioPrDisplay. */
export type CardioPrDisplayByActivity = Partial<
  Record<"run" | "walk" | "hike" | "bike" | "row" | "elliptical" | "swim" | "stair" | "other", CardioPrDisplay>
>;
// TimePeriod is exported from ./analytics/types to avoid duplicate exports

export interface UserPreferences {
  units: UnitSystem;
  defaultChartView: DefaultChartView;
  prNotifications: boolean;
  theme: ThemePreference;
  restTimerSeconds: RestTimerSeconds;
  /** When false (default), hide bodyweight logging and analytics. */
  trackBodyweight: boolean;
  /** When false (default), hide day-log superset pair controls. */
  enableSupersets: boolean;
  /** Default how cardio PRs surface pace vs distance. Overridden per activity when set. */
  cardioPrDisplay: CardioPrDisplay;
  /** Optional per-activity overrides (e.g. run: both, walk: distance). */
  cardioPrDisplayByActivity: CardioPrDisplayByActivity;
}

/**
 * Storage interface for platform-specific implementations
 * Must be implemented by platform code (expo-app or web)
 */
export interface PreferencesStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const PREFERENCES_KEY = "@liftledger:preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
  units: "imperial",
  defaultChartView: "month",
  prNotifications: true,
  theme: "system",
  restTimerSeconds: 0,
  trackBodyweight: false,
  enableSupersets: false,
  cardioPrDisplay: "both",
  cardioPrDisplayByActivity: {},
};

export function resolveCardioPrDisplay(
  prefs: Pick<UserPreferences, "cardioPrDisplay" | "cardioPrDisplayByActivity"> | null | undefined,
  activity: keyof CardioPrDisplayByActivity | string
): CardioPrDisplay {
  const by = prefs?.cardioPrDisplayByActivity;
  if (by && activity in by) {
    const override = by[activity as keyof CardioPrDisplayByActivity];
    if (override) return override;
  }
  return prefs?.cardioPrDisplay ?? "both";
}

/**
 * Create a preferences service with the provided storage implementation
 */
export function createPreferencesService(storage: PreferencesStorage) {
  async function getPreferences(): Promise<UserPreferences> {
    try {
      const stored = await storage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UserPreferences>;
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          cardioPrDisplayByActivity: {
            ...DEFAULT_PREFERENCES.cardioPrDisplayByActivity,
            ...(parsed.cardioPrDisplayByActivity || {}),
          },
        };
      }
      return DEFAULT_PREFERENCES;
    } catch (error) {
      console.error("Error loading preferences:", error);
      return DEFAULT_PREFERENCES;
    }
  }

  async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
    try {
      const current = await getPreferences();
      const updated = { ...current, ...prefs };
      await storage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error saving preferences:", error);
      throw error;
    }
  }

  async function updateUnitSystem(units: UnitSystem): Promise<void> {
    await savePreferences({ units });
  }

  async function updateDefaultChartView(view: DefaultChartView): Promise<void> {
    await savePreferences({ defaultChartView: view });
  }

  async function updatePRNotifications(enabled: boolean): Promise<void> {
    await savePreferences({ prNotifications: enabled });
  }

  async function updateTheme(theme: ThemePreference): Promise<void> {
    await savePreferences({ theme });
  }

  async function updateRestTimerSeconds(restTimerSeconds: RestTimerSeconds): Promise<void> {
    await savePreferences({ restTimerSeconds });
  }

  async function updateTrackBodyweight(trackBodyweight: boolean): Promise<void> {
    await savePreferences({ trackBodyweight });
  }

  async function updateEnableSupersets(enableSupersets: boolean): Promise<void> {
    await savePreferences({ enableSupersets });
  }

  async function updateCardioPrDisplay(cardioPrDisplay: CardioPrDisplay): Promise<void> {
    await savePreferences({ cardioPrDisplay });
  }

  async function updateCardioPrDisplayByActivity(
    cardioPrDisplayByActivity: CardioPrDisplayByActivity
  ): Promise<void> {
    await savePreferences({ cardioPrDisplayByActivity });
  }

  return {
    getPreferences,
    savePreferences,
    updateUnitSystem,
    updateDefaultChartView,
    updatePRNotifications,
    updateTheme,
    updateRestTimerSeconds,
    updateTrackBodyweight,
    updateEnableSupersets,
    updateCardioPrDisplay,
    updateCardioPrDisplayByActivity,
  };
}

// Export constants for use in platform code
export { DEFAULT_PREFERENCES, PREFERENCES_KEY };
