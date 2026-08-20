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
// TimePeriod is exported from ./analytics/types to avoid duplicate exports

export interface UserPreferences {
  units: UnitSystem;
  defaultChartView: DefaultChartView;
  prNotifications: boolean;
  theme: ThemePreference;
  restTimerSeconds: RestTimerSeconds;
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
};

/**
 * Create a preferences service with the provided storage implementation
 */
export function createPreferencesService(storage: PreferencesStorage) {
  async function getPreferences(): Promise<UserPreferences> {
    try {
      const stored = await storage.getItem(PREFERENCES_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
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

  return {
    getPreferences,
    savePreferences,
    updateUnitSystem,
    updateDefaultChartView,
    updatePRNotifications,
    updateTheme,
    updateRestTimerSeconds,
  };
}

// Export constants for use in platform code
export { DEFAULT_PREFERENCES, PREFERENCES_KEY };
