import type { PreferencesStorage } from "@liftledger/shared/preferences";
import { logger } from "../logger";

/**
 * Web-specific storage implementation using localStorage
 */
export const webPreferencesStorage: PreferencesStorage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === "undefined") return null;
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      logger.error("Error reading from localStorage", error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      logger.error("Error writing to localStorage", error);
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error("Error removing from localStorage", error);
      throw error;
    }
  },
};
