import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BodyweightCard } from "./BodyweightCard";

afterEach(() => {
  cleanup();
});

describe("BodyweightCard", () => {
  it("saves a new weigh-in in stored pounds and collapses", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<BodyweightCard units="imperial" onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Bodyweight in lb"), { target: { value: "185" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(185));
    await waitFor(() => expect(screen.getByText("185 lb")).toBeTruthy());
    expect(screen.queryByLabelText("Bodyweight in lb")).toBeNull();
  });

  it("shows a compact row when a weigh-in already exists", () => {
    render(<BodyweightCard valueLbs={190} units="imperial" onSave={vi.fn()} />);
    expect(screen.getByText("190 lb")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit bodyweight" })).toBeTruthy();
    expect(screen.queryByLabelText("Bodyweight in lb")).toBeNull();
  });

  it("clears an existing weigh-in when emptied", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<BodyweightCard valueLbs={190} units="imperial" onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit bodyweight" }));
    fireEvent.change(screen.getByLabelText("Bodyweight in lb"), { target: { value: "" } });
    fireEvent.blur(screen.getByLabelText("Bodyweight in lb"));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(null));
  });
});
