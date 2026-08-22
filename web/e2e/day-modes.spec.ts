import { expect, test } from "@playwright/test";
import { clearSandboxDay, closeAddSheet, openComposer, openDay, pickSearchResult } from "./helpers";

const SANDBOX = "2018-11-11";
const REPEAT = "2017-04-04";

test.describe("day modes on a sandbox date", () => {
  test.describe.configure({ timeout: 120_000 });

  test.afterEach(async ({ page }) => {
    try {
      await clearSandboxDay(page, SANDBOX);
    } catch {
      // Keep the suite moving if cleanup hits a stale page.
    }
  });

  test("visiting an empty date does not create a rest day", async ({ page }) => {
    await clearSandboxDay(page, SANDBOX);
    await openDay(page, SANDBOX);
    await expect(page.getByLabel("Search exercises")).toBeVisible();
    await expect(page.getByText("Rest Day", { exact: true })).toHaveCount(0);
    await page.waitForTimeout(2000);
    await page.reload();
    await expect(page.getByLabel("More for this day")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByLabel("Search exercises")).toBeVisible();
    await expect(page.getByText("Rest Day", { exact: true })).toHaveCount(0);
  });

  test("FAB opens the add sheet after the first lift", async ({ page }) => {
    await clearSandboxDay(page, SANDBOX);
    await pickSearchResult(page, "face pull", /Face Pull/);
    await expect(page.getByRole("heading", { name: "Face Pull" }).first()).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: "Close add sheet" }).click();
    await expect(page.getByRole("button", { name: "Add a lift" })).toBeVisible();
    await expect(page.getByLabel("Search exercises")).toHaveCount(0);
    await page.getByRole("button", { name: "Add a lift" }).click();
    await expect(page.getByLabel("Search exercises")).toBeVisible();
  });

  test("calisthenics persist after reload", async ({ page }) => {
    await clearSandboxDay(page, SANDBOX);
    await pickSearchResult(page, "pull-up", /Pull-?up/i);
    await closeAddSheet(page);
    await page.reload();
    await expect(page.getByLabel("More for this day")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /Pull-?up/i }).first()).toBeVisible();
  });

  test("cardio duration persists", async ({ page }) => {
    await clearSandboxDay(page, SANDBOX);
    await openComposer(page);
    await page.getByLabel("Search exercises").fill("run");
    const cardioResult = page.locator("#log-composer button").filter({ hasText: "cardio" }).first();
    await expect(cardioResult).toBeVisible({ timeout: 20_000 });
    await cardioResult.click();
    await page.getByLabel("Duration in minutes").fill("12");
    await page.getByRole("button", { name: "Save to log" }).click();
    await closeAddSheet(page);
    await page.reload();
    await expect(page.getByLabel("More for this day")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("12m")).toBeVisible();
  });

  test("rest day and injured persist", async ({ page }) => {
    await clearSandboxDay(page, SANDBOX);
    await page.getByLabel("More for this day").click();
    await page.getByRole("menuitem", { name: "Mark rest day" }).click();
    await expect(page.getByText(/Rest Day|Marked as rest day/)).toBeVisible();
    await page.reload();
    await expect(page.getByText("Rest Day")).toBeVisible({ timeout: 30_000 });

    await page.getByLabel("More for this day").click();
    await page.getByRole("menuitem", { name: "Turn rest off" }).click();
    await page.getByLabel("More for this day").click();
    await page.getByRole("menuitem", { name: "Mark injured" }).click();
    await expect(page.getByText("Injury / skip")).toBeVisible();
    await page.reload();
    await expect(page.getByText("Injury / skip")).toBeVisible({ timeout: 30_000 });
  });

  test("repeat last workout copies onto an empty date", async ({ page }) => {
    await clearSandboxDay(page, REPEAT);
    await openDay(page, REPEAT);
    await expect(page.getByLabel("Search exercises")).toBeVisible({ timeout: 20_000 });
    await page.getByLabel("More for this day").click();
    await page.getByRole("menuitem", { name: "Repeat last workout" }).click();
    await expect(page.getByRole("heading", { name: "Exercises" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /^Remove / }).first()).toBeVisible();
    await clearSandboxDay(page, REPEAT);
  });
});
