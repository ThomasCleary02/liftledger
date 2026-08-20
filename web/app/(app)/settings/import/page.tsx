"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  STARTER_PROGRAMS,
  parseCsv,
  parseImportFile,
  parseMapped,
  parsePastedWorkout,
  rowsToImportedDays,
  rowsToObjects,
  suggestMapping,
  type ColumnMapping,
  type DistanceUnit,
  type ImportPreview,
  type ImportedDay,
  type WeightUnit,
  type LastImport,
} from "@liftledger/shared";
import { useAuth } from "../../../../providers/Auth";
import { usePreferences } from "../../../../lib/hooks/usePreferences";
import { getAllExercises } from "../../../../lib/firestore/exercises";
import { createTemplate } from "../../../../lib/firestore/workoutTemplates";
import { commitImportedDays, type CommitMode } from "../../../../lib/commitImport";
import { undoLastImport } from "../../../../lib/undoImport";
import { toast } from "../../../../lib/toast";
import { logger } from "../../../../lib/logger";
import { accountService } from "../../../../lib/firebase";

type Tab = "file" | "paste" | "programs";

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ImportSettings() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { units } = usePreferences();
  const [tab, setTab] = useState<Tab>("file");
  const [fileText, setFileText] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(units === "metric" ? "kg" : "lb");
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(units === "metric" ? "km" : "mi");
  const [mode, setMode] = useState<CommitMode>("merge");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [pasteDate, setPasteDate] = useState(todayYmd());
  const [programDate, setProgramDate] = useState(todayYmd());
  const [lastImport, setLastImport] = useState<LastImport | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login");
    else {
      accountService.getLastImport().then(setLastImport).catch(() => setLastImport(null));
    }
  }, [user, router, authLoading]);

  const rebuildPreview = (text: string, nextMapping?: ColumnMapping | null) => {
    const table = parseCsv(text);
    const { headers, records } = rowsToObjects(table);
    if (nextMapping) {
      setPreview(parseMapped(records, headers, { ...nextMapping, weightUnit, distanceUnit }));
      return;
    }
    const parsed = parseImportFile(text, { weightUnit, distanceUnit });
    setPreview(parsed);
    if (parsed.format === "unknown") {
      setMapping(suggestMapping(parsed.headers));
    } else {
      setMapping(null);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setFileText(text);
    const parsed = parseImportFile(text);
    setWeightUnit(parsed.weightUnitGuess);
    setDistanceUnit(parsed.distanceUnitGuess);
    setPreview(parsed);
    if (parsed.format === "unknown") {
      setMapping(suggestMapping(parsed.headers));
    } else {
      setMapping(null);
    }
  };

  useEffect(() => {
    if (!fileText) return;
    rebuildPreview(fileText, mapping?.date && mapping.exercise ? mapping : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightUnit, distanceUnit]);

  const commitDays = async (days: ImportedDay[]) => {
    if (days.length === 0) {
      toast.error("Nothing to import");
      return;
    }
    setBusy(true);
    try {
      const result = await commitImportedDays(days, mode, (done, total) => {
        setProgress(`Saving ${done} of ${total} days…`);
      });
      toast.success(
        `Imported ${result.created} new day${result.created === 1 ? "" : "s"}, merged ${result.merged}, skipped ${result.skipped}`
      );
      const latest = await accountService.getLastImport();
      setLastImport(latest);
      router.push("/day/today");
    } catch (error) {
      logger.error("Import failed", error);
      toast.error("Import failed. Try a smaller file or check the column mapping.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const handleFileImport = async () => {
    if (!preview) return;
    const catalog = await getAllExercises();
    await commitDays(rowsToImportedDays(preview.rows, catalog));
  };

  const handlePasteImport = async () => {
    const rows = parsePastedWorkout(pasteText, pasteDate, weightUnit);
    if (rows.length === 0) {
      toast.error("Could not read that workout. Try lines like “Bench Press 5x5 135”.");
      return;
    }
    const catalog = await getAllExercises();
    await commitDays(rowsToImportedDays(rows, catalog));
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      <header className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto max-w-4xl">
            <button
              onClick={() => router.back()}
              className="mb-2 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Back</span>
            </button>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Import</h1>
            <p className="text-sm text-gray-500">Bring a Strong, Hevy, or spreadsheet log into LiftLedger</p>
          </div>
          <div className="mx-auto mt-4 flex max-w-4xl gap-2">
            {(["file", "paste", "programs"] as Tab[]).map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                  tab === item ? "bg-black text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {item === "file" ? "File" : item === "paste" ? "Paste" : "Programs"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-8">
          {lastImport && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-gray-900">Undo last import</p>
              <p className="mt-1 text-sm text-gray-500">
                Removes sets tagged from {lastImport.dates.length} day{lastImport.dates.length === 1 ? "" : "s"}.
              </p>
              <button
                type="button"
                disabled={busy}
                className="mt-3 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
                onClick={async () => {
                  setBusy(true);
                  try {
                    const result = await undoLastImport();
                    setLastImport(null);
                    toast.success(`Removed imported work from ${result.days} days`);
                  } catch (error) {
                    logger.error("Undo import failed", error);
                    toast.error(error instanceof Error ? error.message : "Could not undo import");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Undo last import
              </button>
            </section>
          )}
          {tab === "file" && (
            <>
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm text-gray-600">
                  Export CSV from Strong or Hevy, or upload a LiftLedger export. Parsing stays on this device.
                </p>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                  className="block w-full text-sm"
                />
              </section>

              {preview && (
                <>
                  <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <p className="font-semibold text-amber-900">Confirm units before saving</p>
                    <p className="mt-1 text-sm text-amber-800">
                      Strong and Hevy files are often metric. A wrong choice writes every set at the wrong weight.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4">
                      <label className="text-sm font-medium text-gray-800">
                        Weight
                        <select
                          className="ml-2 rounded-lg border border-gray-300 px-2 py-1"
                          value={weightUnit}
                          onChange={(event) => setWeightUnit(event.target.value as WeightUnit)}
                        >
                          <option value="lb">pounds (lb)</option>
                          <option value="kg">kilograms (kg)</option>
                        </select>
                      </label>
                      <label className="text-sm font-medium text-gray-800">
                        Distance
                        <select
                          className="ml-2 rounded-lg border border-gray-300 px-2 py-1"
                          value={distanceUnit}
                          onChange={(event) => setDistanceUnit(event.target.value as DistanceUnit)}
                        >
                          <option value="mi">miles</option>
                          <option value="km">kilometers</option>
                        </select>
                      </label>
                    </div>
                  </section>

                  {preview.format === "unknown" && mapping && (
                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <p className="mb-3 font-semibold text-gray-900">Match columns</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(
                          [
                            ["date", "Date", true],
                            ["exercise", "Exercise", true],
                            ["set", "Set", false],
                            ["reps", "Reps", false],
                            ["weight", "Weight", false],
                            ["duration", "Duration", false],
                            ["distance", "Distance", false],
                            ["notes", "Notes", false],
                          ] as const
                        ).map(([key, label, required]) => (
                          <label key={key} className="text-sm text-gray-700">
                            {label}
                            {required ? " *" : ""}
                            <select
                              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2"
                              value={(mapping[key] as string | undefined) || ""}
                              onChange={(event) =>
                                setMapping({
                                  ...mapping,
                                  [key]: event.target.value || undefined,
                                } as ColumnMapping)
                              }
                            >
                              {!required && <option value="">(none)</option>}
                              {preview.headers.map((header) => (
                                <option key={header} value={header}>
                                  {header}
                                </option>
                              ))}
                            </select>
                          </label>
                        ))}
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={mapping.durationIsMinutes === true}
                            onChange={(event) =>
                              setMapping({ ...mapping, durationIsMinutes: event.target.checked })
                            }
                          />
                          Duration is minutes, not seconds
                        </label>
                      </div>
                      <button
                        type="button"
                        className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
                        onClick={() => rebuildPreview(fileText, mapping)}
                      >
                        Apply mapping
                      </button>
                    </section>
                  )}

                  <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="font-semibold text-gray-900">
                      {preview.format === "unknown" ? "Spreadsheet" : preview.format} · {preview.dayCount} days ·{" "}
                      {preview.setCount} sets
                    </p>
                    {preview.dateMin && (
                      <p className="text-sm text-gray-500">
                        {preview.dateMin} to {preview.dateMax}
                      </p>
                    )}
                    {preview.warnings.map((warning) => (
                      <p key={warning} className="mt-2 text-sm text-red-600">
                        {warning}
                      </p>
                    ))}
                    <div className="mt-3 overflow-x-auto text-sm">
                      <table className="min-w-full">
                        <thead>
                          <tr className="text-left text-gray-500">
                            <th className="pr-3">Date</th>
                            <th className="pr-3">Exercise</th>
                            <th className="pr-3">Set</th>
                            <th className="pr-3">Reps</th>
                            <th>Weight (lb)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.sample.map((row, index) => (
                            <tr key={`${row.date}-${row.exerciseName}-${index}`}>
                              <td className="pr-3 py-1">{row.date}</td>
                              <td className="pr-3 py-1">{row.exerciseName}</td>
                              <td className="pr-3 py-1">{row.setIndex}</td>
                              <td className="pr-3 py-1">{row.reps ?? ""}</td>
                              <td className="py-1">{row.weightLbs != null ? Math.round(row.weightLbs) : ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 space-y-2">
                      <label className="flex items-center gap-2 text-sm text-gray-800">
                        <input
                          type="radio"
                          checked={mode === "merge"}
                          onChange={() => setMode("merge")}
                        />
                        Merge into days that already have work
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-800">
                        <input
                          type="radio"
                          checked={mode === "skipExisting"}
                          onChange={() => setMode("skipExisting")}
                        />
                        Skip dates that already have sets
                      </label>
                    </div>
                    <button
                      type="button"
                      disabled={busy || preview.rows.length === 0}
                      onClick={handleFileImport}
                      className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-300"
                    >
                      {busy ? progress || "Saving…" : "Import into my log"}
                    </button>
                  </section>
                </>
              )}
            </>
          )}

          {tab === "paste" && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <p className="text-sm text-gray-600">
                One exercise per line. Examples: <code>Bench Press 5x5 135</code>, <code>Squat 5 225</code>,{" "}
                <code>Easy run 30 min</code>
              </p>
              <label className="block text-sm font-medium text-gray-700">
                Date
                <input
                  type="date"
                  value={pasteDate}
                  onChange={(event) => setPasteDate(event.target.value)}
                  className="mt-1 block rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Weights in this paste
                <select
                  className="ml-2 rounded-lg border border-gray-300 px-2 py-1"
                  value={weightUnit}
                  onChange={(event) => setWeightUnit(event.target.value as WeightUnit)}
                >
                  <option value="lb">lb</option>
                  <option value="kg">kg</option>
                </select>
              </label>
              <textarea
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                rows={10}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                placeholder={"Bench Press 5x5 135\nRow 3x8 155\nEasy run 30 min"}
              />
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={mode === "merge"} onChange={() => setMode("merge")} />
                  Merge if that date already has work
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={mode === "skipExisting"}
                    onChange={() => setMode("skipExisting")}
                  />
                  Skip if that date already has sets
                </label>
              </div>
              <button
                type="button"
                disabled={busy || !pasteText.trim()}
                onClick={handlePasteImport}
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:bg-gray-300"
              >
                {busy ? "Saving…" : "Save workout"}
              </button>
            </section>
          )}

          {tab === "programs" && (
            <section className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Load onto date
                <input
                  type="date"
                  value={programDate}
                  onChange={(event) => setProgramDate(event.target.value)}
                  className="ml-2 rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
              {STARTER_PROGRAMS.map((program) => (
                <div key={program.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <p className="font-semibold text-gray-900">{program.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{program.description}</p>
                  <p className="mt-2 text-sm text-gray-700">
                    {program.exercises.map((exercise) => exercise.name).join(" · ")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white"
                      onClick={() =>
                        commitDays([
                          { date: programDate, isRestDay: false, exercises: program.exercises },
                        ])
                      }
                    >
                      Add to that day
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800"
                      onClick={async () => {
                        try {
                          await createTemplate({ name: program.name, exercises: program.exercises });
                          toast.success("Saved to your templates");
                        } catch (error) {
                          logger.error("Template save failed", error);
                          toast.error("Could not save template");
                        }
                      }}
                    >
                      Save as template
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
