"use client";

import { useState } from "react";
import Link from "next/link";
import {
  categoryLabel,
  displayGameLabel,
  playerCardEyebrow,
  playerIdLabel,
  statusLabel,
  type Player,
} from "@/lib/types";

const STORAGE_KEY = "rh_my_license_id";

type Mode = "playerId" | "identity";

function readSavedPlayerId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

export function MyLicenseLookup() {
  const [mode, setMode] = useState<Mode>("playerId");
  const [playerId, setPlayerId] = useState(readSavedPlayerId);
  const [fullName, setFullName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [copied, setCopied] = useState(false);

  async function lookup(payload: Record<string, string>) {
    setPending(true);
    setError(null);
    setPlayer(null);
    try {
      const res = await fetch("/api/players/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      const found = data.player as Player;
      setPlayer(found);
      window.localStorage.setItem(STORAGE_KEY, found.licenseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "playerId") {
      await lookup({ licenseId: playerId.trim() });
      return;
    }
    await lookup({ fullName: fullName.trim(), birthdate });
  }

  async function copyPlayerId() {
    if (!player) return;
    try {
      await navigator.clipboard.writeText(player.licenseId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const isLicensed = player?.status === "licensed";

  return (
    <div className="min-w-0 space-y-6">
      <form onSubmit={onSubmit} className="panel space-y-5 p-4 sm:p-6">
        <div
          className="flex w-full flex-col gap-1 rounded-2xl border border-[var(--line-strong)] bg-black/25 p-1 sm:inline-flex sm:w-auto sm:flex-row sm:rounded-full"
          role="tablist"
          aria-label="Lookup method"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "playerId"}
            className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition sm:w-auto sm:rounded-full sm:text-center ${
              mode === "playerId"
                ? "bg-[var(--accent)] text-[#04261c]"
                : "text-[var(--fg-soft)] hover:text-[var(--fg)]"
            }`}
            onClick={() => setMode("playerId")}
          >
            Registration ID
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "identity"}
            className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition sm:w-auto sm:rounded-full sm:text-center ${
              mode === "identity"
                ? "bg-[var(--accent)] text-[#04261c]"
                : "text-[var(--fg-soft)] hover:text-[var(--fg)]"
            }`}
            onClick={() => setMode("identity")}
          >
            Name + birthdate
          </button>
        </div>

        {mode === "playerId" ? (
          <div className="field max-w-md min-w-0">
            <label htmlFor="playerId">Registration ID</label>
            <input
              id="playerId"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              placeholder="EG-2026-1001"
              required
              autoComplete="off"
            />
          </div>
        ) : (
          <div className="grid max-w-xl min-w-0 gap-4 sm:grid-cols-2">
            <div className="field min-w-0 sm:col-span-2">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Dela Cruz"
                required
              />
            </div>
            <div className="field min-w-0">
              <label htmlFor="birthdate">Birthdate</label>
              <input
                id="birthdate"
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Looking up…" : "Show my registration"}
        </button>
      </form>

      {player && (
        <article className="panel license-pop overflow-hidden">
          <div className="border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(45,212,168,0.16),transparent_55%)] px-5 py-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              {playerCardEyebrow(player.status)}
            </p>
            <h2 className="display mt-2 text-3xl font-bold sm:text-4xl">
              {player.fullName}
            </h2>
            <p
              className={`mt-3 text-sm font-semibold ${
                isLicensed ? "text-[var(--accent)]" : "text-[var(--warning)]"
              }`}
            >
              {statusLabel(player.status)}
            </p>
          </div>

          <div className="grid min-w-0 gap-8 p-5 sm:grid-cols-[180px_1fr] sm:p-8">
            <div className="aspect-square overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-black/30">
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

            <div className="min-w-0 space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                  {playerIdLabel(player.status)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p className="display font-mono text-3xl font-bold text-[var(--accent)] sm:text-4xl">
                    {player.licenseId}
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost !px-3 !py-1.5 text-sm"
                    onClick={copyPlayerId}
                  >
                    {copied ? "Copied" : "Copy ID"}
                  </button>
                </div>
                {!isLicensed && (
                  <p className="mt-2 text-sm text-[var(--fg-muted)]">
                    This is your Registration ID while you are not yet licensed
                    by an encoder.
                  </p>
                )}
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                    Game
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {displayGameLabel(player)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                    Category
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {categoryLabel(player.category)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                    Status
                  </dt>
                  <dd
                    className={`mt-1 font-semibold ${
                      isLicensed
                        ? "text-[var(--accent)]"
                        : "text-[var(--warning)]"
                    }`}
                  >
                    {statusLabel(player.status)}
                  </dd>
                </div>
              </dl>

              <Link
                href={`/players/${player.id}`}
                className="btn btn-primary inline-flex"
              >
                Open full player card
              </Link>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
