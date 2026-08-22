import { expect, test } from "@playwright/test";

test("sign out returns to login", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: /Sign Out Sign out of your account/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Sign Out" }).click();
  await page.waitForURL(/\/login/, { timeout: 20_000 });
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
});
