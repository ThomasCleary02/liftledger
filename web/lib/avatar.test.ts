import { describe, expect, it } from "vitest";
import { clampAvatarCrop } from "./avatar";

describe("clampAvatarCrop", () => {
  it("keeps a square crop inside the source image", () => {
    expect(clampAvatarCrop({ sx: -20, sy: 900, size: 400 }, 200, 200)).toEqual({
      sx: 0,
      sy: 0,
      size: 200,
    });
  });
});
