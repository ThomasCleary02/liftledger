import { expect, type Page } from "@playwright/test";

export async function openDay(page: Page, date = "today") {
  await page.goto(`/day/${date}`);
  await expect(page.getByLabel("More for this day")).toBeVisible({ timeout: 30_000 });
  await expect(
    page
      .getByRole("heading", { name: "Log" })
      .or(page.getByRole("heading", { name: "Exercises" }))
      .or(page.getByText("Rest Day", { exact: true }))
  ).toBeVisible({ timeout: 30_000 });
}

export async function openComposer(page: Page) {
  const search = page.getByLabel("Search exercises");
  const fab = page.getByRole("button", { name: "Add a lift" });
  await expect(page.getByLabel("More for this day")).toBeVisible({ timeout: 30_000 });
  await expect(
    page
      .getByRole("heading", { name: "Log" })
      .or(page.getByRole("heading", { name: "Exercises" }))
      .or(page.getByText("Rest Day", { exact: true }))
  ).toBeVisible({ timeout: 30_000 });
  const change = page.getByLabel("Change exercise");
  if (await change.isVisible()) await change.click();
  await expect(search.or(fab).first()).toBeVisible({ timeout: 20_000 });
  if (await search.isVisible()) return;
  await fab.click();
  await expect(search).toBeVisible();
}

export async function closeAddSheet(page: Page) {
  const done = page.getByRole("button", { name: "Done", exact: true });
  if (await done.isVisible()) {
    await done.click();
    await expect(done).toHaveCount(0);
    return;
  }
  const close = page.getByRole("button", { name: "Close add sheet" });
  if (await close.isVisible()) {
    await close.click();
    await expect(close).toHaveCount(0);
  }
}

export async function confirmRemoveExercise(page: Page) {
  const dialog = page.locator('[role="dialog"]').filter({ hasText: "Remove exercise?" });
  await expect(dialog).toBeVisible({ timeout: 8_000 });
  await dialog.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(dialog).toHaveCount(0);
}
