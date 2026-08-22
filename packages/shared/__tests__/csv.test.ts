import { describe, expect, it } from "vitest";
import {
  headerUnit,
  inferDateOrder,
  MAX_IMPORT_CHARS,
  normalizeHeader,
  parseCsv,
  parseDateCell,
  parseNumber,
  pick,
  rowsToObjects,
} from "../import/csv";

describe("csv helpers", () => {
  it("parses commas, quotes, and tabs", () => {
    expect(parseCsv('a,b\n1,"2,3"')).toEqual([
      ["a", "b"],
      ["1", "2,3"],
    ]);
    expect(parseCsv("a\tb\n1\t2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(parseCsv('a,b\n1,""')).toEqual([
      ["a", "b"],
      ["1", ""],
    ]);
  });

  it("parses escaped quotes inside a cell", () => {
    expect(parseCsv('name,note\nfoo,"he said ""hi"""')).toEqual([
      ["name", "note"],
      ["foo", 'he said "hi"'],
    ]);
  });

  it("rejects oversized files", () => {
    expect(() => parseCsv("x".repeat(MAX_IMPORT_CHARS + 1))).toThrow(/too large/i);
  });

  it("normalizes headers and detects units", () => {
    expect(normalizeHeader(" Weight_KG ")).toBe("weight kg");
    expect(headerUnit("Weight (kg)")).toBe("kg");
    expect(headerUnit("weight_kg")).toBe("kg");
    expect(headerUnit("Weight (lbs)")).toBe("lb");
    expect(headerUnit("weight_lb")).toBe("lb");
    expect(headerUnit("weight_lbs")).toBe("lb");
    expect(headerUnit("Distance (km)")).toBe("km");
    expect(headerUnit("distance_mi")).toBe("mi");
    expect(headerUnit("distance_miles")).toBe("mi");
  });

  it("parses numbers and dates", () => {
    expect(parseNumber(" 135 lb ")).toBe(135);
    expect(parseNumber("")).toBeUndefined();
    expect(parseDateCell("2026-08-21")).toBe("2026-08-21");
    expect(parseDateCell("8/21/26", "mdy")).toBe("2026-08-21");
    expect(parseDateCell("21/8/26", "dmy")).toBe("2026-08-21");
    expect(parseDateCell("13/8/26", "mdy")).toBeNull();
  });

  it("infers date order and picks aliased columns", () => {
    expect(inferDateOrder(["2026-01-01"])).toBe("iso");
    expect(inferDateOrder(["21/1/2026"])).toBe("dmy");
    expect(inferDateOrder(["1/21/2026"])).toBe("mdy");
    expect(inferDateOrder(["1/2/2026"])).toBe("ambiguous");
    const { headers, records } = rowsToObjects([
      ["Exercise Name", "Date"],
      ["Bench", "2026-01-01"],
    ]);
    expect(headers[0]).toBe("Exercise Name");
    expect(pick(records[0], ["exercise name"])).toBe("Bench");
  });
});
