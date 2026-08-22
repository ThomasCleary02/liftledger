import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/day/today",
  useRouter: () => ({ prefetch: vi.fn(), push: vi.fn() }),
}));

vi.mock("../providers/Auth", () => ({
  useAuth: () => ({ user: { uid: "u1" } }),
}));

vi.mock("../lib/firestore/exercises", () => ({
  getAllExercises: vi.fn(async () => []),
}));

vi.mock("../lib/firestore/days", () => ({
  listDays: vi.fn(async () => []),
}));

import { Navigation } from "./Navigation";

afterEach(cleanup);

describe("Navigation", () => {
  beforeEach(() => {
    vi.stubGlobal("requestIdleCallback", undefined);
  });

  it("marks Daily log as the current page", () => {
    render(<Navigation />);
    const links = screen.getAllByRole("link", { name: /Daily log/ });
    expect(links[0]).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link", { name: /Analytics/ }).length).toBeGreaterThan(0);
  });
});
