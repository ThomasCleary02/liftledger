/**
 * Re-point one user's logged exercise to a different catalog exercise in production.
 * Rewrites exerciseId + name only (sets untouched) across days, templates, and
 * account favorites / trackedExercises. Dry-run unless --apply; --apply writes a
 * JSON backup of every touched doc to .migration-backups/ first.
 *
 * Find what is logged (substring match on id or name):
 *   node scripts/migrate-user-exercise.cjs --email you@example.com --find pushdown
 *
 * Preview, then apply:
 *   node scripts/migrate-user-exercise.cjs --email you@example.com --from cable_tricep_pushdown --to tricep_press_machine
 *   node scripts/migrate-user-exercise.cjs --email you@example.com --from cable_tricep_pushdown --to tricep_press_machine --apply
 *
 * Optional: --since YYYY-MM-DD / --until YYYY-MM-DD to limit which days change.
 */
const fs = require("node:fs");
const path = require("node:path");
const { getProdFirestore, foldName } = require("./prod-firestore.cjs");

const TAG = "migrate";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const email = (arg("email") || "").trim().toLowerCase();
const find = arg("find");
const from = arg("from");
const to = arg("to");
const since = arg("since");
const until = arg("until");
const apply = process.argv.includes("--apply");

function usage(message) {
  if (message) console.error(`[${TAG}] ${message}`);
  console.error(
    `Usage: --email <email> (--find <text> | --from <exerciseId|name> --to <catalogId> [--since D] [--until D] [--apply])`
  );
  process.exit(1);
}

if (!email) usage("--email is required");
if (!find && !(from && to)) usage("pass --find, or both --from and --to");

function matchesFrom(ex) {
  if (!ex) return false;
  if (ex.exerciseId && ex.exerciseId === from) return true;
  return foldName(ex.name) === foldName(from) || foldName(ex.exerciseId) === foldName(from);
}

function inRange(date) {
  if (since && date < since) return false;
  if (until && date > until) return false;
  return true;
}

async function resolveUserId(db) {
  const snap = await db.collection("emailIndex").doc(email).get();
  const userId = snap.exists ? snap.data().userId : null;
  if (!userId) usage(`no emailIndex entry for ${email}`);
  return userId;
}

async function runFind(db, userId) {
  const needle = foldName(find);
  const days = await db.collection("days").where("userId", "==", userId).get();
  const rows = new Map();
  for (const doc of days.docs) {
    const { date, exercises } = doc.data();
    for (const ex of Array.isArray(exercises) ? exercises : []) {
      const hay = foldName(`${ex.exerciseId || ""} ${ex.name || ""}`);
      if (!hay.includes(needle)) continue;
      const key = `${ex.exerciseId || "(no id)"} | ${ex.name || "(no name)"}`;
      const row = rows.get(key) || { count: 0, first: date, last: date };
      row.count += 1;
      if (date < row.first) row.first = date;
      if (date > row.last) row.last = date;
      rows.set(key, row);
    }
  }
  if (rows.size === 0) {
    console.log(`[${TAG}] nothing logged matching "${find}"`);
    return;
  }
  for (const [key, row] of rows) {
    console.log(`  ${key}  ×${row.count}  ${row.first} → ${row.last}`);
  }
}

async function runMigrate(db, userId) {
  const target = await db.collection("exercises").doc(to).get();
  if (!target.exists) usage(`target catalog exercise "${to}" not found — seed it first`);
  const targetName = target.data().name;
  const rewrite = (ex) => (matchesFrom(ex) ? { ...ex, exerciseId: to, name: targetName } : ex);

  const updates = [];

  const days = await db.collection("days").where("userId", "==", userId).get();
  for (const doc of days.docs) {
    const data = doc.data();
    if (!inRange(data.date)) continue;
    const exercises = Array.isArray(data.exercises) ? data.exercises : [];
    const hits = exercises.filter(matchesFrom).length;
    if (!hits) continue;
    updates.push({
      ref: doc.ref,
      label: `day ${data.date} (${hits} entr${hits === 1 ? "y" : "ies"})`,
      before: data,
      patch: { exercises: exercises.map(rewrite) },
    });
  }

  const templates = await db.collection("workoutTemplates").where("ownerId", "==", userId).get();
  for (const doc of templates.docs) {
    const data = doc.data();
    const exercises = Array.isArray(data.exercises) ? data.exercises : [];
    if (!exercises.some(matchesFrom)) continue;
    updates.push({
      ref: doc.ref,
      label: `template "${data.name || doc.id}"`,
      before: data,
      patch: { exercises: exercises.map(rewrite) },
    });
  }

  const accountRef = db.collection("accounts").doc(userId);
  const account = await accountRef.get();
  if (account.exists) {
    const data = account.data();
    const patch = {};
    for (const field of ["favoriteExercises", "trackedExercises"]) {
      const list = Array.isArray(data[field]) ? data[field] : [];
      if (!list.some((id) => id === from || foldName(id) === foldName(from))) continue;
      patch[field] = [...new Set(list.map((id) => (id === from || foldName(id) === foldName(from) ? to : id)))];
    }
    if (Object.keys(patch).length) {
      updates.push({
        ref: accountRef,
        label: `account ${Object.keys(patch).join(" + ")}`,
        before: data,
        patch,
      });
    }
  }

  console.log(`[${TAG}] ${from} → ${to} ("${targetName}") for ${email}`);
  if (since || until) console.log(`[${TAG}] date range ${since || "…"} → ${until || "…"}`);
  if (!updates.length) {
    console.log(`[${TAG}] nothing to change`);
    return;
  }
  for (const u of updates) console.log(`  ${u.label}`);

  if (!apply) {
    console.log(`[${TAG}] dry-run: ${updates.length} doc(s) would change. Re-run with --apply.`);
    return;
  }

  const backupDir = path.join(__dirname, "..", ".migration-backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(
    backupDir,
    `${new Date().toISOString().replace(/[:.]/g, "-")}-${userId}-${from}-to-${to}.json`
  );
  fs.writeFileSync(
    backupFile,
    JSON.stringify(updates.map((u) => ({ path: u.ref.path, before: u.before })), null, 2)
  );
  console.log(`[${TAG}] backup written to ${path.relative(process.cwd(), backupFile)}`);

  const batch = db.batch();
  for (const u of updates) batch.update(u.ref, u.patch);
  await batch.commit();
  console.log(`[${TAG}] updated ${updates.length} doc(s)`);
}

async function main() {
  const db = getProdFirestore(TAG);
  const userId = await resolveUserId(db);
  if (find) await runFind(db, userId);
  else await runMigrate(db, userId);
}

main().catch((error) => {
  console.error(`[${TAG}] failed`, error.message || error);
  process.exit(1);
});
