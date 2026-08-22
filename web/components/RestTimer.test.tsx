import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RestTimer } from "./RestTimer";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("RestTimer", () => {
  it("counts down and calls onDone at zero", async () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<RestTimer seconds={2} onDone={onDone} onSkip={() => {}} />);
    expect(screen.getByText((_, node) => node?.textContent === "0:02")).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("skips without waiting", () => {
    const onSkip = vi.fn();
    render(<RestTimer seconds={90} onDone={() => {}} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole("button", { name: /Skip/ }));
    expect(onSkip).toHaveBeenCalledOnce();
  });
});
