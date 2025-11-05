import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
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

// React Native: prefer long polling to avoid transport warnings
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});

// Persist auth state across app restarts on RN
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});