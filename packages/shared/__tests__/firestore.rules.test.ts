import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  Timestamp,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const rules = readFileSync(join(root, "firestore.rules"), "utf8");

const ADMIN_EMAIL = "thomcleary15@gmail.com";

let testEnv: RulesTestEnvironment;

function dbFor(uid: string, email?: string) {
  return testEnv.authenticatedContext(uid, email ? { email } : { email: `${uid}@mail.test` }).firestore();
}

async function seed(path: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

describe("firestore.rules", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "demo-liftledger",
      firestore: { rules, host: "127.0.0.1", port: 8080 },
    });
  });

  afterAll(async () => {
    await testEnv?.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it("lets anyone read exercises and only the admin write them", async () => {
    await seed("exercises/bench_press", { name: "Bench Press", modality: "strength" });
    const open = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(open, "exercises/bench_press")));

    const alice = dbFor("alice");
    await assertFails(setDoc(doc(alice, "exercises/new_lift"), { name: "Nope" }));

    const admin = dbFor("admin", ADMIN_EMAIL);
    await assertSucceeds(setDoc(doc(admin, "exercises/new_lift"), { name: "Admin Lift" }));
  });

  it("scopes accounts to the owner, with friend get access", async () => {
    await seed("accounts/alice", { username: "alice" });
    const alice = dbFor("alice");
    const bob = dbFor("bob");
    await assertSucceeds(getDoc(doc(alice, "accounts/alice")));
    await assertFails(getDoc(doc(bob, "accounts/alice")));
    await assertSucceeds(setDoc(doc(alice, "accounts/alice"), { username: "alice2" }));
    await assertFails(setDoc(doc(bob, "accounts/alice"), { username: "hacked" }));

    await seed("friends/alice_bob", { userId: "alice", friendUserId: "bob", createdAt: Timestamp.now() });
    await assertSucceeds(getDoc(doc(bob, "accounts/alice")));
  });

  it("lets a user claim their own username and blocks stealing someone else's", async () => {
    const alice = dbFor("alice");
    await assertSucceeds(setDoc(doc(alice, "usernameIndex/alice"), { userId: "alice" }));
    const bob = dbFor("bob");
    await assertFails(setDoc(doc(bob, "usernameIndex/alice"), { userId: "bob" }));
    await assertSucceeds(getDoc(doc(bob, "usernameIndex/alice")));
  });

  it("lets owners CRUD their days and friends read them", async () => {
    const payload = {
      userId: "alice",
      date: "2026-01-01",
      isRestDay: false,
      exercises: [],
    };
    const alice = dbFor("alice");
    await assertSucceeds(setDoc(doc(alice, "days/alice_2026-01-01"), payload));
    await assertSucceeds(updateDoc(doc(alice, "days/alice_2026-01-01"), { isRestDay: true }));

    const bob = dbFor("bob");
    await assertFails(setDoc(doc(bob, "days/alice_2026-01-02"), { ...payload, date: "2026-01-02" }));
    await assertFails(getDoc(doc(bob, "days/alice_2026-01-01")));

    await seed("friends/alice_bob", { userId: "alice", friendUserId: "bob", createdAt: Timestamp.now() });
    await assertSucceeds(getDoc(doc(bob, "days/alice_2026-01-01")));
    await assertFails(updateDoc(doc(bob, "days/alice_2026-01-01"), { isRestDay: false }));
  });

  it("rejects day updates that change userId or date", async () => {
    const alice = dbFor("alice");
    await assertSucceeds(
      setDoc(doc(alice, "days/alice_2026-01-01"), {
        userId: "alice",
        date: "2026-01-01",
        isRestDay: false,
        exercises: [],
      })
    );
    await assertFails(updateDoc(doc(alice, "days/alice_2026-01-01"), { date: "2026-01-02" }));
    await assertFails(updateDoc(doc(alice, "days/alice_2026-01-01"), { userId: "bob" }));
  });

  it("lets owners manage templates", async () => {
    const alice = dbFor("alice");
    const bob = dbFor("bob");
    await assertSucceeds(setDoc(doc(alice, "workoutTemplates/t1"), { ownerId: "alice", name: "Push" }));
    await assertFails(getDoc(doc(bob, "workoutTemplates/t1")));
    await assertFails(setDoc(doc(bob, "workoutTemplates/t1"), { ownerId: "alice", name: "Stolen" }));
    await assertSucceeds(deleteDoc(doc(alice, "workoutTemplates/t1")));
  });

  it("creates friend requests only as the sender and lets the recipient accept", async () => {
    const alice = dbFor("alice");
    const bob = dbFor("bob");
    const pending = {
      fromUserId: "alice",
      toUserId: "bob",
      status: "pending",
      createdAt: Timestamp.now(),
    };
    await assertFails(setDoc(doc(alice, "friendRequests/bob_alice"), pending));
    await assertSucceeds(setDoc(doc(alice, "friendRequests/alice_bob"), pending));
    await assertFails(updateDoc(doc(alice, "friendRequests/alice_bob"), { status: "accepted" }));
    await assertSucceeds(updateDoc(doc(bob, "friendRequests/alice_bob"), { status: "accepted" }));
  });

  it("creates a friend pair only when there is a pending incoming request", async () => {
    const bob = dbFor("bob");
    const pair = {
      userId: "alice",
      friendUserId: "bob",
      createdAt: Timestamp.now(),
    };
    await assertFails(setDoc(doc(bob, "friends/alice_bob"), pair));
    await seed("friendRequests/alice_bob", {
      fromUserId: "alice",
      toUserId: "bob",
      status: "pending",
      createdAt: Timestamp.now(),
    });
    await assertSucceeds(setDoc(doc(bob, "friends/alice_bob"), pair));
    expect((await getDoc(doc(bob, "friends/alice_bob"))).exists()).toBe(true);
    await assertFails(updateDoc(doc(bob, "friends/alice_bob"), { friendUserId: "carol" }));
  });

  it("lets a user claim their own email index and blocks other emails", async () => {
    const alice = dbFor("alice", "alice@mail.test");
    const bob = dbFor("bob", "bob@mail.test");
    await assertSucceeds(setDoc(doc(alice, "emailIndex/alice@mail.test"), { userId: "alice" }));
    await assertFails(setDoc(doc(alice, "emailIndex/bob@mail.test"), { userId: "alice" }));
    await assertFails(getDoc(doc(bob, "emailIndex/alice@mail.test")));
    await assertSucceeds(deleteDoc(doc(alice, "emailIndex/alice@mail.test")));
  });

  it("scopes workouts to the owner", async () => {
    const alice = dbFor("alice");
    const bob = dbFor("bob");
    await assertSucceeds(setDoc(doc(alice, "workouts/w1"), { ownerId: "alice", name: "Session" }));
    await assertSucceeds(getDoc(doc(alice, "workouts/w1")));
    await assertFails(getDoc(doc(bob, "workouts/w1")));
    await assertFails(setDoc(doc(bob, "workouts/w1"), { ownerId: "alice", name: "Stolen" }));
  });

  it("lets owners delete their days and blocks unauthenticated writes", async () => {
    const alice = dbFor("alice");
    await assertSucceeds(
      setDoc(doc(alice, "days/alice_2026-02-02"), {
        userId: "alice",
        date: "2026-02-02",
        isRestDay: false,
        exercises: [],
      })
    );
    await assertSucceeds(deleteDoc(doc(alice, "days/alice_2026-02-02")));

    const open = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(open, "days/alice_2026-02-03"), {
        userId: "alice",
        date: "2026-02-03",
        isRestDay: false,
        exercises: [],
      })
    );
  });

  it("lets the recipient reject a friend request", async () => {
    const alice = dbFor("alice");
    const bob = dbFor("bob");
    await assertSucceeds(
      setDoc(doc(alice, "friendRequests/alice_bob"), {
        fromUserId: "alice",
        toUserId: "bob",
        status: "pending",
        createdAt: Timestamp.now(),
      })
    );
    await assertSucceeds(updateDoc(doc(bob, "friendRequests/alice_bob"), { status: "rejected" }));
    await assertFails(updateDoc(doc(alice, "friendRequests/alice_bob"), { status: "accepted" }));
  });
});
