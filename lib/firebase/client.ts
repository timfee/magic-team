import { env } from "@/env.mjs";
import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Use (default) database - don't pass databaseId parameter for default database
export const db =
  env.NEXT_PUBLIC_FIREBASE_DATABASE_ID === "(default)" ?
    getFirestore(app)
  : getFirestore(app, env.NEXT_PUBLIC_FIREBASE_DATABASE_ID);

export const auth = getAuth(app);

// Connect to Firebase emulators in E2E test mode or when running locally
if (typeof window !== "undefined") {
  const isE2EMode = (window as any).__E2E_TEST_MODE === true;
  const isLocalDev = window.location.hostname === "localhost";

  if (isE2EMode || isLocalDev) {
    try {
      // Connect to Firestore emulator (port 8080 from firebase.json)
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
      console.log("[Firebase] Connected to Firestore emulator");

      // Connect to Auth emulator (port 9099 from firebase.json)
      connectAuthEmulator(auth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
      console.log("[Firebase] Connected to Auth emulator");
    } catch (err) {
      // Emulators may already be connected, ignore errors
      if (err instanceof Error && !err.message.includes("already")) {
        console.warn("[Firebase] Emulator connection warning:", err.message);
      }
    }
  }
}

export { app };
