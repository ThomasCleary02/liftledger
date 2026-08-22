import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./firestore/days", () => ({
  getDayByDate: vi.fn(),
  createDay: vi.fn(),
  updateDay: vi.fn(),
}));

vi.mock("./firebase", () => ({
  accountService: { setLastImport: vi.fn() },
}));

import { accountService } from "./firebase";
import { createDay, getDayByDate, updateDay } from "./firestore/days";
import { commitImportedDays, mergeExercisesOntoDay } from "./commitImport";

describe("commitImportedDays", () => {
  beforeEach(() => {
    vi.mocked(getDayByDate).mockReset();
    vi.mocked(createDay).mockReset();
    vi.mocked(updateDay).mockReset();
    vi.mocked(accountService.setLastImport).mockReset();
  });

  it("creates missing days and tags exercises with an import id", async () => {
    vi.mocked(getDayByDate).mockResolvedValue(null);
    vi.mocked(createDay).mockResolvedValue(undefined as never);
    const result = await commitImportedDays(
      [
        {
          date: "2026-08-01",
          isRestDay: false,
          exercises: [{ name: "Squat", modality: "strength", strengthSets: [{ reps: 5, weight: 135 }] }],
        },
      ],
      "merge"
    );
    expect(result.created).toBe(1);
    expect(createDay).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2026-08-01",
        exercises: [expect.objectContaining({ name: "Squat", importId: result.importId })],
      })
    );
    expect(accountService.setLastImport).toHaveBeenCalled();
  });

  it("skips days that already have work", async () => {
    vi.mocked(getDayByDate).mockResolvedValue({
      id: "u1_2026-08-01",
      exercises: [{ name: "Bench", modality: "strength", strengthSets: [{ reps: 5, weight: 135 }] }],
    } as never);
    const result = await commitImportedDays(
      [
        {
          date: "2026-08-01",
          isRestDay: false,
          exercises: [{ name: "Squat", modality: "strength", strengthSets: [{ reps: 5, weight: 185 }] }],
        },
      ],
      "skipExisting"
    );
    expect(result.skipped).toBe(1);
    expect(updateDay).not.toHaveBeenCalled();
  });
});

describe("mergeExercisesOntoDay", () => {
  beforeEach(() => {
    vi.mocked(getDayByDate).mockReset();
    vi.mocked(createDay).mockReset();
    vi.mocked(updateDay).mockReset();
  });

  it("appends to an existing day", async () => {
    vi.mocked(getDayByDate).mockResolvedValue({
      id: "u1_2026-08-01",
      notes: "hi",
      exercises: [{ name: "Bench", modality: "strength" }],
    } as never);
    await mergeExercisesOntoDay("2026-08-01", [{ name: "Row", modality: "strength" }], "more");
    expect(updateDay).toHaveBeenCalledWith(
      "u1_2026-08-01",
      expect.objectContaining({
        isRestDay: false,
        exercises: [{ name: "Bench", modality: "strength" }, { name: "Row", modality: "strength" }],
      })
    );
  });
});
