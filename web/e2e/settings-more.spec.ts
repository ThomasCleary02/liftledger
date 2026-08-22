import { expect, test } from "@playwright/test";

test.describe("settings surfaces", () => {
  test("theme and rest timer persist", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 20_000 });

    const themeRow = page.getByRole("button", { name: /Theme/ });
    const restRow = page.getByRole("button", { name: /Rest timer/ });
    const themeStart = await themeRow.innerText();
    const restStart = await restRow.innerText();

    await themeRow.click();
    await page.getByRole("button", { name: /^Dark/ }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: /Theme/ })).toContainText("Dark");

    await page.getByRole("button", { name: /Theme/ }).click();
    const restoreTheme = themeStart.includes("Light")
      ? /^Light/
      : themeStart.includes("Dark")
        ? /^Dark/
        : /Match device/;
    await page.getByRole("button", { name: restoreTheme }).click();
    await page.getByRole("button", { name: "Save" }).click();

    await page.getByRole("button", { name: /Rest timer/ }).click();
    await page.getByRole("button", { name: /^90 seconds/ }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: /Rest timer/ })).toContainText("1.5 min");

    await page.getByRole("button", { name: /Rest timer/ }).click();
    const restoreRest = restStart.includes("1.5")
      ? /^90 seconds/
      : restStart.includes("2 min")
        ? /^2 minutes/
        : restStart.includes("3 min")
          ? /^3 minutes/
          : restStart.includes("1 min")
            ? /^1 minute/
            : /^Off/;
    await page.getByRole("button", { name: restoreRest }).click();
    await page.getByRole("button", { name: "Save" }).click();
  });

  test("account photo, username, and bodyweight fields", async ({ page }) => {
    await page.goto("/settings/account");
    await expect(page.getByRole("heading", { name: "Profile Picture" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: /photo/i })).toBeVisible();
    await expect(page.getByPlaceholder("Enter username")).toBeVisible();
    await expect(page.getByText(/Bodyweight/)).toBeVisible();
  });

  test("import tabs and favorites / PRs settings open", async ({ page }) => {
    await page.goto("/settings/import");
    await expect(page.getByRole("button", { name: "Paste" })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Paste" }).click();
    await expect(page.locator("textarea")).toBeVisible();
    await page.getByRole("button", { name: "Programs" }).click();
    await expect(page.getByText("Push (PPL)")).toBeVisible();

    await page.goto("/settings");
    await page.getByRole("button", { name: /Favorite Exercises/ }).click();
    await expect(page.getByRole("heading", { name: "Favorite Exercises" })).toBeVisible();
    await page.getByLabel("Close favorites").click();

    await page.getByRole("button", { name: /My Exercises/ }).click();
    await expect(page.getByRole("heading", { name: "My Exercises" })).toBeVisible();
  });
});
