import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./firebase", () => ({
  accountService: { getLastImport: vi.fn(), setLastImport: vi.fn() },
}));

vi.mock("./firestore/days", () => ({
  getDayByDate: vi.fn(),
  deleteDay: vi.fn(),
  updateDay: vi.fn(),
}));

import { accountService } from "./firebase";
import { deleteDay, getDayByDate, updateDay } from "./firestore/days";
import { undoLastImport } from "./undoImport";

describe("undoLastImport", () => {
  beforeEach(() => {
    vi.mocked(accountService.getLastImport).mockReset();
    vi.mocked(accountService.setLastImport).mockReset();
    vi.mocked(getDayByDate).mockReset();
    vi.mocked(deleteDay).mockReset();
    vi.mocked(updateDay).mockReset();
  });

  it("throws when there is nothing to undo", async () => {
    vi.mocked(accountService.getLastImport).mockResolvedValue(null);
    await expect(undoLastImport()).rejects.toThrow(/No import to undo/);
  });

  it("deletes days created by the import and strips tagged sets from merged days", async () => {
    vi.mocked(accountService.getLastImport).mockResolvedValue({
      id: "imp_1",
      dates: ["2026-08-01", "2026-08-02"],
      createdDates: ["2026-08-01"],
    } as never);
    vi.mocked(getDayByDate).mockImplementation(async (date: string) => {
      if (date === "2026-08-01") {
        return { id: "d1", exercises: [{ name: "Squat", importId: "imp_1" }] } as never;
      }
      return {
        id: "d2",
        isRestDay: false,
        exercises: [
          { name: "Bench", importId: undefined },
          { name: "Row", importId: "imp_1" },
        ],
      } as never;
    });
    const result = await undoLastImport();
    expect(result.days).toBe(2);
    expect(deleteDay).toHaveBeenCalledWith("d1");
    expect(updateDay).toHaveBeenCalledWith(
      "d2",
      expect.objectContaining({
        exercises: [{ name: "Bench", importId: undefined }],
        importId: null,
      })
    );
    expect(accountService.setLastImport).toHaveBeenCalledWith(null);
  });
});
