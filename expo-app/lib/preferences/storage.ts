import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PreferencesStorage } from "@liftledger/shared/preferences";

/**
 * Expo-specific storage implementation using AsyncStorage
 */
export const expoPreferencesStorage: PreferencesStorage = {
  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};
