"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  getPreferences,
  savePreferences,
  updateUnitSystem,
  updateDefaultChartView,
  updatePRNotifications,
  type UserPreferences,
  type UnitSystem,
  type DefaultChartView,
} from "../preferences";
import React from "react";

type PreferencesCtx = {
  preferences: UserPreferences;
  loading: boolean;
  updateUnits: (units: UnitSystem) => void;
  updateChartView: (view: DefaultChartView) => void;
  updatePRNotifications: (enabled: boolean) => void;
};

const Ctx = createContext<PreferencesCtx | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(getPreferences());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPreferences(getPreferences());
    setLoading(false);
  }, []);

  const updateUnits = (units: UnitSystem) => {
    updateUnitSystem(units);
    setPreferences(prev => ({ ...prev, units }));
  };

  const updateChartView = (view: DefaultChartView) => {
    updateDefaultChartView(view);
    setPreferences(prev => ({ ...prev, defaultChartView: view }));
  };

  const updatePRNotifs = (enabled: boolean) => {
    updatePRNotifications(enabled);
    setPreferences(prev => ({ ...prev, prNotifications: enabled }));
  };

  return (
    <Ctx.Provider value={{ preferences, loading, updateUnits, updateChartView, updatePRNotifications: updatePRNotifs }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePreferences() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePreferences must be used within PreferencesProvider");
  return v;
}