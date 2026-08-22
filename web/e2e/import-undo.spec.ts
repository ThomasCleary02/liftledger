import { expect, test, type Page } from "@playwright/test";
import { clearSandboxDay, closeAddSheet } from "./helpers";

const PASTE_DATE = "2018-11-11";
const PROGRAM_DATE = "2018-11-12";

async function clickAndWaitForDay(page: Page, buttonName: string, date: string) {
  await page.getByRole("button", { name: buttonName }).evaluate((el: HTMLElement) => el.click());
  await expect(page).toHaveURL(new RegExp(`/day/${date}`), { timeout: 40_000 });
}

test.describe("import, programs, and undo", () => {
  test.describe.configure({ timeout: 90_000 });

  test("paste import writes two lifts, supersets them, and undo removes them", async ({ page }) => {
    await clearSandboxDay(page, PASTE_DATE);
    await page.goto(`/settings/import?tab=paste&date=${PASTE_DATE}`);
    await expect(page.getByRole("heading", { name: "Import" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("textbox", { name: "Date" })).toHaveValue(PASTE_DATE);

    await page.locator("textarea").fill("Face Pull 1x10 30\nBarbell Curl 1x8 25");
    await expect(page.getByRole("button", { name: "Save workout" })).toBeEnabled();
    await clickAndWaitForDay(page, "Save workout", PASTE_DATE);
    await closeAddSheet(page);
    await expect(page.getByRole("heading", { name: "Face Pull" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Barbell Curl" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Superset with previous" }).click();
    await expect(page.getByRole("button", { name: "Unlink superset" }).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.goto("/settings/import");
    await expect(page.getByRole("button", { name: "Undo last import" })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Undo last import" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Undo import" }).click();
    await expect(page.getByRole("button", { name: "Undo last import" })).toHaveCount(0, {
      timeout: 20_000,
    });

    await page.goto(`/day/${PASTE_DATE}`);
    await expect(page.getByLabel("More for this day")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Face Pull" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Barbell Curl" })).toHaveCount(0);
  });

  test("starter program loads onto a sandbox date", async ({ page }) => {
    await clearSandboxDay(page, PROGRAM_DATE);
    await page.goto(`/settings/import?tab=programs&date=${PROGRAM_DATE}`);
    await expect(page.getByText("Push (PPL)")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel("Load onto date")).toHaveValue(PROGRAM_DATE);
    await page
      .locator("div.rounded-2xl")
      .filter({ has: page.getByText("Push (PPL)", { exact: true }) })
      .getByRole("button", { name: "Add to that day" })
      .click();
    await expect(page).toHaveURL(new RegExp(`/day/${PROGRAM_DATE}`), { timeout: 40_000 });
    await expect(page.getByRole("heading", { name: "Bench Press" }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("heading", { name: "Overhead Press" }).first()).toBeVisible();
    await clearSandboxDay(page, PROGRAM_DATE);
  });
});
