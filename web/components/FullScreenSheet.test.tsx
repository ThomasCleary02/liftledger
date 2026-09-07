import React, { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("keeps focus in the search field when onClose identity changes", async () => {
    function Harness() {
      const [query, setQuery] = useState("");
      return (
        <FullScreenSheet open title="Add exercise" onClose={() => undefined}>
          <input
            aria-label="Search exercises"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </FullScreenSheet>
      );
    }
    render(<Harness />);
    const input = await screen.findByLabelText("Search exercises");
    input.focus();
    fireEvent.change(input, { target: { value: "r" } });
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
      expect((document.activeElement as HTMLInputElement).value).toBe("r");
    });
  });
});
