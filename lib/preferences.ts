import AsyncStorage from "@react-native-async-storage/async-storage";

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

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error("Error loading preferences:", error);
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  try {
    const current = await getPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving preferences:", error);
    throw error;
  }
}

export async function updateUnitSystem(units: UnitSystem): Promise<void> {
  await savePreferences({ units });
}

export async function updateDefaultChartView(view: DefaultChartView): Promise<void> {
  await savePreferences({ defaultChartView: view });
}

export async function updatePRNotifications(enabled: boolean): Promise<void> {
  await savePreferences({ prNotifications: enabled });
}
