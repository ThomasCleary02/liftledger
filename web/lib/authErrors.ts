import { shouldUseFirebaseEmulators } from "./firebaseEmulators";

function authCode(error: unknown): string {
  if (typeof error === "object" && error && "code" in error) {
    return String((error as { code?: string }).code || "");
  }
  return "";
}

function authMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? "");
}

/** Map Firebase Auth failures to short copy people can act on. */
export function friendlyAuthError(error: unknown, options?: { localEmulators?: boolean }): string {
  const code = authCode(error);
  const message = authMessage(error);
  const blob = `${code} ${message}`.toLowerCase();
  const local = options?.localEmulators ?? shouldUseFirebaseEmulators();

  if (blob.includes("user-not-found") || blob.includes("invalid-credential") || blob.includes("wrong-password")) {
    if (local && blob.includes("user-not-found")) {
      return "No local account with that email. On the emulator, create one with Sign Up — production logins do not work here.";
    }
    if (blob.includes("user-not-found")) {
      return "No account found with that email. Check the address or create an account.";
    }
    return "Email or password is incorrect. Try again, or reset your password.";
  }
  if (blob.includes("email-already-in-use")) {
    return "An account with this email already exists. Log in instead.";
  }
  if (blob.includes("weak-password")) {
    return "Password is too weak. Use at least 6 characters.";
  }
  if (blob.includes("invalid-email")) {
    return "That email address does not look valid.";
  }
  if (blob.includes("too-many-requests")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (blob.includes("network-request-failed")) {
    return "Could not reach the sign-in service. Check your connection and try again.";
  }
  if (code.startsWith("auth/") || blob.includes("firebase:")) {
    return "Could not sign in. Check your email and password, then try again.";
  }
  return message || "Something went wrong. Please try again.";
}
