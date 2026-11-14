import Link from "next/link";
import type { Encoder } from "@/lib/types";

export function SiteHeader({ encoder }: { encoder?: Encoder | null }) {
  return (
    <header className="relative z-10 border-b border-[var(--line)]">
      <div className="mx-auto flex w-full max-w-[90rem] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-dim)] text-[var(--accent)] ring-1 ring-[rgba(45,212,168,0.35)]">
            <span className="display text-sm font-bold">RH</span>
          </span>
          <div>
            <p className="display text-lg font-bold leading-none tracking-tight">
              Registration Hub
            </p>
            <p className="mt-1 text-xs text-[var(--fg-muted)]">
              Licensed players database
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link href="/register" className="btn btn-primary !px-3 !py-2 text-sm">
            Register
          </Link>
          <Link href="/my-license" className="btn btn-ghost !px-3 !py-2 text-sm">
            My License
          </Link>
          <Link href="/players" className="btn btn-ghost !px-3 !py-2 text-sm">
            Browse Licenses
          </Link>
          {encoder ? (
            <Link href="/encoder" className="btn btn-ghost !px-3 !py-2 text-sm">
              Encoder Console
            </Link>
          ) : (
            <Link
              href="/encoder/login"
              className="btn btn-ghost !px-3 !py-2 text-sm"
            >
              Encoder Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
