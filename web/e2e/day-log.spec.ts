import { expect, test, type Page } from "@playwright/test";
import { closeAddSheet, confirmRemoveExercise, openComposer, openDay } from "./helpers";

async function openToday(page: Page) {
  await openDay(page);
  await openComposer(page);
}

function liftCard(page: Page, name: string) {
  return page.locator("div.rounded-lg.border").filter({ has: page.getByRole("heading", { name }) });
}

test.describe("day log", () => {
  test("search ranks Bench Press above Bench Dip", async ({ page }) => {
    await openToday(page);
    await page.getByLabel("Search exercises").fill("bench");
    await expect(page.locator("p.font-semibold").first()).toHaveText("Bench Press", { timeout: 20_000 });
    const press = await page.getByText("Bench Press", { exact: true }).first().boundingBox();
    const dip = await page.getByText("Bench Dip", { exact: true }).first().boundingBox();
    expect(press && dip && press.y < dip.y).toBeTruthy();
    await page.getByLabel("Search exercises").press("Escape");
  });

  test("selecting a lift and adding a set persist after reload", async ({ page }) => {
    await openToday(page);
    const lift = "Face Pull";
    const existing = liftCard(page, lift);
    if (await existing.count()) {
      await closeAddSheet(page);
      await page.getByLabel(`Remove ${lift}`).first().scrollIntoViewIfNeeded();
      await page.getByLabel(`Remove ${lift}`).first().click();
      await confirmRemoveExercise(page);
      await expect(page.getByRole("heading", { name: lift })).toHaveCount(0);
    }

    await openComposer(page);
    await page.getByLabel("Search exercises").fill("face pull");
    await page.locator("#log-composer").getByRole("button", { name: /Face Pull/ }).first().click();
    await expect(page.getByRole("heading", { name: lift }).first()).toBeVisible({ timeout: 20_000 });

    await page.reload();
    await expect(page.getByRole("heading", { name: lift }).first()).toBeVisible({ timeout: 30_000 });

    await page.getByLabel(`Edit ${lift}`).click();
    await page.getByRole("button", { name: "Add Set" }).click();
    await page.reload();
    await expect(page.getByRole("heading", { name: lift })).toBeVisible({ timeout: 30_000 });

    await closeAddSheet(page);
    await page.getByLabel(`Remove ${lift}`).first().scrollIntoViewIfNeeded();
    await page.getByLabel(`Remove ${lift}`).first().click();
    await confirmRemoveExercise(page);
  });
});
