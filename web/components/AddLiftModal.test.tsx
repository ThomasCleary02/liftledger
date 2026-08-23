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

  it("portals above page chrome and closes from Done", async () => {
    const onClose = vi.fn();
    render(
      <AddLiftModal open onClose={onClose}>
        Search
      </AddLiftModal>
    );
    const dialog = await screen.findByRole("dialog", { name: "Add a lift" });
    expect(dialog.parentElement).toBe(document.body);
    expect(dialog.className).toContain("z-[100]");
    expect(document.documentElement.classList.contains("add-modal-open")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Close add sheet" }));
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
