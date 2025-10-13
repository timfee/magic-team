import { SessionProvider } from "@/lib/contexts/firebase-session-context";
import SessionBoard from "./components/session-board";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;

  // No authentication check - Firebase Auth will be handled in context
  // If user needs to be authenticated, the Firebase rules will enforce it

  return (
    <SessionProvider
      sessionId={sessionId}
      userId="temp-user" // Will be replaced with Firebase Auth user
      userName="Anonymous User" // Will be replaced with Firebase Auth user
    >
      <SessionBoard />
    </SessionProvider>
  );
}
