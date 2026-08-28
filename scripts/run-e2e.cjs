const { spawn, spawnSync } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");
const { envWithJava } = require("./java-env.cjs");

const root = path.join(__dirname, "..");
const web = path.join(root, "web");
const PORTS = { firestore: 8080, auth: 9099, storage: 9199 };

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

async function waitForPort(port, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await portOpen(port)) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for 127.0.0.1:${port}`);
}

function stopProcessTree(child) {
  if (!child || child.killed || child.pid == null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  child.kill("SIGINT");
}

function runNode(script) {
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    stdio: "inherit",
    env: envWithJava(),
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  const env = envWithJava();
  env.E2E_EMAIL = env.E2E_EMAIL || "e2e@liftledger.test";
  env.E2E_PASSWORD = env.E2E_PASSWORD || "e2e-password-1";

  const firestoreUp = await portOpen(PORTS.firestore);
  const authUp = await portOpen(PORTS.auth);
  const storageUp = await portOpen(PORTS.storage);
  const allUp = firestoreUp && authUp && storageUp;
  const someUp = firestoreUp || authUp || storageUp;

  if (someUp && !allUp) {
    console.error(
      "A leftover Firebase emulator is occupying a port, but the full suite is not running.",
    );
    console.error(
      `  Firestore ${PORTS.firestore}: ${firestoreUp ? "in use" : "free"}  Auth ${PORTS.auth}: ${authUp ? "in use" : "free"}  Storage ${PORTS.storage}: ${storageUp ? "in use" : "free"}`,
    );
    console.error("Stop `npm run start` if it is running, or kill the leftover Java process:");
    console.error("  netstat -ano | findstr :8080");
    console.error("  taskkill /PID <pid> /T /F");
    process.exit(1);
  }

  let emulatorChild = null;
  if (!allUp) {
    emulatorChild = spawn(process.execPath, [path.join(__dirname, "start-emulators.cjs")], {
      cwd: root,
      stdio: "inherit",
      env,
    });
  }

  try {
    await waitForPort(PORTS.firestore, 180_000);
    await waitForPort(PORTS.auth, 180_000);
    await waitForPort(PORTS.storage, 180_000);
    runNode(path.join(__dirname, "seed-emulator-catalog.cjs"));
    runNode(path.join(__dirname, "seed-emulator-e2e-user.cjs"));

    const extra = process.argv.slice(2);
    const playwright = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["playwright", "test", ...extra],
      { cwd: web, stdio: "inherit", env, shell: process.platform === "win32" },
    );

    const code = await new Promise((resolve) => {
      playwright.on("exit", (exitCode, signal) => resolve(signal ? 1 : exitCode ?? 1));
    });
    process.exitCode = code;
  } finally {
    stopProcessTree(emulatorChild);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
