import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastContainer } from "./ToastContainer";
import { getToasts, removeToast, toast } from "../lib/toast";

afterEach(() => {
  getToasts().forEach((item) => removeToast(item.id));
  cleanup();
  vi.useRealTimers();
});

describe("toasts", () => {
  it("adds, displays, dismisses, and auto-expires", () => {
    vi.useFakeTimers();
    toast.success("Saved");
    render(<ToastContainer />);
    expect(screen.getByText("Saved")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Dismiss notification"));
    expect(screen.queryByText("Saved")).toBeNull();

    toast.error("Nope", 1000);
    expect(getToasts()).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(getToasts()).toHaveLength(0);
  });
});
