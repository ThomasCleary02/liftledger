/**
 * Platform-agnostic preferences service
 * 
 * CRITICAL: This file must NOT import from 'expo' or 'next' directly.
 * Platform-specific storage implementations are provided by the platform code.
 */

export type UnitSystem = "metric" | "imperial";
export type DefaultChartView = "week" | "month" | "year";
export type TimePeriod = "week" | "month" | "year" | "all";

export interface UserPreferences {
  units: UnitSystem;
  defaultChartView: DefaultChartView;
  prNotifications: boolean;
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

  return {
    getPreferences,
    savePreferences,
    updateUnitSystem,
    updateDefaultChartView,
    updatePRNotifications,
  };
}

// Export constants for use in platform code
export { DEFAULT_PREFERENCES, PREFERENCES_KEY };
