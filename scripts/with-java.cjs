const { spawn } = require("node:child_process");
const { envWithJava } = require("./java-env.cjs");

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: node scripts/with-java.cjs <command> [...args]");
  process.exit(1);
}

function quote(arg) {
  if (!/[\s"]/.test(arg)) return arg;
  return `"${arg.replace(/"/g, '\\"')}"`;
}

const child = spawn(args.map(quote).join(" "), {
  stdio: "inherit",
  shell: true,
  env: envWithJava(),
});

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
