"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { useAuth } from "@/lib/contexts/auth-context";
import { SessionProvider } from "@/lib/contexts/firebase-session-context";
import { use } from "react";

export default function SessionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = use(params);
  const { userId, userName, userPhoto } = useAuth();

  return (
    <ErrorBoundary>
      <SessionProvider
        sessionId={sessionId}
        userId={userId ?? "anonymous"}
        userName={userName ?? "Anonymous User"}
        userPhoto={userPhoto}>
        {children}
      </SessionProvider>
    </ErrorBoundary>
  );
}
