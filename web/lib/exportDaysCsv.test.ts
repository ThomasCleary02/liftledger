import { describe, expect, it } from "vitest";
import type { Day } from "@liftledger/shared/firestore/days";
import { daysToCsv } from "./exportDaysCsv";

function day(partial: Partial<Day> & Pick<Day, "date">): Day {
  return {
    id: `u_${partial.date}`,
    userId: "u",
    isRestDay: false,
    exercises: [],
    createdAt: {} as Day["createdAt"],
    updatedAt: {} as Day["updatedAt"],
    ...partial,
  };
}

describe("daysToCsv", () => {
  it("exports rest days, strength sets, and quoted notes", () => {
    const csv = daysToCsv(
      [
        day({ date: "2026-01-02", isRestDay: true, notes: 'easy, "off"' }),
        day({
          date: "2026-01-01",
          exercises: [
            {
              name: "Bench Press",
              modality: "strength",
              strengthSets: [{ reps: 5, weight: 135 }],
            },
          ],
        }),
      ],
      "imperial"
    );
    const lines = csv.trim().split("\n");
    expect(lines[0]).toContain("weight_lb");
    expect(lines[1]).toContain("2026-01-01");
    expect(lines[1]).toContain("Bench Press");
    expect(lines[1]).toContain("135");
    expect(lines[2]).toContain("2026-01-02");
    expect(lines[2]).toContain("true");
    expect(lines[2]).toContain('"easy, ""off"""');
  });
});
