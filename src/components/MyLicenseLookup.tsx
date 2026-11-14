"use client";

import { useState } from "react";
import Link from "next/link";
import {
  categoryLabel,
  displayGameLabel,
  type Player,
} from "@/lib/types";

const STORAGE_KEY = "rh_my_license_id";

type Mode = "licenseId" | "identity";

function readSavedLicenseId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

export function MyLicenseLookup() {
  const [mode, setMode] = useState<Mode>("licenseId");
  const [licenseId, setLicenseId] = useState(readSavedLicenseId);
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
    if (mode === "licenseId") {
      await lookup({ licenseId: licenseId.trim() });
      return;
    }
    await lookup({ fullName: fullName.trim(), birthdate });
  }

  async function copyLicenseId() {
    if (!player) return;
    try {
      await navigator.clipboard.writeText(player.licenseId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="panel space-y-5 p-5 sm:p-6">
        <div
          className="inline-flex rounded-full border border-[var(--line-strong)] bg-black/25 p-1"
          role="tablist"
          aria-label="Lookup method"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "licenseId"}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "licenseId"
                ? "bg-[var(--accent)] text-[#04261c]"
                : "text-[var(--fg-soft)] hover:text-[var(--fg)]"
            }`}
            onClick={() => setMode("licenseId")}
          >
            License ID
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "identity"}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "identity"
                ? "bg-[var(--accent)] text-[#04261c]"
                : "text-[var(--fg-soft)] hover:text-[var(--fg)]"
            }`}
            onClick={() => setMode("identity")}
          >
            Name + birthdate
          </button>
        </div>

        {mode === "licenseId" ? (
          <div className="field max-w-md">
            <label htmlFor="licenseId">License ID</label>
            <input
              id="licenseId"
              value={licenseId}
              onChange={(e) => setLicenseId(e.target.value)}
              placeholder="EG-2026-1001"
              required
              autoComplete="off"
            />
          </div>
        ) : (
          <div className="grid max-w-xl gap-4 sm:grid-cols-2">
            <div className="field sm:col-span-2">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Dela Cruz"
                required
              />
            </div>
            <div className="field">
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
          {pending ? "Looking up…" : "Show my license"}
        </button>
      </form>

      {player && (
        <article className="panel license-pop overflow-hidden">
          <div className="border-b border-[var(--line)] bg-[linear-gradient(120deg,rgba(45,212,168,0.16),transparent_55%)] px-6 py-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Registered player
            </p>
            <h2 className="display mt-2 text-3xl font-bold sm:text-4xl">
              {player.fullName}
            </h2>
            <p className="mt-3 text-sm text-[var(--fg-muted)]">
              You are already registered in Registration Hub.
            </p>
          </div>

          <div className="grid gap-8 p-6 sm:grid-cols-[180px_1fr] sm:p-8">
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

            <div className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                  License ID
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p className="display font-mono text-3xl font-bold text-[var(--accent)] sm:text-4xl">
                    {player.licenseId}
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost !px-3 !py-1.5 text-sm"
                    onClick={copyLicenseId}
                  >
                    {copied ? "Copied" : "Copy ID"}
                  </button>
                </div>
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
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                    Status
                  </dt>
                  <dd className="mt-1 font-semibold capitalize text-[var(--accent)]">
                    {player.status}
                  </dd>
                </div>
              </dl>

              <Link
                href={`/players/${player.id}`}
                className="btn btn-primary inline-flex"
              >
                Open full license card
              </Link>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
