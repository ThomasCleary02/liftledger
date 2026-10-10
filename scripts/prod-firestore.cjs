/**
 * Production Firestore client authenticated as the Firebase CLI user (npx firebase login).
 * Shared by prod catalog seeding and one-off account migrations.
 */
const { Firestore } = require("@google-cloud/firestore");
const { UserRefreshClient } = require("google-auth-library");
const { getGlobalDefaultAccount } = require("firebase-tools/lib/auth");
const firebaseApi = require("firebase-tools/lib/api");

const PROJECT = "lift-ledger-8f627";

function getProdFirestore(tag) {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

  const account = getGlobalDefaultAccount();
  if (!account?.tokens?.refresh_token) {
    console.error(`[${tag}] Firebase CLI is not logged in. Run: npx firebase login`);
    process.exit(1);
  }
  console.log(`[${tag}] using Firebase CLI account ${account.user?.email || "(unknown)"}`);

  const authClient = new UserRefreshClient({
    clientId: firebaseApi.clientId(),
    clientSecret: firebaseApi.clientSecret(),
    refreshToken: account.tokens.refresh_token,
  });

  return new Firestore({ projectId: PROJECT, authClient });
}

function foldName(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slugify(input) {
  return (input || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

module.exports = { PROJECT, getProdFirestore, foldName, slugify };
