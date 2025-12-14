/**
 * Expo-specific preferences hook
 * Re-exports shared hook with platform-specific preferences service
 */

import { createPreferencesProvider, usePreferences as useSharedPreferences } from "@liftledger/shared/hooks/usePreferences";
import { preferencesService } from "../firebase";

// Create the provider with expo's preferences service
export const PreferencesProvider = createPreferencesProvider(preferencesService);

// Re-export the hook
export { useSharedPreferences as usePreferences };
