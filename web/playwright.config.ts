import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function loadLocalEnv() {
  const file = path.join(root, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq);
    let value = line.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = value;
  }
}

loadLocalEnv();

export const AUTH_FILE = path.join(root, "e2e/.auth/user.json");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "anon",
      testMatch: /auth-ui\.spec\.ts/,
      use: {
        ...devices["iPhone 12 Pro"],
        browserName: "chromium",
      },
    },
    { name: "setup", testMatch: /auth\.setup\.ts/, timeout: 90_000 },
    {
      name: "iphone",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts|auth-ui\.spec\.ts/,
      use: {
        ...devices["iPhone 12 Pro"],
        browserName: "chromium",
        storageState: AUTH_FILE,
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
