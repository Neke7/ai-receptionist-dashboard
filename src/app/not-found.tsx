import Link from "next/link";
import { ArrowLeft, Home, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0b10] px-4 text-foreground">
      {/* Ambient glows — match the landing hero */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
          <Sparkles className="h-5 w-5 text-white" />
        </div>

        <div className="mt-6 text-xs font-medium uppercase tracking-wider text-indigo-300">
          Error 404
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you were looking for has moved, been retired, or never
          existed. Let&apos;s get you back on track.
        </p>

        <div className="mt-7 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-indigo-500"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
          <Link
            href="/landing"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <ArrowLeft className="h-4 w-4" />
            Visit the marketing site
          </Link>
        </div>
      </div>
    </div>
  );
}
