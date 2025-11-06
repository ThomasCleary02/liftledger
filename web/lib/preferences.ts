import { logger } from "./logger";

export type UnitSystem = "metric" | "imperial";
export type DefaultChartView = "week" | "month" | "year";
export type TimePeriod = "week" | "month" | "year" | "all";

export interface UserPreferences {
  units: UnitSystem;
  defaultChartView: DefaultChartView;
  prNotifications: boolean;
}

const PREFERENCES_KEY = "@liftledger:preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
  units: "imperial",
  defaultChartView: "month",
  prNotifications: true,
};

export function getPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    logger.error("Error loading preferences", error);
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: Partial<UserPreferences>): void {
  if (typeof window === "undefined") return;
  
  try {
    const current = getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    logger.error("Error saving preferences", error);
    throw error;
  }
}

export function updateUnitSystem(units: UnitSystem): void {
  savePreferences({ units });
}

export function updateDefaultChartView(view: DefaultChartView): void {
  savePreferences({ defaultChartView: view });
}

export function updatePRNotifications(enabled: boolean): void {
  savePreferences({ prNotifications: enabled });
}
