import { PresentationWrapper } from "@/components/session/presentation/presentation-wrapper";

export default async function PresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;

  return <PresentationWrapper sessionId={sessionId} />;
}
