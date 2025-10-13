
import CreateSessionForm from "@/components/session/create-session-form";

export default async function CreateSessionPage() {

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Create New Session
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Set up your retrospective session with custom categories and settings.
          </p>
        </div>

        <CreateSessionForm />
      </div>
    </div>
  );
}
