"use client";

import { auth } from "@/lib/firebase/client";
import {
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextValue {
  user: User | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // E2E Test Mode: Sign in anonymously to Firebase Auth emulator
    if (typeof window !== 'undefined' && (window as any).__E2E_TEST_MODE) {
      const mockUser = (window as any).__E2E_MOCK_USER || {
        uid: 'test-e2e-user-12345',
        email: 'e2e-test@example.com',
        displayName: 'E2E Test User',
        photoURL: 'https://i.pravatar.cc/150?img=10',
      };

      console.log('[E2E] Attempting to sign in to Firebase Auth emulator...');

      // Sign in anonymously to Firebase Auth emulator
      // This gives us a real Firebase auth token that works with Firestore
      import('firebase/auth').then(({ signInAnonymously }) => {
        signInAnonymously(auth)
          .then((userCredential) => {
            console.log('[E2E] Successfully signed in to emulator:', userCredential.user.uid);
            // User is automatically set via onAuthStateChanged below
          })
          .catch((error) => {
            console.error('[E2E] Failed to sign in to emulator:', error);
            // Fall back to mock user if emulator sign-in fails
            const e2eUser = {
              ...mockUser,
              emailVerified: true,
              isAnonymous: false,
              metadata: {},
              providerData: [],
              refreshToken: 'mock-refresh',
              tenantId: null,
              delete: async () => {},
              getIdToken: async () => 'mock-token',
              getIdTokenResult: async () => ({} as any),
              reload: async () => {},
              toJSON: () => ({}),
              providerId: 'google.com',
            } as unknown as User;

            setUser(e2eUser);
            setIsLoading(false);
          });
      });
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const value: AuthContextValue = {
    user,
    userId: user?.uid ?? null,
    userEmail: user?.email ?? null,
    userName: user?.displayName ?? null,
    userPhoto: user?.photoURL ?? null,
    isLoading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
