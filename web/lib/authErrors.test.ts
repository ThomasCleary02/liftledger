import { describe, expect, it } from "vitest";
import { friendlyAuthError } from "./authErrors";

describe("friendlyAuthError", () => {
  it("explains missing local emulator accounts", () => {
    expect(
      friendlyAuthError(
        { code: "auth/user-not-found", message: "Firebase: Error (auth/user-not-found)." },
        { localEmulators: true }
      )
    ).toMatch(/Sign Up/i);
  });

  it("maps production user-not-found without emulator jargon", () => {
    expect(
      friendlyAuthError(
        { code: "auth/user-not-found", message: "Firebase: Error (auth/user-not-found)." },
        { localEmulators: false }
      )
    ).toMatch(/No account found/i);
  });

  it("maps wrong password without leaking Firebase codes", () => {
    const text = friendlyAuthError(
      { code: "auth/invalid-credential", message: "Firebase: Error (auth/invalid-credential)." },
      { localEmulators: false }
    );
    expect(text).not.toMatch(/Firebase|auth\//i);
    expect(text).toMatch(/incorrect/i);
  });
});
