import { Firestore } from "firebase/firestore";
import { Auth } from "firebase/auth";

// Export types only - Firebase instances are passed in
export type { Firestore, Auth };

// Re-export Firebase types that services need
export type {
  Timestamp,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Unsubscribe
} from "firebase/firestore";
