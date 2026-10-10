import { expect, test } from "@playwright/test";

/**
 * UI/UX smoke for medals overhaul + related 3.3.4 surfaces.
 * Expects emulators + app (reuseExistingServer) and auth from setup /
 * E2E_ALLOW_CUSTOM credentials.
 */
test.describe("medals and profile UX", () => {
  test("profile collection sheet filters and medal detail", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Pinned medals" })).toBeVisible();

    await page.getByRole("button", { name: "All medals" }).click();
    const sheet = page.locator('[role="dialog"]').filter({ hasText: "All medals" });
    await expect(sheet).toBeVisible({ timeout: 15_000 });

    // Status row — reset to All so Challenges lists locked medals too
    await sheet.getByRole("button", { name: "All", exact: true }).click();
    await expect(sheet.getByRole("button", { name: "Earned", exact: true })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Locked", exact: true })).toBeVisible();

    // Kind row — "Any" (not a second "All")
    const kindAny = sheet.getByRole("button", { name: "Any", exact: true });
    await expect(kindAny).toBeVisible();
    await expect(sheet.getByRole("button", { name: "All kinds" })).toHaveCount(0);
    await expect(sheet.getByRole("button", { name: "Challenges", exact: true })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Lifetime", exact: true })).toBeVisible();

    await sheet.getByRole("button", { name: "Any", exact: true }).click();
    await sheet.getByRole("button", { name: "Challenges", exact: true }).click();
    // Medal buttons include progress text in the accessible name — match by title prefix.
    await expect(sheet.getByRole("button", { name: /^Volume blitz/ })).toBeVisible({
      timeout: 10_000,
    });
    await expect(sheet.getByRole("button", { name: /^Foundry week/ })).toBeVisible();
    await expect(sheet.getByRole("button", { name: /^Footwork/ })).toBeVisible();
    await expect(sheet.getByRole("button", { name: /^Sidewalk stroll/ })).toBeVisible();
    await expect(sheet.getByRole("button", { name: /^Rep siege/ })).toBeVisible();
    await expect(sheet.getByRole("button", { name: /^True tempest/ })).toHaveCount(0);
    await expect(sheet.getByRole("button", { name: /^PR spark/ })).toHaveCount(0);
    await expect(sheet.getByRole("button", { name: /^Plank pulse/ })).toHaveCount(0);

    await sheet.getByRole("button", { name: "Lifetime", exact: true }).click();
    await expect(sheet.getByRole("button", { name: /^Evergreen/ })).toBeVisible({
      timeout: 10_000,
    });

    await sheet
      .getByRole("button", { name: "Sort: common → rare" })
      .or(sheet.getByRole("button", { name: "Sort: rare → common" }))
      .click();

    // Open a diamond/platinum or common lifetime medal if present
    const evergreen = sheet.getByRole("button", { name: /^Evergreen/ });
    if (await evergreen.isVisible()) {
      await evergreen.click();
      const detail = page.locator('[role="dialog"]').filter({ hasText: "Evergreen" }).last();
      await expect(detail).toBeVisible();
      await expect(detail.getByText(/200 trained days/i)).toBeVisible();
      await detail.getByRole("button", { name: "Done", exact: true }).last().click();
    }

    await sheet.getByRole("button", { name: "Done", exact: true }).last().click();
    await expect(sheet).toHaveCount(0);
  });

  test("leaderboards board dropdown matches app chrome", async ({ page }) => {
    await page.goto("/profile/friends/leaderboards");
    await expect(page.getByRole("heading", { name: "Leaderboards" })).toBeVisible({ timeout: 20_000 });
    const board = page.locator("#leaderboard-metric");
    await expect(board).toBeVisible();
    await expect(board).toHaveValue("volume");
    await board.selectOption("cardio");
    await expect(board).toHaveValue("cardio");
    await expect(page.getByRole("group", { name: "Time period" })).toBeVisible();
    await page.getByRole("button", { name: "Last 30 days" }).click();
  });

  test("analytics period chips and overview chrome", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByRole("button", { name: "Overview" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Strength" })).toBeVisible();
    await expect(page.getByText("Mon–Sun calendar week")).toHaveCount(0);
    // Period chips use short labels with longer aria-labels
    await expect(page.getByRole("button", { name: "Rolling last 7 days" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Last 30 days" })).toBeVisible();

    const shareWeek = page.getByRole("button", { name: "Share this week as an image" });
    if (await shareWeek.isVisible().catch(() => false)) {
      await shareWeek.click();
      const preview = page.getByRole("dialog", { name: "This week" });
      if (await preview.isVisible().catch(() => false)) {
        await expect(preview.getByRole("button", { name: "Save" })).toBeVisible();
        await expect(preview.getByRole("button", { name: "Share" })).toBeVisible();
        await preview.getByRole("button", { name: "Close preview" }).click();
      }
    }
  });
});
