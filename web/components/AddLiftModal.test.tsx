import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddLiftModal } from "./AddLiftModal";

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  document.documentElement.classList.remove("add-modal-open");
});

describe("AddLiftModal", () => {
  it("renders nothing when closed", () => {
    render(
      <AddLiftModal open={false} onClose={() => {}}>
        Search
      </AddLiftModal>
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("covers the viewport and closes from the header or Escape", () => {
    const onClose = vi.fn();
    render(
      <AddLiftModal open onClose={onClose}>
        Search
      </AddLiftModal>
    );
    const dialog = screen.getByRole("dialog", { name: "Add a lift" });
    expect(dialog.className).toContain("fixed");
    expect(dialog.className).not.toContain("rounded-t-3xl");
    expect(document.documentElement.classList.contains("add-modal-open")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Close add sheet" }));
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
