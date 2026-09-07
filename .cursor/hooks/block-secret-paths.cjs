/**
 * beforeShellExecution: block staging obvious secrets / local-only paths.
 * Windows-friendly (node). Fail-open on parse errors.
 */
const SECRETISH =
  /(^|[\s"'])(\.env(\.|$)|[\w.-]*service-account[\w.-]*\.json|emulator-data\/|\.env\.local|\.env\.production)([\s"']|$)/i;

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  raw += chunk;
});
process.stdin.on("end", () => {
  let command = "";
  try {
    command = String(JSON.parse(raw || "{}").command || "");
  } catch {
    process.stdout.write(JSON.stringify({ permission: "allow" }));
    return;
  }

  if (!/\bgit\s+(add|commit|stage)\b/i.test(command)) {
    process.stdout.write(JSON.stringify({ permission: "allow" }));
    return;
  }

  if (SECRETISH.test(command)) {
    process.stdout.write(
      JSON.stringify({
        permission: "deny",
        user_message:
          "Blocked: that git command looks like it stages secrets or emulator-only data (.env, service-account JSON, emulator-data).",
        agent_message:
          "Do not stage .env*, *-service-account*.json, or emulator-data/. Use .env.example and documented secrets handling instead.",
      })
    );
    return;
  }

  process.stdout.write(JSON.stringify({ permission: "allow" }));
});
