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
  toDisplayWeight,
  weightUnitFromHeaders,
  MAX_IMPORT_CHARS,
  type ColumnMapping,
  type DateOrder,
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
import { commitImportedDays, mergeExercisesOntoDay, type CommitMode } from "../../../../lib/commitImport";
import { undoLastImport } from "../../../../lib/undoImport";
import { toast } from "../../../../lib/toast";
import { logger } from "../../../../lib/logger";
import { accountService } from "../../../../lib/firebase";
import { ConfirmDialog } from "../../../../components/ConfirmDialog";

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
  const [mappingApplied, setMappingApplied] = useState(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(units === "metric" ? "kg" : "lb");
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(units === "metric" ? "km" : "mi");
  const [dateOrder, setDateOrder] = useState<DateOrder>("mdy");
  const [unitsConfirmed, setUnitsConfirmed] = useState(false);
  const [mode, setMode] = useState<CommitMode>("merge");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [pasteDate, setPasteDate] = useState(todayYmd());
  const [programDate, setProgramDate] = useState(todayYmd());
  const [lastImport, setLastImport] = useState<LastImport | null>(null);
  const [undoOpen, setUndoOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "paste" || tabParam === "programs" || tabParam === "file") setTab(tabParam);
    const dateParam = params.get("date");
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      setPasteDate(dateParam);
      setProgramDate(dateParam);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login");
    else {
      accountService.getLastImport().then(setLastImport).catch(() => setLastImport(null));
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (fileText) return;
    setWeightUnit(units === "metric" ? "kg" : "lb");
    setDistanceUnit(units === "metric" ? "km" : "mi");
  }, [units, fileText]);

  const encodedWeight = preview ? weightUnitFromHeaders(preview.headers) : undefined;

  const rebuildPreview = (text: string, nextMapping?: ColumnMapping | null, order?: DateOrder) => {
    const table = parseCsv(text);
    const { headers, records } = rowsToObjects(table);
    const usedOrder = order || dateOrder;
    if (nextMapping) {
      setPreview(
        parseMapped(records, headers, { ...nextMapping, weightUnit, distanceUnit }, usedOrder)
      );
      return;
    }
    const parsed = parseImportFile(text, { weightUnit, distanceUnit, dateOrder: usedOrder });
    setPreview(parsed);
    if (parsed.format === "unknown") {
      setMapping(suggestMapping(parsed.headers));
      setMappingApplied(false);
    } else {
      setMapping(null);
      setMappingApplied(true);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_IMPORT_CHARS) {
      toast.error("File is too large (max 4 MB)");
      return;
    }
    try {
      const text = await file.text();
      setFileText(text);
      setUnitsConfirmed(false);
      setMappingApplied(false);
      const parsed = parseImportFile(text);
      const fromHeaders = weightUnitFromHeaders(parsed.headers);
      setWeightUnit(fromHeaders ?? (units === "metric" ? "kg" : "lb"));
      setDistanceUnit(parsed.distanceUnitGuess);
      if (parsed.dateOrder === "dmy") setDateOrder("dmy");
      else setDateOrder("mdy");
      setPreview(parsed);
      if (parsed.format === "unknown") {
        setMapping(suggestMapping(parsed.headers));
      } else {
        setMapping(null);
        setMappingApplied(true);
      }
    } catch (error) {
      logger.error("Import parse failed", error);
      toast.error(error instanceof Error ? error.message : "Could not read that file");
    }
  };

  useEffect(() => {
    if (!fileText) return;
    rebuildPreview(fileText, mappingApplied && mapping?.date && mapping.exercise ? mapping : null, dateOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightUnit, distanceUnit, dateOrder]);

  const goToImported = (date?: string) => {
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      router.push(`/day/${date}`);
      return;
    }
  };

  const commitDays = async (days: ImportedDay[], afterDate?: string) => {
    if (days.length === 0) {
      toast.error("Nothing to import");
      return;
    }
    if (lastImport) {
      toast.warning("A previous import can still be undone. This save replaces that undo.");
    }
    setBusy(true);
    try {
      const result = await commitImportedDays(days, mode, (done, total) => {
        setProgress(`Saving ${done} of ${total} days…`);
      });
      const failedNote = result.failed ? ` ${result.failed} day${result.failed === 1 ? "" : "s"} failed.` : "";
      toast.success(
        `Imported ${result.created} new day${result.created === 1 ? "" : "s"}, merged ${result.merged}, skipped ${result.skipped}.${failedNote}`
      );
      const latest = await accountService.getLastImport();
      setLastImport(latest);
      goToImported(afterDate || days[days.length - 1]?.date);
    } catch (error) {
      logger.error("Import failed", error);
      const latest = await accountService.getLastImport().catch(() => null);
      if (latest) setLastImport(latest);
      toast.error("Import failed. Try a smaller file or check the column mapping.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const handleFileImport = async () => {
    if (!preview || busy) return;
    setBusy(true);
    try {
      const catalog = await getAllExercises();
      await commitDays(rowsToImportedDays(preview.rows, catalog), preview.dateMax);
    } finally {
      setBusy(false);
    }
  };

  const handlePasteImport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const parsed = parsePastedWorkout(pasteText, pasteDate, weightUnit);
      if (parsed.skipped.length > 0) {
        toast.error(`Skipped ${parsed.skipped.length} line${parsed.skipped.length === 1 ? "" : "s"} that did not match.`);
      }
      if (parsed.capped) {
        toast.error("Stopped at 200 sets. Split the paste if you have more.");
      }
      if (parsed.rows.length === 0) {
        toast.error("Could not read that workout. Try lines like “Bench Press 5x5 135”.");
        return;
      }
      const catalog = await getAllExercises();
      await commitDays(rowsToImportedDays(parsed.rows, catalog), pasteDate);
    } finally {
      setBusy(false);
    }
  };

  const canImportFile =
    Boolean(preview && preview.rows.length > 0 && mappingApplied && unitsConfirmed && !busy);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const displaySystem = weightUnit === "kg" ? "metric" : "imperial";

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
            <p className="kicker mb-1">Bring a log</p>
            <h1 className="mb-2 text-2xl font-semibold text-gray-900 md:text-3xl">Import</h1>
            <p className="text-sm text-gray-500">Bring a Strong, Hevy, or spreadsheet log into LiftLedger</p>
          </div>
          <div className="mx-auto mt-4 flex max-w-4xl gap-2">
            {(["file", "paste", "programs"] as Tab[]).map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                  tab === item ? "bg-brand text-brand-fg" : "bg-gray-100 text-gray-600"
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
                A new import replaces this undo pointer.
              </p>
              <button
                type="button"
                disabled={busy}
                className="mt-3 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
                onClick={() => setUndoOpen(true)}
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
                      Strong files often omit the unit. A wrong choice writes every set at the wrong weight.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4">
                      <label className="text-sm font-medium text-gray-800">
                        Weight
                        <select
                          className="ml-2 rounded-lg border border-gray-300 px-2 py-1 disabled:opacity-60"
                          value={weightUnit}
                          disabled={Boolean(encodedWeight)}
                          onChange={(event) => setWeightUnit(event.target.value as WeightUnit)}
                        >
                          <option value="lb">pounds (lb)</option>
                          <option value="kg">kilograms (kg)</option>
                        </select>
                        {encodedWeight ? (
                          <span className="ml-2 text-xs text-amber-800">Read from column headers</span>
                        ) : null}
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
                    {preview.dateOrder === "ambiguous" && (
                      <div className="mt-3 space-y-1 text-sm text-gray-800">
                        <p className="font-medium">Dates like 03/04/2024 — which is first?</p>
                        <label className="flex items-center gap-2">
                          <input type="radio" checked={dateOrder === "mdy"} onChange={() => setDateOrder("mdy")} />
                          Month / day (US)
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" checked={dateOrder === "dmy"} onChange={() => setDateOrder("dmy")} />
                          Day / month
                        </label>
                      </div>
                    )}
                    <label className="mt-4 flex items-start gap-2 text-sm font-medium text-gray-900">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={unitsConfirmed}
                        onChange={(event) => setUnitsConfirmed(event.target.checked)}
                      />
                      I confirmed kg vs lb (and date order if shown)
                    </label>
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
                              onChange={(event) => {
                                setMappingApplied(false);
                                setMapping({
                                  ...mapping,
                                  [key]: event.target.value || undefined,
                                } as ColumnMapping);
                              }}
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
                            onChange={(event) => {
                              setMappingApplied(false);
                              setMapping({ ...mapping, durationIsMinutes: event.target.checked });
                            }}
                          />
                          Duration is minutes, not seconds
                        </label>
                      </div>
                      <button
                        type="button"
                        className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
                        onClick={() => {
                          if (!mapping) return;
                          rebuildPreview(fileText, mapping, dateOrder);
                          setMappingApplied(true);
                        }}
                      >
                        Apply mapping
                      </button>
                      {!mappingApplied && (
                        <p className="mt-2 text-sm text-gray-500">Apply mapping before import.</p>
                      )}
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
                            <th>Weight ({weightUnit})</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.sample.map((row, index) => (
                            <tr key={`${row.date}-${row.exerciseName}-${index}`}>
                              <td className="pr-3 py-1">{row.date}</td>
                              <td className="pr-3 py-1">{row.exerciseName}</td>
                              <td className="pr-3 py-1">{row.setIndex}{row.warmup ? " W" : ""}</td>
                              <td className="pr-3 py-1">{row.reps ?? ""}</td>
                              <td className="py-1">
                                {row.weightLbs != null
                                  ? Math.round(toDisplayWeight(row.weightLbs, displaySystem) * 10) / 10
                                  : ""}
                              </td>
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
                      disabled={!canImportFile}
                      onClick={handleFileImport}
                      className="btn-primary mt-4 disabled:bg-gray-300"
                    >
                      {busy ? progress || "Saving…" : "Import into my log"}
                    </button>
                    {preview && !canImportFile && !busy && (
                      <p className="mt-2 text-sm text-gray-500">
                        {!unitsConfirmed
                          ? "Confirm kg vs lb above before importing."
                          : !mappingApplied
                            ? "Apply column mapping first."
                            : preview.rows.length === 0
                              ? "Nothing to import yet."
                              : null}
                      </p>
                    )}
                  </section>
                </>
              )}
            </>
          )}

          {tab === "paste" && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
              <p className="text-sm text-gray-600">
                One exercise per line. Examples:{" "}
                {weightUnit === "kg" ? (
                  <>
                    <code>Bench Press 5x5 60</code>, <code>Squat 5 100</code>
                  </>
                ) : (
                  <>
                    <code>Bench Press 5x5 135</code>, <code>Squat 5 225</code>
                  </>
                )}
                , <code>Easy run 30 min</code>
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
                className="btn-primary disabled:bg-gray-300"
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
              <p className="text-sm text-gray-500">
                Starter loads are example pounds. Edit the weights after you add the day.
              </p>
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
                      className="btn-primary px-3 py-2"
                      onClick={async () => {
                        if (busy) return;
                        setBusy(true);
                        try {
                          await mergeExercisesOntoDay(programDate, program.exercises);
                          toast.success(`Added ${program.name} to that day`);
                          router.push(`/day/${programDate}`);
                        } catch (error) {
                          logger.error("Program load failed", error);
                          toast.error("Could not add program to that day");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Add to that day
                    </button>
                    <button
                      type="button"
                      disabled={busy || savingTemplate === program.id}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800"
                      onClick={async () => {
                        if (savingTemplate) return;
                        setSavingTemplate(program.id);
                        try {
                          await createTemplate({ name: program.name, exercises: program.exercises });
                          toast.success("Saved to your templates");
                        } catch (error) {
                          logger.error("Template save failed", error);
                          toast.error("Could not save template");
                        } finally {
                          setSavingTemplate(null);
                        }
                      }}
                    >
                      {savingTemplate === program.id ? "Saving…" : "Save as template"}
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
      <ConfirmDialog
        open={undoOpen}
        title="Undo last import?"
        message="This removes imported sets from those days. Work you logged by hand stays."
        confirmText="Undo import"
        danger
        onCancel={() => setUndoOpen(false)}
        onConfirm={async () => {
          setUndoOpen(false);
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
      />
    </div>
  );
}
