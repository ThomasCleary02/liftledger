import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("logger", () => {
  it("stringifies Error details on error logs", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("save failed", new Error("offline"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("save failed"));
    expect(spy.mock.calls[0][0]).toMatch(/Error: offline/);
  });
});
