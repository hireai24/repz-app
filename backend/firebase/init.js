// backend/firebase/init.js

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // ✅ NEW
import firebaseConfig from './firebaseConfig.js';

// === Validate Critical Config Keys ===
const criticalKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
criticalKeys.forEach((key) => {
  if (!firebaseConfig[key]) {
    throw new Error(`❌ Firebase config error: Missing required value for "${key}"`);
  }
});

// === Initialize Firebase App Safely ===
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// === Initialize Services ===
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // ✅ NEW

// === Export ===
export { auth, db, storage };
