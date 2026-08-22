import { expect, test } from "@playwright/test";

test.describe("auth UI (no account writes)", () => {
  test("marketing home loads", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /The training log that looks like a ledger/,
      })
    ).toBeVisible();
  });

  test("sign up form asks for a username", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Sign Up" }).click();
    await expect(page.getByRole("heading", { name: "Open an account" })).toBeVisible();
    await expect(page.getByPlaceholder("Choose a username")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
  });

  test("password reset UI appears without sending mail", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Forgot password?" }).click();
    await expect(page.getByRole("button", { name: "Send Reset Email" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send Reset Email" })).toBeDisabled();
  });
});
