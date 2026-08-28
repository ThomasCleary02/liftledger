const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const javaName = process.platform === "win32" ? "java.exe" : "java";

function javaWorks(env) {
  try {
    execFileSync("java", ["-version"], {
      env,
      stdio: "ignore",
      shell: process.platform === "win32",
    });
    return true;
  } catch {
    return false;
  }
}

function firstExistingJava(dir) {
  if (!fs.existsSync(dir)) return null;
  const direct = path.join(dir, "bin", javaName);
  if (fs.existsSync(direct)) return dir;
  for (const name of fs.readdirSync(dir)) {
    const home = path.join(dir, name);
    const exe = path.join(home, "bin", javaName);
    if (fs.existsSync(exe)) return home;
  }
  return null;
}

function findJavaHome() {
  const fromEnv = process.env.JAVA_HOME;
  if (fromEnv && fs.existsSync(path.join(fromEnv, "bin", javaName))) {
    return fromEnv;
  }

  const searchRoots =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Eclipse Adoptium",
          "C:\\Program Files\\Microsoft",
          "C:\\Program Files\\Java",
          "C:\\Program Files\\Amazon Corretto",
          "C:\\Program Files\\Zulu",
        ]
      : ["/usr/lib/jvm", "/Library/Java/JavaVirtualMachines"];

  for (const dir of searchRoots) {
    const found = firstExistingJava(dir);
    if (found) return found;
  }
  return null;
}

function envWithJava() {
  const env = { ...process.env };
  if (javaWorks(env)) return env;

  const javaHome = findJavaHome();
  if (!javaHome) {
    console.error(
      "Java JDK 21+ is required for the Firebase emulators, but `java` was not found.",
    );
    console.error("Install Temurin 21, then open a new terminal.");
    process.exit(1);
  }

  env.JAVA_HOME = javaHome;
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") || "PATH";
  env[pathKey] = `${path.join(javaHome, "bin")}${path.delimiter}${env[pathKey] || ""}`;
  if (!javaWorks(env)) {
    console.error(`Found JDK at ${javaHome}, but could not run java.`);
    process.exit(1);
  }
  console.log(`i  emulators: using JDK at ${javaHome}`);
  return env;
}

module.exports = { envWithJava };
