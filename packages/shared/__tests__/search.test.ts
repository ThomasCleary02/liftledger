import { describe, expect, it } from "vitest";
import type { ExerciseDoc } from "../firestore/exercises";
import { searchExerciseCatalog } from "../firestore/exercises";

function doc(name: string, extra: Partial<ExerciseDoc> = {}): ExerciseDoc {
  return {
    id: name.toLowerCase().replace(/\s+/g, "_"),
    name,
    nameFolded: name.toLowerCase(),
    modality: extra.modality ?? "strength",
    muscleGroup: extra.muscleGroup,
    ...extra,
  };
}

describe("searchExerciseCatalog", () => {
  const catalog = [
    doc("Bench Press", { muscleGroup: "chest" }),
    doc("Bench Dip", { muscleGroup: "triceps", modality: "calisthenics" }),
    doc("Incline Bench Press", { muscleGroup: "chest" }),
    doc("Squat", { muscleGroup: "legs" }),
    doc("Overhead Press", { muscleGroup: "shoulders" }),
  ];

  it("ranks Bench Press above Bench Dip for query bench", () => {
    const names = searchExerciseCatalog(catalog, "bench").map((item) => item.name);
    expect(names[0]).toBe("Bench Press");
    expect(names.indexOf("Bench Press")).toBeLessThan(names.indexOf("Bench Dip"));
  });

  it("matches abbreviations like bp and ohp", () => {
    expect(searchExerciseCatalog(catalog, "bp")[0].name).toBe("Bench Press");
    expect(searchExerciseCatalog(catalog, "ohp")[0].name).toBe("Overhead Press");
  });

  it("filters by muscle group and modality", () => {
    const chest = searchExerciseCatalog(catalog, "", { muscleGroup: "chest" });
    expect(chest.every((item) => item.muscleGroup === "chest")).toBe(true);
    const calisthenics = searchExerciseCatalog(catalog, "bench", { modality: "calisthenics" });
    expect(calisthenics.map((item) => item.name)).toEqual(["Bench Dip"]);
  });

  it("returns alphabetical catalog when the query is empty", () => {
    const names = searchExerciseCatalog(catalog, "").map((item) => item.name);
    expect(names).toEqual([...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));
  });
});
