import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FavoritesModal } from "./FavoritesModal";
import { resetFullScreenChromeForTests } from "./fullScreenChrome";
import type { ExerciseDoc } from "../lib/firestore/exercises";

afterEach(() => {
  cleanup();
  resetFullScreenChromeForTests();
});

const bench: ExerciseDoc = {
  id: "bench_press",
  name: "Bench Press",
  modality: "strength",
  nameFolded: "bench press",
};

describe("FavoritesModal", () => {
  it("shows empty copy and closes", () => {
    const onClose = vi.fn();
    render(
      <FavoritesModal
        open
        favoriteExercises={[]}
        allExercises={[bench]}
        loading={false}
        onClose={onClose}
        onRemoveFavorite={() => {}}
        onAddFavorite={() => {}}
      />
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-labelledby");
    expect(screen.getByText("No favorite exercises yet")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Close favorites"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("adds from the picker", () => {
    const onAddFavorite = vi.fn();
    render(
      <FavoritesModal
        open
        favoriteExercises={[]}
        allExercises={[bench]}
        loading={false}
        onClose={() => {}}
        onRemoveFavorite={() => {}}
        onAddFavorite={onAddFavorite}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Add favorite" }));
    fireEvent.click(screen.getByRole("button", { name: /Bench Press/ }));
    expect(onAddFavorite).toHaveBeenCalledWith("bench_press");
  });
});
