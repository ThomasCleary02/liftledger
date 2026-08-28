import fs from "node:fs";
import path from "node:path";
import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = path.join(process.cwd(), "e2e/.auth/user.json");

setup("sign in", async ({ page }) => {
  const email = process.env.E2E_EMAIL || "e2e@liftledger.test";
  const password = process.env.E2E_PASSWORD || "e2e-password-1";

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  const emailField = page.getByPlaceholder("Enter your email");
  const passwordField = page.getByPlaceholder("Enter your password");
  await expect(emailField).toBeVisible({ timeout: 60_000 });

  const fillForm = async () => {
    await emailField.fill(email);
    await passwordField.fill(password);
    await expect(emailField).toHaveValue(email);
  };

  await fillForm();
  await page.getByRole("button", { name: "Sign In" }).click();
  try {
    await page.waitForURL(/\/day\//, { timeout: 20_000, waitUntil: "domcontentloaded" });
  } catch {
    // Next may remount the login form after the first compile; fill again.
    await expect(emailField).toBeVisible({ timeout: 30_000 });
    await fillForm();
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/day\//, { timeout: 60_000, waitUntil: "domcontentloaded" });
  }
  await expect(page.getByLabel("More for this day")).toBeVisible({ timeout: 30_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
