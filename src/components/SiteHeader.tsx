import Link from "next/link";
import type { Encoder } from "@/lib/types";

export function SiteHeader({ encoder }: { encoder?: Encoder | null }) {
  return (
    <header className="relative z-10 border-b border-[var(--line)]">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accent-dim)] text-[var(--accent)] ring-1 ring-[rgba(45,212,168,0.35)]">
            <span className="display text-sm font-bold">RH</span>
          </span>
          <div className="min-w-0">
            <p className="display truncate text-lg font-bold leading-none tracking-tight">
              Registration Hub
            </p>
            <p className="mt-1 truncate text-xs text-[var(--fg-muted)]">
              Licensed players database
            </p>
          </div>
        </Link>

        <nav className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
          <Link
            href="/register"
            className="btn btn-primary !px-3 !py-2 text-sm"
          >
            Register
          </Link>
          <Link
            href="/my-license"
            className="btn btn-ghost !px-3 !py-2 text-sm"
          >
            My License
          </Link>
          <Link
            href="/players"
            className="btn btn-ghost !px-3 !py-2 text-sm"
          >
            <span className="sm:hidden">Browse</span>
            <span className="hidden sm:inline">Browse Licenses</span>
          </Link>
          {encoder ? (
            <Link
              href="/encoder"
              className="btn btn-ghost !px-3 !py-2 text-sm"
            >
              <span className="sm:hidden">Encoder</span>
              <span className="hidden sm:inline">Encoder Console</span>
            </Link>
          ) : (
            <Link
              href="/encoder/login"
              className="btn btn-ghost !px-3 !py-2 text-sm"
            >
              <span className="sm:hidden">Login</span>
              <span className="hidden sm:inline">Encoder Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
