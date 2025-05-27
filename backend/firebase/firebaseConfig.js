import dotenv from "dotenv";
dotenv.config();

// ✅ Validate required Firebase environment variables
[
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_APP_ID",
].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required Firebase env variable: ${key}`);
  }
});

// ✅ Construct Firebase config from environment
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  ...(process.env.FIREBASE_MEASUREMENT_ID && {
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  }),
};

export default firebaseConfig;
