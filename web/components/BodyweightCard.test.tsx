import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BodyweightCard } from "./BodyweightCard";

afterEach(() => {
  cleanup();
});

describe("BodyweightCard", () => {
  it("saves a new weigh-in in stored pounds", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<BodyweightCard units="imperial" onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Bodyweight in lb"), { target: { value: "185" } });
    fireEvent.blur(screen.getByLabelText("Bodyweight in lb"));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(185));
  });

  it("clears an existing weigh-in when emptied", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<BodyweightCard valueLbs={190} units="imperial" onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Bodyweight in lb"), { target: { value: "" } });
    fireEvent.blur(screen.getByLabelText("Bodyweight in lb"));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(null));
  });
});
