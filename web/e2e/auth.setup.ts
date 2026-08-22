import fs from "node:fs";
import path from "node:path";
import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = path.join(process.cwd(), "e2e/.auth/user.json");

setup("sign in", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set E2E_EMAIL and E2E_PASSWORD in web/.env.local to run Playwright smoke tests."
    );
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByPlaceholder("Enter your email")).toBeVisible({ timeout: 30_000 });
  await page.getByPlaceholder("Enter your email").fill(email);
  await page.getByPlaceholder("Enter your password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/day\//, { timeout: 60_000, waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("More for this day")).toBeVisible({ timeout: 30_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
