import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TemplatePicker } from "./TemplatePicker";
import type { WorkoutTemplate } from "../lib/firestore/workoutTemplates";

afterEach(cleanup);

const template: WorkoutTemplate = {
  id: "t1",
  name: "Mobile push",
  ownerId: "u1",
  exercises: [{ name: "Bench Press", modality: "strength", strengthSets: [{ reps: 5, weight: 135 }] }],
  createdAt: {} as WorkoutTemplate["createdAt"],
};

describe("TemplatePicker", () => {
  it("saves the current day and offers add vs replace when the day already has work", () => {
    const onSaveCurrent = vi.fn();
    const onSelect = vi.fn();
    render(
      <TemplatePicker
        templates={[template]}
        saving={false}
        dayHasWork
        canSaveCurrent
        onClose={() => {}}
        onSelect={onSelect}
        onSaveCurrent={onSaveCurrent}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Push A"), { target: { value: "  Mobile push  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSaveCurrent).toHaveBeenCalledWith("Mobile push");

    fireEvent.click(screen.getByRole("button", { name: /Mobile push/ }));
    fireEvent.click(screen.getByRole("button", { name: "Add to today" }));
    expect(onSelect).toHaveBeenCalledWith(template, "append");
  });

  it("applies immediately when the day is empty", () => {
    const onSelect = vi.fn();
    render(
      <TemplatePicker
        templates={[template]}
        saving={false}
        dayHasWork={false}
        canSaveCurrent={false}
        onClose={() => {}}
        onSelect={onSelect}
        onSaveCurrent={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Mobile push/ }));
    expect(onSelect).toHaveBeenCalledWith(template, "replace");
  });
});
