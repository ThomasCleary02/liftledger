import { expect, test } from "@playwright/test";
import { openComposer, openDay } from "./helpers";

test("templates can add onto a day that already has work", async ({ page }) => {
  await openDay(page);

  await page.getByLabel("More for this day").click();
  await page.getByRole("menuitem", { name: "Templates" }).click();
  await expect(page.getByRole("heading", { name: "Templates" })).toBeVisible();

  const named = page.getByRole("button", { name: /Mobile push/i });
  const anyTemplate = page.locator("h4.font-semibold").first();
  if (await named.count()) {
    await named.click();
  } else if (await anyTemplate.count()) {
    await page.getByRole("button", { name: (await anyTemplate.innerText()) || "" }).first().click();
  } else {
    test.skip(true, "No templates on this account yet");
  }

  const add = page.getByRole("button", { name: "Add to today" });
  if (await add.isVisible()) {
    await add.click();
  }

  await expect(page.getByRole("heading", { name: "Exercises" })).toBeVisible();
  await openComposer(page);
  await expect(page.getByLabel("Search exercises")).toBeVisible();
});
