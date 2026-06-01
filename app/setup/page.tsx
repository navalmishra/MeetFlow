import { getMissingEnvVars } from '@/lib/env';

export default function SetupPage() {
  const missing = getMissingEnvVars();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-dark-2 px-6 py-12 text-white">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-bold">Configuration required</h1>
        <p className="mt-3 text-sky-1">
          Copy <code className="rounded bg-dark-3 px-2 py-1">.env.example</code> to{' '}
          <code className="rounded bg-dark-3 px-2 py-1">.env.local</code> and set the
          values below. Restart the dev server after saving.
        </p>
      </div>
      <ul className="w-full max-w-md space-y-2 rounded-xl bg-dark-1 p-6">
        {missing.map((name) => (
          <li key={name} className="font-mono text-sm text-orange-1">
            {name}
          </li>
        ))}
      </ul>
      <p className="max-w-md text-center text-sm text-sky-2">
        Optional for meeting history: <span className="font-mono">MONGODB_URI</span>{' '}
        (defaults in .env.example). Get Clerk keys at{' '}
        <a
          href="https://dashboard.clerk.com"
          className="text-blue-1 underline"
          target="_blank"
          rel="noreferrer"
        >
          dashboard.clerk.com
        </a>{' '}
        and Stream keys at{' '}
        <a
          href="https://getstream.io/dashboard"
          className="text-blue-1 underline"
          target="_blank"
          rel="noreferrer"
        >
          getstream.io/dashboard
        </a>
        .
      </p>
    </main>
  );
}
