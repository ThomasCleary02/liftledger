import { afterEach, describe, expect, it } from "vitest";
import {
  lockFullScreenChrome,
  resetFullScreenChromeForTests,
  unlockFullScreenChrome,
} from "./fullScreenChrome";

afterEach(() => {
  resetFullScreenChromeForTests();
});

describe("fullScreenChrome", () => {
  it("keeps the tab bar hidden until the last sheet unlocks", () => {
    lockFullScreenChrome();
    lockFullScreenChrome();
    expect(document.documentElement.classList.contains("add-modal-open")).toBe(true);
    unlockFullScreenChrome();
    expect(document.documentElement.classList.contains("add-modal-open")).toBe(true);
    unlockFullScreenChrome();
    expect(document.documentElement.classList.contains("add-modal-open")).toBe(false);
  });
});
