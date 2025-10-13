import { getSession } from "@/lib/actions/session";
import { auth } from "@/lib/auth";
import { getUserRole } from "@/lib/utils/permissions";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StageControls } from "./stage-controls";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userSession = await auth();

  if (!userSession?.user) {
    redirect("/api/auth/signin");
  }

  const magicSession = await getSession(id);

  if (!magicSession) {
    notFound();
  }

  const userRole = getUserRole(magicSession, userSession.user.id);

  // Only owner and admins can access
  if (userRole !== "owner" && userRole !== "admin") {
    redirect(`/session/${id}`);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/session/${id}`}
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Back to Session
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Admin Controls
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage {magicSession.name}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main controls */}
          <div className="space-y-6 lg:col-span-2">
            <StageControls
              sessionId={id}
              currentStage={magicSession.currentStage}
              userId={userSession.user.id}
            />

            {/* Quick Stats */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Session Stats
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {magicSession._count?.presence ?? 0}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Active Users
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {magicSession._count?.ideas ?? 0}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Ideas
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {magicSession.categories.length}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Categories
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Presentation View */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Presentation Mode
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Display on a projector or shared screen
              </p>
              <Link
                href={`/session/${id}/presentation`}
                target="_blank"
                className="mt-4 block w-full rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Open Presentation View
              </Link>
            </div>

            {/* Session Info */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Session Info
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-zinc-600 dark:text-zinc-400">Owner</dt>
                  <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">
                    {magicSession.owner.name ?? magicSession.owner.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-600 dark:text-zinc-400">
                    Visibility
                  </dt>
                  <dd className="mt-1 font-medium text-zinc-900 capitalize dark:text-zinc-50">
                    {magicSession.visibility}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-600 dark:text-zinc-400">
                    Your Role
                  </dt>
                  <dd className="mt-1 font-medium text-zinc-900 capitalize dark:text-zinc-50">
                    {userRole}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
