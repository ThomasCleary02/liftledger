import { describe, expect, it } from "vitest";
import { detectFormat, guessDistanceUnit, guessWeightUnit } from "../import/detect";
import { suggestMapping } from "../import/mapping";
import { parseImportFile, parseMapped } from "../import/parseFile";
import { parsePastedWorkout } from "../import/paste";
import { parseStrongLike, recordsToRows, weightToLbs } from "../import/rows";
import { rowsToImportedDays } from "../import/toDays";

describe("import detect + mapping", () => {
  it("detects Strong, Hevy, and LiftLedger headers", () => {
    expect(detectFormat(["Exercise Name", "Set Order", "Date"])).toBe("strong");
    expect(detectFormat(["Exercise Title", "Weight kg", "Start Time"])).toBe("hevy");
    expect(detectFormat(["date", "exercise", "modality"])).toBe("liftledger");
    expect(detectFormat(["foo", "bar"])).toBe("unknown");
  });

  it("guesses units from headers", () => {
    expect(guessWeightUnit(["Weight (kg)"])).toBe("kg");
    expect(guessWeightUnit(["Weight"])).toBe("lb");
    expect(guessDistanceUnit(["Distance km"])).toBe("km");
  });

  it("suggests a column mapping", () => {
    const mapping = suggestMapping(["Date", "Exercise Name", "Reps", "Weight"]);
    expect(mapping.date).toBe("Date");
    expect(mapping.exercise).toBe("Exercise Name");
    expect(mapping.reps).toBe("Reps");
    expect(mapping.weight).toBe("Weight");
  });
});

describe("parseImportFile", () => {
  it("parses a Strong CSV", () => {
    const csv = [
      "Date,Workout Name,Exercise Name,Set Order,Weight,Reps",
      "2026-08-01,Push,Bench Press,1,135,5",
      "2026-08-01,Push,Bench Press,W2,95,8",
    ].join("\n");
    const preview = parseImportFile(csv);
    expect(preview.format).toBe("strong");
    expect(preview.dayCount).toBe(1);
    expect(preview.rows[0]).toMatchObject({ exerciseName: "Bench Press", weightLbs: 135, reps: 5 });
    expect(preview.rows[1].warmup).toBe(true);
  });

  it("parses a LiftLedger CSV including rest days", () => {
    const csv = [
      "date,restDay,exercise,modality,set,reps,weight_lb",
      "2026-08-02,true,,,,,,",
      "2026-08-03,false,Squat,strength,1,5,185",
    ].join("\n");
    const preview = parseImportFile(csv);
    expect(preview.format).toBe("liftledger");
    expect(preview.rows.some((row) => row.restDay)).toBe(true);
    expect(preview.rows.find((row) => row.exerciseName === "Squat")?.weightLbs).toBe(185);
  });

  it("parses Hevy kg weights into stored pounds", () => {
    const csv = [
      "start_time,exercise_title,set_index,weight_kg,reps",
      "2026-08-04,Bench Press,1,60,5",
    ].join("\n");
    const preview = parseImportFile(csv);
    expect(preview.format).toBe("hevy");
    expect(preview.rows[0].weightLbs).toBeCloseTo(60 / 0.453592, 3);
  });

  it("asks for mapping on unknown headers", () => {
    const preview = parseImportFile("col_a,col_b\n1,2");
    expect(preview.format).toBe("unknown");
    expect(preview.warnings?.[0]).toMatch(/column matching/i);
  });

  it("applies a manual mapping", () => {
    const preview = parseMapped(
      [{ When: "2026-08-05", Lift: "OHP", R: "8", W: "75" }],
      ["When", "Lift", "R", "W"],
      {
        date: "When",
        exercise: "Lift",
        reps: "R",
        weight: "W",
        weightUnit: "lb",
        distanceUnit: "mi",
        durationIsMinutes: false,
      }
    );
    expect(preview.rows[0]).toMatchObject({ exerciseName: "OHP", reps: 8, weightLbs: 75 });
  });
});

describe("rows and paste", () => {
  it("parses Strong-like records via recordsToRows", () => {
    const preview = recordsToRows(
      [
        {
          Date: "2026-01-02",
          "Exercise Name": "Row",
          "Set Order": "1",
          Weight: "135",
          Reps: "8",
        },
      ],
      (record, units) => parseStrongLike(record, units),
      ["Date", "Exercise Name", "Set Order", "Weight", "Reps"],
      "strong"
    );
    expect(preview.setCount).toBe(1);
    expect(preview.rows[0].exerciseName).toBe("Row");
  });

  it("converts kg paste weights to pounds", () => {
    expect(weightToLbs(100, "kg")).toBeCloseTo(100 / 0.453592, 3);
    const pasted = parsePastedWorkout("Bench Press 3x5 100", "2026-08-21", "kg");
    expect(pasted.rows).toHaveLength(3);
    expect(pasted.rows[0].weightLbs).toBeCloseTo(100 / 0.453592, 3);
  });

  it("parses one-set, cardio time, and cardio distance paste lines", () => {
    const pasted = parsePastedWorkout(
      ["Squat 5 185", "Run 20 min", "Walk 2 mi", "not a set"].join("\n"),
      "2026-08-21",
      "lb"
    );
    expect(pasted.rows.map((row) => row.exerciseName)).toEqual(["Squat", "Run", "Walk"]);
    expect(pasted.rows[0]).toMatchObject({ reps: 5, weightLbs: 185 });
    expect(pasted.rows[1].durationSeconds).toBe(1200);
    expect(pasted.rows[2].distanceMiles).toBe(2);
    expect(pasted.skipped).toEqual(["not a set"]);
  });
});

describe("rowsToImportedDays", () => {
  it("groups sets, rest days, and cardio", () => {
    const days = rowsToImportedDays([
      { date: "2026-08-01", exerciseName: "", setIndex: 1, restDay: true },
      { date: "2026-08-02", exerciseName: "Bench Press", setIndex: 1, reps: 5, weightLbs: 135 },
      { date: "2026-08-02", exerciseName: "Bench Press", setIndex: 2, reps: 5, weightLbs: 145 },
      { date: "2026-08-03", exerciseName: "Run", setIndex: 1, durationSeconds: 1200, distanceMiles: 2 },
    ]);
    expect(days[0]).toMatchObject({ date: "2026-08-01", isRestDay: true, exercises: [] });
    expect(days[1].exercises[0].strengthSets).toHaveLength(2);
    expect(days[2].exercises[0]).toMatchObject({
      modality: "cardio",
      cardioData: { duration: 1200, distance: 2, activityType: "run" },
    });
  });
});
