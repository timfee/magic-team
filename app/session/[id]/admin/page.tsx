import { AdminWrapper } from "@/components/session/admin/admin-wrapper";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = await params;

  return <AdminWrapper sessionId={sessionId} />;
}
