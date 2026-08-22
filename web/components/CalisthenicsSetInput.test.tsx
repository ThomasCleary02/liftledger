import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/hooks/usePreferences", () => ({
  usePreferences: () => ({ units: "imperial" }),
}));

import CalisthenicsSetInput from "./CalisthenicsSetInput";

afterEach(cleanup);

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
});
