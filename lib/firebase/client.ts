import { env } from "@/env.mjs";
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export { app };
