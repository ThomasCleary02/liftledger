import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/hooks/usePreferences", () => ({
  usePreferences: () => ({ units: "imperial" }),
}));

import WorkoutCard from "./WorkoutCard";

afterEach(cleanup);

describe("WorkoutCard", () => {
  it("summarizes today's workout and handles press", () => {
    const onPress = vi.fn();
    render(
      <WorkoutCard
        id="w1"
        date={new Date()}
        onPress={onPress}
        totalVolume={675}
        exercises={[
          { name: "Bench Press", modality: "strength", strengthSets: [{ reps: 5, weight: 135 }] },
          { name: "Run", modality: "cardio", cardioData: { duration: 600, distance: 1 } },
        ]}
      />
    );
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("2 exercises")).toBeInTheDocument();
    expect(screen.getByText("2 sets")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Workout from Today/ }));
    expect(onPress).toHaveBeenCalledOnce();
  });
});
