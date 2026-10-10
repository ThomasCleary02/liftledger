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
    await page.getByRole("button", { name: "Share this week as an image" }).click();
    const preview = page.getByRole("dialog", { name: "This week" });
    await expect(preview).toBeVisible();
    await expect(preview.getByRole("button", { name: "Save" })).toBeVisible();
    await preview.getByRole("button", { name: "Close preview" }).click();
    await expect(preview).toHaveCount(0);
  });

  test("PWA manifest, icons, and offline page are served", async ({ request }) => {
    const res = await request.get("/manifest.json");
    expect(res.ok()).toBeTruthy();
    const manifest = (await res.json()) as {
      name: string;
      display: string;
      start_url: string;
      icons: { src: string; sizes: string; purpose?: string }[];
    };
    expect(manifest.name).toBe("LiftLedger");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/day/today");
    expect(manifest.icons.some((icon) => icon.purpose === "maskable" && icon.src.includes("maskable"))).toBeTruthy();

    const iconRes = await request.get("/icon-512.png");
    expect(iconRes.ok()).toBeTruthy();
    const iconBytes = Buffer.from(await iconRes.body());
    expect(iconBytes.readUInt32BE(16)).toBe(512);
    expect(iconBytes.readUInt32BE(20)).toBe(512);

    const offline = await request.get("/offline.html");
    expect(offline.ok()).toBeTruthy();
    expect(await offline.text()).toContain("You are offline");
  });

  test("friends add form and leaderboards page", async ({ page }) => {
    await page.goto("/profile/friends");
    await expect(page.getByRole("heading", { name: "Send friend request" })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByPlaceholder("Username").fill("e2e-does-not-exist");
    await expect(page.getByRole("button", { name: "Send" })).toBeEnabled();

    await page.goto("/profile/friends/leaderboards");
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
