import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/firebaseEmulators", () => ({
  EMULATOR_UI_URL: "http://127.0.0.1:4000",
  shouldUseFirebaseEmulators: vi.fn(),
}));

import { EmulatorBanner } from "./EmulatorBanner";
import { shouldUseFirebaseEmulators } from "../lib/firebaseEmulators";

const shouldUse = vi.mocked(shouldUseFirebaseEmulators);

describe("EmulatorBanner", () => {
  it("shows during local next dev", () => {
    shouldUse.mockReturnValue(true);
    render(<EmulatorBanner />);
    expect(screen.getByText(/data stays on this machine/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /emulator ui/i })).toHaveAttribute(
      "href",
      "http://127.0.0.1:4000",
    );
  });

  it("hides for production builds", () => {
    shouldUse.mockReturnValue(false);
    const { container } = render(<EmulatorBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
