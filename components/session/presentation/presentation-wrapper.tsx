"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { SessionProvider } from "@/lib/contexts/firebase-session-context";
import { PresentationView } from "./presentation-view";

interface PresentationWrapperProps {
  sessionId: string;
}

export const PresentationWrapper = ({
  sessionId,
}: PresentationWrapperProps) => {
  const { userId, userName, userPhoto } = useAuth();

  return (
    <SessionProvider
      sessionId={sessionId}
      userId={userId ?? "anonymous"}
      userName={userName ?? "Anonymous User"}
      userPhoto={userPhoto}>
      <PresentationView sessionId={sessionId} />
    </SessionProvider>
  );
};
