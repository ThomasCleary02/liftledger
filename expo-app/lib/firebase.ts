import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: "lift-ledger-8f627",
  storageBucket: "lift-ledger-8f627.firebasestorage.app",
  messagingSenderId: "638321739341",
  appId: "1:638321739341:web:b3c4b8cf287dec4e907e04",
  measurementId: "G-M04D4MX5J7"
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, Platform.OS === 'web' ? {} : {
  experimentalAutoDetectLongPolling: true
});

export const auth = Platform.OS === 'web' 
  ? getAuth(app) 
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

// Create service instances from shared package
import { createWorkoutService } from "@liftledger/shared/firestore/workouts";
import { createExerciseService } from "@liftledger/shared/firestore/exercises";
import { createAccountService } from "@liftledger/shared/firestore/account";

export const workoutService = createWorkoutService(db, auth);
export const exerciseService = createExerciseService(db);
export const accountService = createAccountService(db, auth);