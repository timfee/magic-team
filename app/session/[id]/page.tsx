import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/actions/session";
import { canAccessSession, getUserRole } from "@/lib/utils/permissions";
import { ConnectionStatus } from "@/components/connection-status";
import { SessionContent } from "./session-content";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userSession = await auth();
  const magicSession = await getSession(id);

  if (!magicSession) {
    notFound();
  }

  // Check access permissions
  if (!canAccessSession(magicSession, userSession?.user?.id)) {
    redirect("/");
  }

  const userRole = getUserRole(magicSession, userSession?.user?.id);
  const isAdmin = userRole === "owner" || userRole === "admin";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <ConnectionStatus />
      <SessionContent
        sessionId={id}
        initialSession={magicSession}
        userRole={userRole}
        isAdmin={isAdmin}
        userId={userSession?.user?.id || null}
      />
    </div>
  );
}
