import React, { useState, useEffect, createContext, useContext } from "react";
import { getPreferences, UserPreferences, UnitSystem, DefaultChartView } from "../preferences";

interface PreferencesContextType {
  preferences: UserPreferences | null;
  loading: boolean;
  refresh: () => Promise<void>;
  units: UnitSystem;
  defaultChartView: DefaultChartView;
  prNotifications: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPreferences = async () => {
    try {
      const prefs = await getPreferences();
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

  const value: PreferencesContextType = {
    preferences,
    loading,
    refresh: loadPreferences,
    units: preferences?.units || "imperial",
    defaultChartView: preferences?.defaultChartView || "month",
    prNotifications: preferences?.prNotifications ?? true,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
