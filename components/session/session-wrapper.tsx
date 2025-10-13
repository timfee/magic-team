"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { SessionProvider } from "@/lib/contexts/firebase-session-context";
import SessionBoard from "./session-board";

interface SessionWrapperProps {
  sessionId: string;
}

export const SessionWrapper = ({ sessionId }: SessionWrapperProps) => {
  const { userId, userName, userPhoto } = useAuth();

  return (
    <SessionProvider
      sessionId={sessionId}
      userId={userId ?? "anonymous"}
      userName={userName ?? "Anonymous User"}
      userPhoto={userPhoto}>
      <SessionBoard />
    </SessionProvider>
  );
};
