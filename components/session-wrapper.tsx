"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionEvent } from "@/lib/socket/client";
import type { SessionStage } from "@/lib/types/session";

interface SessionWrapperProps {
  sessionId: string;
  initialStage: string;
  children: (stage: SessionStage) => React.ReactNode;
}

export const SessionWrapper = ({
  sessionId,
  initialStage,
  children,
}: SessionWrapperProps) => {
  const [currentStage, setCurrentStage] = useState<SessionStage>(
    initialStage as SessionStage,
  );
  const router = useRouter();

  // Listen for stage changes
  useSessionEvent<{ sessionId: string; newStage: SessionStage }>(
    "stage:changed",
    (data) => {
      if (data.sessionId === sessionId) {
        setCurrentStage(data.newStage);
        // Refresh to get new server-rendered content
        router.refresh();
      }
    },
    [sessionId],
  );

  return <>{children(currentStage)}</>;
};
