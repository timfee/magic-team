"use client";

import { useSession } from "@/lib/contexts/firebase-session-context";
import type { SessionStage } from "@/lib/types/session";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface SessionWrapperProps {
  sessionId: string;
  initialStage: string;
  children: (stage: SessionStage) => React.ReactNode;
}

export const SessionWrapper = ({
  sessionId: _sessionId,
  initialStage: _initialStage,
  children,
}: SessionWrapperProps) => {
  const router = useRouter();
  const { currentStage } = useSession();

  // Refresh on stage changes for server-rendered content
  useEffect(() => {
    router.refresh();
  }, [currentStage, router]);

  return <>{children(currentStage)}</>;
};
