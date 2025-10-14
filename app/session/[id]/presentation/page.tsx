import { PresentationView } from "@/components/session/presentation/presentation-view";

export default async function PresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;

  return <PresentationView sessionId={sessionId} />;
}
