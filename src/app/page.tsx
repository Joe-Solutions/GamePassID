import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentEncoder } from "@/lib/auth";
import { countPlayers, listGames } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const encoder = await getCurrentEncoder();
  const total = countPlayers();
  const games = listGames();

  return (
    <>
      <SiteHeader encoder={encoder} />
      <main className="relative z-10 mx-auto flex w-full max-w-[90rem] flex-1 flex-col px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
        <section className="fade-up min-h-[70vh] flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            EGames License System
          </p>
          <h1 className="display mt-4 max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl">
            Registration Hub
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--fg-soft)] sm:text-xl">
            The official database of licensed players. Encoders register
            athletes by game, category, and profile photo before tournament
            play.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={encoder ? "/encoder" : "/encoder/login"}
              className="btn btn-primary"
            >
              {encoder ? "Open encoder console" : "Encoder login"}
            </Link>
            <Link href="/players" className="btn btn-ghost">
              Browse licensed players
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap gap-x-10 gap-y-4 text-sm text-[var(--fg-muted)]">
            <div>
              <p className="display text-3xl font-bold text-[var(--fg)]">{total}</p>
              <p className="mt-1">Licensed players on file</p>
            </div>
            <div>
              <p className="display text-3xl font-bold text-[var(--fg)]">
                {games.length}
              </p>
              <p className="mt-1">Games available for encoding</p>
            </div>
          </div>
        </section>

        <section className="fade-up-delay mt-6 border-t border-[var(--line)] pt-10">
          <h2 className="display text-2xl font-bold">How encoding works</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Sign in as encoder",
                body: "Only authorized encoders can create or update player licenses.",
              },
              {
                step: "02",
                title: "Capture player details",
                body: "Record identity, choose Casual / Amateur / Student, pick the game, and take a profile photo.",
              },
              {
                step: "03",
                title: "Issue the license",
                body: "A unique license ID is generated and the player appears in the licensed database.",
              },
            ].map((item) => (
              <li key={item.step}>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent)]">
                  {item.step}
                </p>
                <h3 className="display mt-2 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
