import SessionBoard from "@/components/session/session-board";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;

  return <SessionBoard sessionId={sessionId} />;
}
