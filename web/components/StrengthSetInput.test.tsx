import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/hooks/usePreferences", () => ({
  usePreferences: () => ({ units: "imperial" }),
}));

import StrengthSetInput from "./StrengthSetInput";

afterEach(cleanup);

describe("StrengthSetInput", () => {
  it("adds a copied set, strips non-digits from reps, and removes extra sets", () => {
    const onSetsChange = vi.fn();
    const onAddedSet = vi.fn();
    const { rerender } = render(
      <StrengthSetInput
        exerciseName="Barbell Bench Press"
        sets={[{ reps: "5", weight: "135" }]}
        onSetsChange={onSetsChange}
        onAddedSet={onAddedSet}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Add Set" }));
    expect(onAddedSet).toHaveBeenCalledWith([
      { reps: "5", weight: "135" },
      { reps: "5", weight: "135", warmup: false },
    ]);

    fireEvent.change(screen.getByLabelText("Set 1 reps"), { target: { value: "12x" } });
    expect(onSetsChange).toHaveBeenCalledWith([{ reps: "12", weight: "135" }]);

    rerender(
      <StrengthSetInput
        exerciseName="Barbell Bench Press"
        sets={[
          { reps: "5", weight: "135" },
          { reps: "5", weight: "135", warmup: false },
        ]}
        onSetsChange={onSetsChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove set 2" }));
    expect(onSetsChange).toHaveBeenLastCalledWith([{ reps: "5", weight: "135" }]);
  });

  it("toggles warmup and shows a plate plan for barbell loads", () => {
    const onSetsChange = vi.fn();
    render(
      <StrengthSetInput
        exerciseName="Squat"
        sets={[{ reps: "5", weight: "225" }]}
        onSetsChange={onSetsChange}
      />
    );
    expect(screen.getByText(/45 lb bar/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mark as warmup" }));
    expect(onSetsChange).toHaveBeenCalledWith([{ reps: "5", weight: "225", warmup: true }]);
  });
});
