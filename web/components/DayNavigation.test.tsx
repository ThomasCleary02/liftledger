import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { format } from "date-fns";
import { afterEach, describe, expect, it, vi } from "vitest";
import DayNavigation from "./DayNavigation";

afterEach(cleanup);

describe("DayNavigation", () => {
  it("shows the week strip and date picker", () => {
    const onDateChange = vi.fn();
    const today = format(new Date(), "yyyy-MM-dd");
    render(
      <DayNavigation
        currentDate={today}
        onDateChange={onDateChange}
        loggedDates={new Set([today])}
        trailing={<button type="button" aria-label="More for this day">More</button>}
      />
    );
    expect(screen.getByRole("button", { name: "More for this day" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Choose date" }));
    const picker = screen.getByDisplayValue(today);
    fireEvent.change(picker, { target: { value: "2026-01-01" } });
    expect(onDateChange).toHaveBeenCalledWith("2026-01-01");
  });
});
