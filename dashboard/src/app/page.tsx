import Link from "next/link";
export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center z-10">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium tracking-wide">
          Attention Tracking Revolutionized
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-500 drop-shadow-sm">
          Monitor Attention.<br />Understand Users.
        </h1>

        <p className="mt-4 text-lg md:text-xl text-slate-400 max-w-2xl mb-12 font-light leading-relaxed">
          The ultimate platform for playing back mouse, scroll, and eye-tracking events recorded directly from our intelligent Chrome Extension.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="group relative flex justify-center items-center rounded-full bg-blue-600 px-8 py-4 text-sm font-semibold text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:scale-105 transition-all duration-300"
          >
            Go to Dashboard
            <span className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">&rarr;</span>
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            className="flex justify-center items-center text-sm font-semibold leading-6 text-slate-300 px-8 py-4 border border-slate-700/60 rounded-full hover:bg-slate-800/50 hover:text-white transition-all backdrop-blur-sm"
          >
            Download Extension
          </a>
        </div>
      </main>

      <footer className="py-6 text-center text-slate-500 text-sm z-10 backdrop-blur-md bg-[#0f172a]/80 border-t border-slate-800/50">
        &copy; {new Date().getFullYear()} Heatmap Tracker. All rights reserved.
      </footer>
    </div>
  );
}
