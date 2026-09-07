import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MyExercisesModal } from "./MyExercisesModal";
import { resetFullScreenChromeForTests } from "./fullScreenChrome";
import type { ExerciseDoc } from "../lib/firestore/exercises";

afterEach(() => {
  cleanup();
  resetFullScreenChromeForTests();
});

const bench: ExerciseDoc = {
  id: "bench_press",
  name: "Bench Press",
  modality: "strength",
  nameFolded: "bench press",
};

describe("MyExercisesModal", () => {
  it("shows the tracked list first, then add", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <MyExercisesModal
        open
        trackedExercises={[]}
        allExercises={[bench]}
        loading={false}
        onClose={onClose}
        onSave={onSave}
      />
    );
    expect(screen.getByText("Nothing tracked yet.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Bench Press/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add exercise" }));
    fireEvent.click(screen.getByRole("button", { name: /Bench Press/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Done" })[0]);
    await vi.waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(["bench_press"]);
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it("shows Logged above Catalog when adding", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <MyExercisesModal
        open
        trackedExercises={[]}
        allExercises={[bench]}
        loggedSummaries={[
          {
            exerciseId: "bench_press",
            name: "Bench Press",
            modality: "strength",
            sessionCount: 4,
            lastDate: "2026-03-01",
          },
        ]}
        loading={false}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Add exercise" }));
    expect(screen.getByText("Logged")).toBeTruthy();
    expect(screen.getByText(/4 sessions/)).toBeTruthy();
  });

  it("offers a logged substitute when a tracked lift has no history", () => {
    const running: ExerciseDoc = {
      id: "running",
      name: "Running",
      modality: "cardio",
      nameFolded: "running",
    };
    const treadmill: ExerciseDoc = {
      id: "treadmill",
      name: "Treadmill",
      modality: "cardio",
      nameFolded: "treadmill",
    };
    render(
      <MyExercisesModal
        open
        trackedExercises={["running"]}
        allExercises={[running, treadmill]}
        loggedSummaries={[
          {
            exerciseId: "treadmill",
            name: "Treadmill",
            modality: "cardio",
            sessionCount: 12,
            lastDate: "2026-03-01",
          },
        ]}
        loading={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByText("Not in your history")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Use Treadmill instead/ }));
    expect(screen.queryByText("Not in your history")).toBeNull();
    expect(screen.getByText(/12 sessions/)).toBeTruthy();
  });

  it("does not close when save fails", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("nope"));
    const onClose = vi.fn();
    render(
      <MyExercisesModal
        open
        trackedExercises={["bench_press"]}
        allExercises={[bench]}
        loading={false}
        onClose={onClose}
        onSave={onSave}
      />
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Done" })[0]);
    await vi.waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(["bench_press"]);
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
