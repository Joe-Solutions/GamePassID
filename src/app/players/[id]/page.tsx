import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentEncoder } from "@/lib/auth";
import { getPlayerById } from "@/lib/db";
import { categoryLabel, displayGameLabel } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function PlayerDetailPage({ params }: Params) {
  const { id } = await params;
  const playerId = Number(id);
  if (!playerId) notFound();

  const player = await getPlayerById(playerId);
  if (!player) notFound();

  const encoder = await getCurrentEncoder();

  return (
    <>
      <SiteHeader encoder={encoder} />
      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <Link
          href="/players"
          className="text-sm font-semibold text-[var(--fg-muted)] transition hover:text-[var(--accent)]"
        >
          ← Back to players
        </Link>

        <article className="panel license-pop mt-6 overflow-hidden">
          <div className="border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(45,212,168,0.16),transparent_55%)] px-6 py-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Official player license
            </p>
            <h1 className="display mt-2 text-3xl font-bold sm:text-4xl">
              {player.fullName}
            </h1>
            <p className="mt-1 font-mono text-lg text-[var(--accent)]">
              {player.licenseId}
            </p>
          </div>

          <div className="grid gap-8 p-6 sm:grid-cols-[220px_1fr] sm:p-8">
            <div className="overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-black/30 aspect-square">
              {player.photoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/photos/${player.photoPath}`}
                  alt={player.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-[var(--fg-muted)]">
                  No photo
                </div>
              )}
            </div>

            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                  Game
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {displayGameLabel(player)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                  Category
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {categoryLabel(player.category)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                  Status
                </dt>
                <dd className="mt-1 text-lg font-semibold capitalize text-[var(--accent)]">
                  {player.status}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                  Birthdate
                </dt>
                <dd className="mt-1 text-lg font-semibold">{player.birthdate}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                  Contact
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-[var(--fg-soft)]">
                  {player.email || "—"}
                  <br />
                  {player.phone || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                  Encoded by
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {player.encoderName || "—"}
                </dd>
              </div>
              {player.address && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                    Address
                  </dt>
                  <dd className="mt-1 text-lg font-semibold">{player.address}</dd>
                </div>
              )}
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                  Registered
                </dt>
                <dd className="mt-1 text-sm text-[var(--fg-soft)]">
                  {player.createdAt}
                </dd>
              </div>
            </dl>
          </div>
        </article>
      </main>
    </>
  );
}
