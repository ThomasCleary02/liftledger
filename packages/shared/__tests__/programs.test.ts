import { describe, expect, it } from "vitest";
import { STARTER_PROGRAMS } from "../programs/starters";
import { createPreferencesService, type PreferencesStorage } from "../preferences";

describe("starter programs", () => {
  it("has unique ids and only finite stored pounds", () => {
    const ids = STARTER_PROGRAMS.map((program) => program.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const program of STARTER_PROGRAMS) {
      expect(program.exercises.length).toBeGreaterThan(0);
      for (const exercise of program.exercises) {
        for (const set of exercise.strengthSets || []) {
          expect(Number.isFinite(set.weight)).toBe(true);
          expect(set.weight).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("preferences service", () => {
  it("loads defaults and merges saved values", async () => {
    const store = new Map<string, string>();
    const storage: PreferencesStorage = {
      async getItem(key) {
        return store.get(key) ?? null;
      },
      async setItem(key, value) {
        store.set(key, value);
      },
      async removeItem(key) {
        store.delete(key);
      },
    };
    const prefs = createPreferencesService(storage);
    expect((await prefs.getPreferences()).units).toBe("imperial");
    await prefs.updateUnitSystem("metric");
    expect((await prefs.getPreferences()).units).toBe("metric");
    expect((await prefs.getPreferences()).theme).toBe("system");
    await prefs.updateTheme("dark");
    await prefs.updateRestTimerSeconds(90);
    expect((await prefs.getPreferences()).theme).toBe("dark");
    expect((await prefs.getPreferences()).restTimerSeconds).toBe(90);
  });
});
