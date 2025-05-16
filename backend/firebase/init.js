// backend/firebase/init.js

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import firebaseConfig from "./firebaseConfig";

// === Validate Firebase Config ===
const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
requiredKeys.forEach((key) => {
  if (!firebaseConfig[key]) {
    throw new Error(`❌ Firebase config error: Missing "${key}"`);
  }
});

// === Initialize App Once ===
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// === Initialize Services ===
const db = getFirestore(app);
const storage = getStorage(app);

// === Get Auth (With Persistence)
let auth;

function getFirebaseAuth() {
  if (!auth) {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    } catch (e) {
      // If already initialized (e.g., web fallback)
      auth = getAuth(app);
    }
  }
  return auth;
}

export { app, getFirebaseAuth, db, storage };
