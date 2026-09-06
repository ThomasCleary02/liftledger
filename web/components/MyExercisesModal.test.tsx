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
  it("saves the selection when Done is pressed", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: /Bench Press/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Done" })[0]);
    await vi.waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(["bench_press"]);
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  it("does not close when save fails", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("nope"));
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
    fireEvent.click(screen.getByRole("button", { name: /Bench Press/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Done" })[0]);
    await vi.waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
