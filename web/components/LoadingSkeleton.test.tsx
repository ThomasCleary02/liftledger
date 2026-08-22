import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DayNavigationSkeleton, ExerciseListSkeleton } from "./LoadingSkeleton";

describe("LoadingSkeleton", () => {
  it("renders day and exercise placeholders", () => {
    const { container } = render(
      <>
        <DayNavigationSkeleton />
        <ExerciseListSkeleton />
      </>
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
