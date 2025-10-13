import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/actions/session";
import { getSessionIdeas, getSessionGroups } from "@/lib/actions/ideas";
import { SessionProvider } from "@/lib/contexts/session-context";
import SessionBoard from "./components/session-board";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Fetch session data
  const magicSession = await getSession(sessionId);

  if (!magicSession) {
    redirect("/");
  }

  // Fetch ideas and groups
  const [ideas, groups] = await Promise.all([
    getSessionIdeas(sessionId),
    getSessionGroups(sessionId),
  ]);

  return (
    <SessionProvider
      initialSession={magicSession}
      initialIdeas={ideas}
      initialGroups={groups}
      userId={session.user.id}
      userName={session.user.name ?? "Anonymous"}
    >
      <SessionBoard />
    </SessionProvider>
  );
}
