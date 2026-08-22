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
  if (await search.isVisible()) return;
  await expect(fab).toBeVisible();
  await fab.click();
  await expect(search).toBeVisible();
}

export async function closeMenus(page: Page) {
  await page.keyboard.press("Escape");
}

export async function closeAddSheet(page: Page) {
  const close = page.getByRole("button", { name: "Close add sheet" });
  if (await close.isVisible()) {
    await close.click();
    await expect(close).toHaveCount(0);
  }
}

async function clickDayMenuItem(page: Page, name: string) {
  await closeMenus(page);
  await closeAddSheet(page);
  await page.getByLabel("More for this day").click();
  const item = page.getByRole("menuitem", { name });
  try {
    await expect(item).toBeVisible({ timeout: 2_000 });
    await item.click();
    return true;
  } catch {
    await closeMenus(page);
    return false;
  }
}

export async function confirmRemoveExercise(page: Page) {
  const dialog = page.locator('[role="dialog"]').filter({ hasText: "Remove exercise?" });
  await expect(dialog).toBeVisible({ timeout: 8_000 });
  await dialog.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

export async function clearSandboxDay(page: Page, date: string) {
  await openDay(page, date);
  await closeAddSheet(page);
  await clickDayMenuItem(page, "Clear injured");
  await clickDayMenuItem(page, "Turn rest off");
  await closeAddSheet(page);
  for (let i = 0; i < 60; i += 1) {
    await closeAddSheet(page);
    const remove = page.getByRole("button", { name: /^Remove / });
    if ((await remove.count()) === 0) break;
    try {
      await remove.first().click({ force: true, timeout: 3_000 });
      await confirmRemoveExercise(page);
    } catch {
      await closeAddSheet(page);
    }
  }
}

export async function pickSearchResult(page: Page, query: string, name?: RegExp) {
  await openComposer(page);
  await page.getByLabel("Search exercises").fill(query);
  const ranked = page.locator("#log-composer p.font-semibold");
  const result = name ? ranked.filter({ hasText: name }).first() : ranked.first();
  await expect(result).toBeVisible({ timeout: 20_000 });
  await result.click();
}
