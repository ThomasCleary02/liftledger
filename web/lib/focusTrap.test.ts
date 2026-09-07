import { describe, expect, it, vi } from "vitest";
import { focusInitial, getFocusableElements, trapFocusKeydown } from "./focusTrap";

describe("focusTrap", () => {
  it("lists focusable controls in order", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <button type="button">One</button>
      <button type="button" disabled>Skip</button>
      <a href="/x">Link</a>
    `;
    document.body.appendChild(root);
    const items = getFocusableElements(root);
    expect(items.map((el) => el.textContent)).toEqual(["One", "Link"]);
    root.remove();
  });

  it("cycles Tab from last to first", () => {
    const root = document.createElement("div");
    root.innerHTML = `<button type="button" id="a">A</button><button type="button" id="b">B</button>`;
    document.body.appendChild(root);
    const a = root.querySelector("#a") as HTMLButtonElement;
    const b = root.querySelector("#b") as HTMLButtonElement;
    b.focus();
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    const prevent = vi.spyOn(event, "preventDefault");
    trapFocusKeydown(event, root);
    expect(prevent).toHaveBeenCalled();
    expect(document.activeElement).toBe(a);
    root.remove();
  });

  it("focuses a preferred control when present", () => {
    const root = document.createElement("div");
    root.innerHTML = `<button type="button">Other</button><button type="button" data-sheet-close>Close</button>`;
    document.body.appendChild(root);
    focusInitial(root, "[data-sheet-close]");
    expect((document.activeElement as HTMLElement).getAttribute("data-sheet-close")).toBe("");
    root.remove();
  });
});
