import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserSessions } from "@/lib/actions/session";

export default async function Home() {
  const session = await auth();
  const sessions = session?.user ? await getUserSessions() : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              MagicRetro
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Collaborative retrospective sessions
            </p>
          </div>
          <div className="flex gap-4">
            {session?.user ? (
              <>
                <Link
                  href="/session/create"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Create Session
                </Link>
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/api/auth/signin"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {session?.user ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Your Sessions
              </h2>
            </div>

            {sessions.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                  No sessions yet
                </h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  Get started by creating your first retrospective session.
                </p>
                <Link
                  href="/session/create"
                  className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Create Session
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/session/${session.id}`}
                    className="rounded-lg border border-zinc-200 bg-white p-6 hover:border-blue-500 hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                      {session.name}
                    </h3>
                    {session.description && (
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {session.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {session.currentStage.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-500">
                        {session.categories.length} categories
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Welcome to MagicRetro
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              Sign in to create and join retrospective sessions with your team.
            </p>
            <Link
              href="/api/auth/signin"
              className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Sign In to Get Started
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
