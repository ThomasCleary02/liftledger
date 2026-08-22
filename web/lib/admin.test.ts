import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdminEmail } from "./admin";

describe("isAdminEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("matches a trimmed case-insensitive allowlist", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_EMAILS", "thomcleary15@gmail.com, Other@X.com");
    expect(isAdminEmail("thomcleary15@gmail.com")).toBe(true);
    expect(isAdminEmail("  OTHER@x.com ")).toBe(true);
    expect(isAdminEmail("nope@x.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });

  it("denies everyone when the allowlist is empty", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_EMAILS", "");
    expect(isAdminEmail("thomcleary15@gmail.com")).toBe(false);
  });
});
