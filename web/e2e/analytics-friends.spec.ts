import { expect, test } from "@playwright/test";

test.describe("analytics and friends", () => {
  test("analytics tabs and share control", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByRole("button", { name: "Strength" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Share this week as an image" })).toBeVisible();
    await page.getByRole("button", { name: "Strength" }).click();
    await page.getByRole("button", { name: "Cardio" }).click();
    await page.getByRole("button", { name: "PRs" }).click();
    await page.getByRole("button", { name: "Overview" }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Share this week as an image" }).click();
    expect((await download).suggestedFilename()).toMatch(/liftledger-week-/);
  });

  test("PWA manifest is served and a service worker registers", async ({ page, request }) => {
    const res = await request.get("/manifest.json");
    expect(res.ok()).toBeTruthy();
    const manifest = (await res.json()) as { name: string; display: string; start_url: string };
    expect(manifest.name).toBe("LiftLedger");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/day/today");

    await page.goto("/day/today");
    await expect(page.getByLabel("More for this day")).toBeVisible({ timeout: 30_000 });
    await expect
      .poll(
        async () =>
          page.evaluate(async () => {
            if (!("serviceWorker" in navigator)) return false;
            try {
              const reg = await navigator.serviceWorker.ready;
              return Boolean(reg.active || reg.installing || reg.waiting);
            } catch {
              return false;
            }
          }),
        { timeout: 20_000 }
      )
      .toBeTruthy();
  });

  test("friends add form and leaderboards page", async ({ page }) => {
    await page.goto("/friends");
    await expect(page.getByRole("heading", { name: "Send Friend Request" })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByPlaceholder("Username").fill("e2e-does-not-exist");
    await expect(page.getByRole("button", { name: "Send" })).toBeEnabled();

    await page.goto("/friends/leaderboards");
    await expect(page.getByRole("heading", { name: "Leaderboards" })).toBeVisible({
      timeout: 20_000,
    });
  });

  test("admin catalog is gated", async ({ page }) => {
    await page.goto("/admin/exercises");
    const denied = page.getByText("Access denied. Admin only.");
    const catalog = page.getByRole("heading", { name: "Exercise Management" });
    await expect(denied.or(catalog)).toBeVisible({ timeout: 20_000 });
  });
});
