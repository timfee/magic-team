import Link from "next/link";

export default async function Home() {
  // Simplified - no authentication for now, just show create session option
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              MagicRetro
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Collaborative retrospective sessions powered by Firebase
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/session/create"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Create Session
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Welcome to MagicRetro
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Create retrospective sessions and collaborate with your team in real-time.
            All data is stored in Firebase Firestore.
          </p>
          <Link
            href="/session/create"
            className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Create Your First Session
          </Link>
        </div>
      </div>
    </div>
  );
}
