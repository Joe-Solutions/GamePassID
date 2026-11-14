"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PhotoCapture } from "./PhotoCapture";
import {
  OTHERS_GAME_SLUG,
  PLAYER_CATEGORIES,
  displayGameLabel,
  type Game,
  type Player,
  type PlayerCategory,
} from "@/lib/types";

const STORAGE_KEY = "rh_my_license_id";

type Props = {
  games: Game[];
};

export function SelfRegistrationForm({ games }: Props) {
  const [fullName, setFullName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<PlayerCategory | "">("");
  const [gameId, setGameId] = useState<number | "">("");
  const [gameOther, setGameOther] = useState("");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Player | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedGame = useMemo(
    () => games.find((game) => game.id === gameId) ?? null,
    [gameId, games],
  );
  const isOthers = selectedGame?.slug === OTHERS_GAME_SLUG;

  const canSubmit = useMemo(() => {
    if (!fullName || !birthdate || !category || !gameId || !photoBlob || submitting) {
      return false;
    }
    if (isOthers && !gameOther.trim()) return false;
    return true;
  }, [
    fullName,
    birthdate,
    category,
    gameId,
    photoBlob,
    submitting,
    isOthers,
    gameOther,
  ]);

  function clearPhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPhotoBlob(null);
    setPreviewUrl(null);
  }

  function onGameChange(value: string) {
    const nextId = value ? Number(value) : "";
    setGameId(nextId);
    const next = games.find((game) => game.id === nextId);
    if (next?.slug !== OTHERS_GAME_SLUG) {
      setGameOther("");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !photoBlob || !category || !gameId) return;

    setSubmitting(true);
    setError(null);

    try {
      const body = new FormData();
      body.set("fullName", fullName.trim());
      body.set("birthdate", birthdate);
      body.set("email", email.trim());
      body.set("phone", phone.trim());
      body.set("address", address.trim());
      body.set("category", category);
      body.set("gameId", String(gameId));
      body.set("gameOther", isOthers ? gameOther.trim() : "");
      body.set("photo", photoBlob, "profile.jpg");

      const res = await fetch("/api/register", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }
      const player = data.player as Player;
      setCreated(player);
      window.localStorage.setItem(STORAGE_KEY, player.licenseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setFullName("");
    setBirthdate("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCategory("");
    setGameId("");
    setGameOther("");
    clearPhoto();
    setCreated(null);
    setError(null);
  }

  async function copyLicenseId() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.licenseId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  if (created) {
    return (
      <div className="panel license-pop p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          You are registered
        </p>
        <h2 className="display mt-3 text-3xl font-bold sm:text-4xl">
          {created.fullName}
        </h2>
        <p className="mt-2 text-[var(--fg-muted)]">
          Keep this license ID. You can show it anytime to prove you are already
          in Registration Hub.
        </p>

        <div className="mt-6 rounded-2xl border border-[rgba(45,212,168,0.35)] bg-[var(--accent-dim)] px-5 py-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--fg-muted)]">
            Your license ID
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="display font-mono text-3xl font-bold text-[var(--accent)] sm:text-4xl">
              {created.licenseId}
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

        <div className="mt-6 grid gap-6 sm:grid-cols-[160px_1fr]">
          <div className="aspect-square overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-black/30">
            {created.photoPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/photos/${created.photoPath}`}
                alt={created.fullName}
                className="h-full w-full object-cover"
              />
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={created.fullName}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--fg-muted)]">Game</dt>
              <dd className="mt-1 font-semibold">{displayGameLabel(created)}</dd>
            </div>
            <div>
              <dt className="text-[var(--fg-muted)]">Category</dt>
              <dd className="mt-1 font-semibold capitalize">
                {created.category} player
              </dd>
            </div>
            <div>
              <dt className="text-[var(--fg-muted)]">Status</dt>
              <dd className="mt-1 font-semibold capitalize text-[var(--accent)]">
                {created.status}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/players/${created.id}`} className="btn btn-primary">
            View my license card
          </Link>
          <Link href="/my-license" className="btn btn-ghost">
            Show my ID later
          </Link>
          <button type="button" className="btn btn-ghost" onClick={resetForm}>
            Register another player
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="panel flex h-full flex-col gap-5 p-5 sm:p-6 fade-up">
          <div>
            <h2 className="display text-2xl font-bold">Your details</h2>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              Enter your identity so we can issue your player license.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field sm:col-span-2">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Juan Dela Cruz"
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
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09XXXXXXXXX"
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@email.com"
              />
            </div>
            <div className="field">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="City / Municipality"
              />
            </div>
          </div>
        </section>

        <section className="panel flex h-full flex-col gap-5 p-5 sm:p-6 fade-up-delay">
          <div>
            <h2 className="display text-2xl font-bold">Player category</h2>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              Choose Casual, Amateur, or Student.
            </p>
          </div>

          <div className="grid gap-3">
            {PLAYER_CATEGORIES.map((item) => {
              const selected = category === item.value;
              return (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                    selected
                      ? "border-[rgba(45,212,168,0.55)] bg-[var(--accent-dim)]"
                      : "border-[var(--line-strong)] hover:border-[rgba(45,212,168,0.3)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={item.value}
                    checked={selected}
                    onChange={() => setCategory(item.value)}
                    className="mt-1 accent-[var(--accent)]"
                    required
                  />
                  <span>
                    <span className="block font-semibold">{item.label}</span>
                    <span className="mt-0.5 block text-sm text-[var(--fg-muted)]">
                      {item.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section className="panel flex h-full flex-col gap-5 p-5 sm:p-6">
          <div>
            <h2 className="display text-2xl font-bold">Game registration</h2>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              Select the game this license covers.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="field">
              <label htmlFor="gameId">Game</label>
              <select
                id="gameId"
                value={gameId}
                onChange={(e) => onGameChange(e.target.value)}
                required
              >
                <option value="">Select a game</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            {isOthers && (
              <div className="field">
                <label htmlFor="gameOther">Specify other game</label>
                <input
                  id="gameOther"
                  value={gameOther}
                  onChange={(e) => setGameOther(e.target.value)}
                  required
                  placeholder="Enter the game name"
                />
              </div>
            )}
          </div>
        </section>

        <section className="panel flex h-full flex-col gap-5 p-5 sm:p-6">
          <div>
            <h2 className="display text-2xl font-bold">Profile photo</h2>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              Capture or upload a photo for your license card.
            </p>
          </div>
          <PhotoCapture
            value={photoBlob}
            previewUrl={previewUrl}
            onCapture={(blob, url) => {
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPhotoBlob(blob);
              setPreviewUrl(url);
            }}
            onClear={clearPhoto}
          />
        </section>
      </div>

      {error && (
        <p className="rounded-xl border border-[rgba(240,113,120,0.35)] bg-[rgba(240,113,120,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          {submitting ? "Submitting…" : "Register now"}
        </button>
      </div>
    </form>
  );
}
