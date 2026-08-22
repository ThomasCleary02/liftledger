import { expect, test } from "@playwright/test";

test("settings units sheet opens", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: /Units/ }).click();
  await expect(page.getByRole("heading", { name: "Units" })).toBeVisible();
  await expect(page.getByText("Pounds (lb), Miles (mi)")).toBeVisible();
  await expect(page.getByText("Kilograms (kg), Kilometers (km)")).toBeVisible();
});
