/**
 * Platform-agnostic usePreferences hook
 * 
 * CRITICAL: This file must NOT import from 'expo' or 'next' directly.
 * The preferences service is provided by platform code via firebase.ts
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type {
  UserPreferences,
  UnitSystem,
  DefaultChartView,
} from "../preferences";

/**
 * Preferences service interface
 * Must be provided by platform code
 */
export interface PreferencesService {
  getPreferences(): Promise<UserPreferences>;
  savePreferences(prefs: Partial<UserPreferences>): Promise<void>;
  updateUnitSystem(units: UnitSystem): Promise<void>;
  updateDefaultChartView(view: DefaultChartView): Promise<void>;
  updatePRNotifications(enabled: boolean): Promise<void>;
}

type PreferencesContextType = {
  preferences: UserPreferences | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateUnits: (units: UnitSystem) => Promise<void>;
  updateChartView: (view: DefaultChartView) => Promise<void>;
  updatePRNotifications: (enabled: boolean) => Promise<void>;
  // Convenience getters
  units: UnitSystem;
  defaultChartView: DefaultChartView;
  prNotifications: boolean;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

/**
 * PreferencesProvider - must be provided with a preferencesService from platform code
 */
export function createPreferencesProvider(service: PreferencesService) {
  return function PreferencesProvider({ children }: { children: ReactNode }) {
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [loading, setLoading] = useState(true);

    const loadPreferences = async () => {
      try {
        const prefs = await service.getPreferences();
        setPreferences(prefs);
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      loadPreferences();
    }, []);

    const updateUnits = async (units: UnitSystem) => {
      await service.updateUnitSystem(units);
      await loadPreferences();
    };

    const updateChartView = async (view: DefaultChartView) => {
      await service.updateDefaultChartView(view);
      await loadPreferences();
    };

    const updatePRNotifs = async (enabled: boolean) => {
      await service.updatePRNotifications(enabled);
      await loadPreferences();
    };

    const value: PreferencesContextType = {
      preferences,
      loading,
      refresh: loadPreferences,
      updateUnits,
      updateChartView,
      updatePRNotifications: updatePRNotifs,
      units: preferences?.units || "imperial",
      defaultChartView: preferences?.defaultChartView || "month",
      prNotifications: preferences?.prNotifications ?? true,
    };

    return (
      <PreferencesContext.Provider value={value}>
        {children}
      </PreferencesContext.Provider>
    );
  };
}

/**
 * usePreferences hook - must be used within PreferencesProvider
 */
export function usePreferences(): PreferencesContextType {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
