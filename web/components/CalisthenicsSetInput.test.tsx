import { cleanup, fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/hooks/usePreferences", () => ({
  usePreferences: () => ({ units: "imperial" }),
}));

import CalisthenicsSetInput from "./CalisthenicsSetInput";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CalisthenicsSetInput", () => {
  it("sanitizes reps and can show hold duration", () => {
    const onSetsChange = vi.fn();
    render(
      <CalisthenicsSetInput
        showDuration
        sets={[{ reps: "10", duration: "" }]}
        onSetsChange={onSetsChange}
      />
    );
    fireEvent.change(screen.getByLabelText("Set 1 reps"), { target: { value: "8a" } });
    expect(onSetsChange).toHaveBeenCalledWith([{ reps: "8", duration: "" }]);
    fireEvent.change(screen.getByLabelText("Set 1 hold time in seconds"), { target: { value: "30s" } });
    expect(onSetsChange).toHaveBeenCalledWith([{ reps: "10", duration: "30" }]);
    fireEvent.click(screen.getByRole("button", { name: "Add Set" }));
    expect(onSetsChange).toHaveBeenLastCalledWith([
      { reps: "10", duration: "" },
      { reps: "10", duration: "" },
    ]);
  });

  it("hides hold until Add hold time", () => {
    render(<CalisthenicsSetInput sets={[{ reps: "10" }]} onSetsChange={vi.fn()} />);
    expect(screen.queryByLabelText("Set 1 hold time in seconds")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add hold time" }));
    expect(screen.getByLabelText("Set 1 hold time in seconds")).toBeTruthy();
  });

  it("opens hold UI for plank and records stopwatch seconds", () => {
    vi.useFakeTimers();
    const onSetsChange = vi.fn();
    render(
      <CalisthenicsSetInput
        exerciseName="Plank"
        sets={[{ reps: "1", duration: "" }]}
        onSetsChange={onSetsChange}
      />
    );
    expect(screen.getByLabelText("Set 1 hold time in seconds")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start hold timer for set 1" }));
    act(() => {
      vi.advanceTimersByTime(3200);
    });
    fireEvent.click(screen.getByRole("button", { name: "Stop hold timer for set 1" }));
    expect(onSetsChange).toHaveBeenCalledWith([{ reps: "1", duration: "3" }]);
  });
});
