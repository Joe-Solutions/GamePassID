import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentEncoder } from "@/lib/auth";
import { countPlayers, listGames } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const encoder = await getCurrentEncoder();
  const total = await countPlayers();
  const games = await listGames();

  return (
    <>
      <SiteHeader encoder={encoder} />
      <main className="relative z-10 mx-auto flex w-full max-w-[90rem] flex-1 flex-col px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
        <section className="fade-up flex min-h-[70vh] flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            EGames License System
          </p>
          <h1 className="display mt-4 max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl">
            Registration Hub
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--fg-soft)] sm:text-xl">
            Register yourself as a licensed player, or browse the official
            database of tournament athletes by game and category.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="btn btn-primary">
              Register as a player
            </Link>
            <Link href="/my-license" className="btn btn-ghost">
              Show my Registration ID
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
              <p className="mt-1">Games available for registration</p>
            </div>
          </div>
        </section>

        <section className="fade-up-delay mt-6 border-t border-[var(--line)] pt-10">
          <h2 className="display text-2xl font-bold">How registration works</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Fill in your details",
                body: "Provide your identity, choose Casual / Amateur / Student, and pick your game.",
              },
              {
                step: "02",
                title: "Add a profile photo",
                body: "Capture or upload a photo that will appear on your official license card.",
              },
              {
                step: "03",
                title: "Get your Registration ID",
                body: "A unique Registration ID is issued when you register. An encoder can later mark you as a Licensed Player.",
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
