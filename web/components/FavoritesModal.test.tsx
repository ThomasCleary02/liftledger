import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FavoritesModal } from "./FavoritesModal";

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("FavoritesModal", () => {
  it("shows empty copy and closes", () => {
    const onClose = vi.fn();
    render(
      <FavoritesModal
        open
        favoriteExercises={[]}
        loading={false}
        onClose={onClose}
        onRemoveFavorite={() => {}}
      />
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-labelledby", "favorites-title");
    expect(screen.getByText("No favorite exercises yet")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Close favorites"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
