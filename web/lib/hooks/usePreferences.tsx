/**
 * Web-specific preferences hook
 * Re-exports shared hook with platform-specific preferences service
 */

"use client";

import { createPreferencesProvider, usePreferences as useSharedPreferences } from "@liftledger/shared/hooks/usePreferences";
import { preferencesService } from "../firebase";

// Create the provider with web's preferences service
export const PreferencesProvider = createPreferencesProvider(preferencesService);

// Re-export the hook
export { useSharedPreferences as usePreferences };
