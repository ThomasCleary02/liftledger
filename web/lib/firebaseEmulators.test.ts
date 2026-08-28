import { describe, expect, it } from "vitest";
import {
  DEMO_PROJECT_ID,
  emulatorFirebaseConfig,
  shouldUseFirebaseEmulators,
} from "./firebaseEmulators";

describe("shouldUseFirebaseEmulators", () => {
  it("is on for next dev so local traffic cannot reach production", () => {
    expect(shouldUseFirebaseEmulators("development", undefined)).toBe(true);
    expect(shouldUseFirebaseEmulators("development", "")).toBe(true);
  });

  it("stays off for production builds and tests", () => {
    expect(shouldUseFirebaseEmulators("production", undefined)).toBe(false);
    expect(shouldUseFirebaseEmulators("test", undefined)).toBe(false);
  });

  it("can opt back into the live project", () => {
    expect(shouldUseFirebaseEmulators("development", "true")).toBe(false);
  });

  it("uses the demo project id, not the production one", () => {
    expect(emulatorFirebaseConfig.projectId).toBe(DEMO_PROJECT_ID);
    expect(DEMO_PROJECT_ID).toMatch(/^demo-/);
  });
});
