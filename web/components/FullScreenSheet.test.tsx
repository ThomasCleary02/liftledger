import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FullScreenSheet } from "./FullScreenSheet";
import { resetFullScreenChromeForTests } from "./fullScreenChrome";

afterEach(() => {
  cleanup();
  resetFullScreenChromeForTests();
});

describe("FullScreenSheet", () => {
  it("portals above page chrome and closes from Done", async () => {
    const onClose = vi.fn();
    render(
      <FullScreenSheet open title="Units" onClose={onClose}>
        Pounds
      </FullScreenSheet>
    );
    const dialog = await screen.findByRole("dialog", { name: "Units" });
    expect(dialog.parentElement).toBe(document.body);
    expect(dialog.className).toContain("z-[100]");
    expect(document.documentElement.classList.contains("add-modal-open")).toBe(true);
    fireEvent.click(screen.getAllByRole("button", { name: "Done" })[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
