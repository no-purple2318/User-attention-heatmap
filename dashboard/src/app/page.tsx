import Link from "next/link";
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl mb-6 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-500">
          Monitor Attention.<br />Understand Users.
        </h1>
        <p className="mt-4 text-xl text-gray-500 max-w-2xl mb-10">
          The ultimate platform for playing back mouse, scroll, and eye-tracking events recorded directly from our intelligent Chrome Extension.
        </p>

        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 hover:scale-105 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Go to Dashboard
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            className="text-sm font-semibold leading-6 text-gray-900 px-8 py-3.5 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
          >
            Download Extension <span aria-hidden="true">→</span>
          </a>
        </div>
      </main>
    </div>
  );
}
