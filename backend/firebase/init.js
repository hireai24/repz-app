// backend/firebase/init.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "./firebaseConfig.js"; // ✅ Ensure .js for ESM

// ✅ Validate essential Firebase keys
const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
requiredKeys.forEach((key) => {
  if (!firebaseConfig[key]) {
    throw new Error(`❌ Firebase config error: Missing "${key}"`);
  }
});

// ✅ Initialize Firebase app (only once)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Initialize Firestore & Storage services
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ No auth for backend — only db & storage needed
export { app, db, storage };
