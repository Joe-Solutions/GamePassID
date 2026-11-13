import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { PlayersFilters } from "@/components/PlayersFilters";
import { getCurrentEncoder } from "@/lib/auth";
import { listGames, listPlayers } from "@/lib/db";
import {
  categoryLabel,
  displayGameLabel,
  type PlayerCategory,
  type PlayerStatus,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  gameId?: string;
  category?: string;
  status?: string;
}>;

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const encoder = await getCurrentEncoder();
  const games = listGames();
  const players = listPlayers({
    q: params.q,
    gameId: params.gameId ? Number(params.gameId) : undefined,
    category: (params.category as PlayerCategory | undefined) || undefined,
    status: (params.status as PlayerStatus | undefined) || undefined,
  });

  return (
    <>
      <SiteHeader encoder={encoder} />
      <main className="relative z-10 mx-auto w-full max-w-[90rem] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <div className="fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Licensed database
          </p>
          <h1 className="display mt-2 text-4xl font-bold tracking-tight">
            Players
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--fg-muted)]">
            Search and filter every licensed player registered for tournament
            play.
          </p>
        </div>

        <div className="panel mt-8 p-5 fade-up-delay">
          <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-white/5" />}>
            <PlayersFilters games={games} />
          </Suspense>
        </div>

        <div className="mt-6 overflow-hidden rounded-[var(--radius)] border border-[var(--line)]">
          <div className="hidden grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr_0.7fr] gap-3 border-b border-[var(--line)] bg-white/[0.02] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--fg-muted)] sm:grid">
            <span>Player</span>
            <span>License</span>
            <span>Game</span>
            <span>Category</span>
            <span>Status</span>
          </div>

          {players.length === 0 ? (
            <p className="px-4 py-10 text-center text-[var(--fg-muted)]">
              No players match these filters.
            </p>
          ) : (
            <ul>
              {players.map((player) => (
                <li key={player.id} className="border-b border-[var(--line)] last:border-b-0">
                  <Link
                    href={`/players/${player.id}`}
                    className="grid gap-2 px-4 py-4 transition hover:bg-white/[0.02] sm:grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr_0.7fr] sm:items-center sm:gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 overflow-hidden rounded-full border border-[var(--line-strong)] bg-black/30">
                        {player.photoPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/photos/${player.photoPath}`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-xs text-[var(--fg-muted)]">
                            {player.fullName.slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{player.fullName}</p>
                        <p className="text-xs text-[var(--fg-muted)] sm:hidden">
                          {player.licenseId}
                        </p>
                      </div>
                    </div>
                    <p className="hidden font-mono text-sm text-[var(--accent)] sm:block">
                      {player.licenseId}
                    </p>
                    <p className="text-sm text-[var(--fg-soft)]">
                      {displayGameLabel(player)}
                    </p>
                    <p className="text-sm text-[var(--fg-soft)]">
                      {categoryLabel(player.category)}
                    </p>
                    <p className="text-sm capitalize text-[var(--accent)]">
                      {player.status}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
