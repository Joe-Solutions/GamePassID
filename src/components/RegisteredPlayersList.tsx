"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  categoryLabel,
  displayGameLabel,
  type Player,
} from "@/lib/types";

type Props = {
  initialPlayers: Player[];
  onEdit: (player: Player) => void;
  onDeleted: (playerId: number) => void;
};

export function RegisteredPlayersList({
  initialPlayers,
  onEdit,
  onDeleted,
}: Props) {
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState(initialPlayers);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setPlayers(initialPlayers);
  }, [initialPlayers]);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setPending(true);
      try {
        setError(null);
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        const res = await fetch(`/api/players?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load players");
        if (!cancelled) setPlayers(data.players as Player[]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load players");
        }
      } finally {
        if (!cancelled) setPending(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query]);

  async function onDelete(player: Player) {
    const confirmed = window.confirm(
      `Delete ${player.fullName} (${player.licenseId})? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(player.id);
    setError(null);
    try {
      const res = await fetch(`/api/players/${player.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not delete player");
      }
      setPlayers((prev) => prev.filter((p) => p.id !== player.id));
      onDeleted(player.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete player");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5 fade-up">
      <div className="panel p-5 sm:p-6">
        <div className="field max-w-xl">
          <label htmlFor="registeredPlayerSearch">Search registered players</label>
          <input
            id="registeredPlayerSearch"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, license ID, email, or other game"
            autoComplete="off"
          />
        </div>
        <p className="mt-3 text-sm text-[var(--fg-muted)]">
          {pending
            ? "Searching…"
            : `${players.length} player${players.length === 1 ? "" : "s"} found`}
        </p>
        {error && <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
      </div>

      <div
        className={`overflow-hidden rounded-[var(--radius)] border border-[var(--line)] ${
          pending ? "opacity-70" : ""
        }`}
      >
        <div className="hidden grid-cols-[1.3fr_0.7fr_0.85fr_0.75fr_0.55fr_0.9fr] gap-3 border-b border-[var(--line)] bg-white/[0.02] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--fg-muted)] sm:grid">
          <span>Player</span>
          <span>License</span>
          <span>Game</span>
          <span>Category</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {players.length === 0 ? (
          <p className="px-4 py-10 text-center text-[var(--fg-muted)]">
            No registered players match this search.
          </p>
        ) : (
          <ul>
            {players.map((player) => (
              <li
                key={player.id}
                className="border-b border-[var(--line)] last:border-b-0"
              >
                <div className="grid gap-3 px-4 py-4 sm:grid-cols-[1.3fr_0.7fr_0.85fr_0.75fr_0.55fr_0.9fr] sm:items-center sm:gap-3">
                  <Link
                    href={`/players/${player.id}`}
                    className="flex items-center gap-3 transition hover:opacity-90"
                  >
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
                  </Link>
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
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost !px-3 !py-1.5 text-sm"
                      onClick={() => onEdit(player)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn !border-[rgba(240,113,120,0.45)] !px-3 !py-1.5 text-sm text-[var(--danger)] hover:!bg-[rgba(240,113,120,0.08)]"
                      disabled={deletingId === player.id}
                      onClick={() => onDelete(player)}
                    >
                      {deletingId === player.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
