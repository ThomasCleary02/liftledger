import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/hooks/usePreferences", () => ({
  usePreferences: () => ({ units: "imperial" }),
}));

import CardioInput from "./CardioInput";

afterEach(cleanup);

describe("CardioInput", () => {
  it("sanitizes duration and distance and switches activity type", () => {
    const onDataChange = vi.fn();
    const onActivityTypeChange = vi.fn();
    render(
      <CardioInput
        data={{ duration: "30", distance: "3" }}
        onDataChange={onDataChange}
        activityType="run"
        onActivityTypeChange={onActivityTypeChange}
      />
    );
    fireEvent.change(screen.getByLabelText("Duration in minutes"), { target: { value: "45min" } });
    expect(onDataChange).toHaveBeenCalledWith({ duration: "45", distance: "3" });
    fireEvent.change(screen.getByLabelText("Distance"), { target: { value: "3.10.2" } });
    expect(onDataChange).toHaveBeenCalledWith({ duration: "30", distance: "3.102" });
    fireEvent.click(screen.getByRole("button", { name: "Bike" }));
    expect(onActivityTypeChange).toHaveBeenCalledWith("bike");
  });
});
