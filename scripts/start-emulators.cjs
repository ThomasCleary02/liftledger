const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { envWithJava } = require("./java-env.cjs");

const root = path.join(__dirname, "..");
const dataDir = path.join(root, "emulator-data");
const metadata = path.join(dataDir, "firebase-export-metadata.json");

fs.mkdirSync(dataDir, { recursive: true });

const args = [
  "emulators:start",
  "--project",
  "demo-liftledger",
  "--export-on-exit",
  dataDir,
];

if (fs.existsSync(metadata)) {
  args.push("--import", dataDir);
}

const firebaseBin = require.resolve("firebase-tools/lib/bin/firebase.js");
const child = spawn(process.execPath, [firebaseBin, ...args], {
  cwd: root,
  stdio: "inherit",
  env: envWithJava(),
});

const stop = () => {
  if (child.killed) return;
  child.kill(process.platform === "win32" ? undefined : "SIGINT");
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 0);
});
