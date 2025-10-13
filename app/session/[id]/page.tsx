import { SessionWrapper } from "@/components/session/session-wrapper";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;

  return <SessionWrapper sessionId={sessionId} />;
}
