import type { Day } from "@liftledger/shared/firestore/days";
import type { UnitSystem } from "@liftledger/shared/preferences";
import {
  getDistanceUnit,
  getWeightUnit,
  toDisplayDistance,
  toDisplayWeight,
} from "@liftledger/shared/utils/units";

function csvCell(value: string | number | undefined | null): string {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function daysToCsv(days: Day[], units: UnitSystem = "imperial"): string {
  const weightUnit = getWeightUnit(units);
  const distanceUnit = getDistanceUnit(units);
  const header = [
    "date",
    "restDay",
    "exercise",
    "modality",
    "set",
    "reps",
    `weight_${weightUnit}`,
    "durationSeconds",
    `distance_${distanceUnit}`,
    "cardioType",
    "notes",
  ];
  const rows = [header.join(",")];

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  for (const day of sorted) {
    if (day.isRestDay && day.exercises.length === 0) {
      rows.push(
        [day.date, "true", "", "", "", "", "", "", "", "", csvCell(day.notes)].join(",")
      );
      continue;
    }
    day.exercises.forEach((ex) => {
      if (ex.modality === "strength" && ex.strengthSets) {
        ex.strengthSets.forEach((set, idx) => {
          rows.push(
            [
              day.date,
              "false",
              csvCell(ex.name),
              "strength",
              idx + 1,
              set.reps ?? "",
              set.weight != null ? toDisplayWeight(set.weight, units) : "",
              "",
              "",
              "",
              csvCell(day.notes),
            ].join(",")
          );
        });
      } else if (ex.modality === "cardio" && ex.cardioData) {
        rows.push(
          [
            day.date,
            "false",
            csvCell(ex.name),
            "cardio",
            "",
            "",
            "",
            ex.cardioData.duration ?? "",
            ex.cardioData.distance != null ? toDisplayDistance(ex.cardioData.distance, units) : "",
            ex.cardioData.activityType ?? "",
            csvCell(day.notes),
          ].join(",")
        );
      } else if (ex.modality === "calisthenics" && ex.calisthenicsSets) {
        ex.calisthenicsSets.forEach((set, idx) => {
          rows.push(
            [
              day.date,
              "false",
              csvCell(ex.name),
              "calisthenics",
              idx + 1,
              set.reps ?? "",
              "",
              set.duration ?? "",
              "",
              "",
              csvCell(day.notes),
            ].join(",")
          );
        });
      } else {
        rows.push(
          [
            day.date,
            "false",
            csvCell(ex.name),
            ex.modality,
            "",
            "",
            "",
            "",
            "",
            "",
            csvCell(day.notes),
          ].join(",")
        );
      }
    });
  }

  return rows.join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
