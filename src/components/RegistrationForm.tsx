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

type Props = {
  games: Game[];
  encoderName: string;
  initialPlayer?: Player | null;
  onCancelEdit?: () => void;
  onSaved?: (player: Player) => void;
};

export function RegistrationForm({
  games,
  encoderName,
  initialPlayer = null,
  onCancelEdit,
  onSaved,
}: Props) {
  const isEditing = Boolean(initialPlayer);

  const [fullName, setFullName] = useState(initialPlayer?.fullName ?? "");
  const [birthdate, setBirthdate] = useState(initialPlayer?.birthdate ?? "");
  const [email, setEmail] = useState(initialPlayer?.email ?? "");
  const [phone, setPhone] = useState(initialPlayer?.phone ?? "");
  const [address, setAddress] = useState(initialPlayer?.address ?? "");
  const [category, setCategory] = useState<PlayerCategory | "">(
    initialPlayer?.category ?? "",
  );
  const [gameId, setGameId] = useState<number | "">(
    initialPlayer?.gameId ?? "",
  );
  const [gameOther, setGameOther] = useState(initialPlayer?.gameOther ?? "");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialPlayer?.photoPath
      ? `/api/photos/${initialPlayer.photoPath}`
      : null,
  );
  const [existingPhoto, setExistingPhoto] = useState(
    Boolean(initialPlayer?.photoPath),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Player | null>(null);

  const selectedGame = useMemo(
    () => games.find((game) => game.id === gameId) ?? null,
    [gameId, games],
  );
  const isOthers = selectedGame?.slug === OTHERS_GAME_SLUG;

  const hasPhoto = Boolean(photoBlob || existingPhoto);

  const canSubmit = useMemo(() => {
    if (!fullName || !birthdate || !category || !gameId || !hasPhoto || submitting) {
      return false;
    }
    if (isOthers && !gameOther.trim()) return false;
    return true;
  }, [
    fullName,
    birthdate,
    category,
    gameId,
    hasPhoto,
    submitting,
    isOthers,
    gameOther,
  ]);

  function clearPhoto() {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPhotoBlob(null);
    setPreviewUrl(null);
    setExistingPhoto(false);
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
    if (!canSubmit || !category || !gameId) return;

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
      if (photoBlob) {
        body.set("photo", photoBlob, "profile.jpg");
      }

      const res = await fetch(
        isEditing ? `/api/players/${initialPlayer!.id}` : "/api/players",
        {
          method: isEditing ? "PATCH" : "POST",
          body,
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isEditing ? "Update failed" : "Registration failed"),
        );
      }

      const player = data.player as Player;
      onSaved?.(player);

      if (!isEditing) {
        setCreated(player);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditing
            ? "Update failed"
            : "Registration failed",
      );
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

  if (created) {
    return (
      <div className="panel license-pop p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Player registered
        </p>
        <h2 className="display mt-3 text-3xl font-bold sm:text-4xl">
          {created.fullName}
        </h2>
        <p className="mt-2 text-[var(--fg-muted)]">
          Encoded by {encoderName}. Player is now in the licensed database.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-[160px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-black/30 aspect-square">
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
              <dt className="text-[var(--fg-muted)]">License ID</dt>
              <dd className="display mt-1 text-xl font-bold text-[var(--accent)]">
                {created.licenseId}
              </dd>
            </div>
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
          <button type="button" className="btn btn-primary" onClick={resetForm}>
            Register another player
          </button>
          <Link href={`/players/${created.id}`} className="btn btn-ghost">
            View license card
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {isEditing && (
        <div className="panel flex flex-wrap items-center justify-between gap-3 border-[rgba(45,212,168,0.25)] bg-[var(--accent-dim)] p-4 sm:px-5">
          <div>
            <p className="text-sm font-semibold text-[var(--accent)]">
              Editing {initialPlayer?.fullName}
            </p>
            <p className="mt-0.5 font-mono text-xs text-[var(--fg-muted)]">
              {initialPlayer?.licenseId}
            </p>
          </div>
          {onCancelEdit && (
            <button
              type="button"
              className="btn btn-ghost !px-4 !py-2 text-sm"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="panel flex h-full flex-col gap-5 p-5 sm:p-6 fade-up">
          <div>
            <h2 className="display text-2xl font-bold">Player identity</h2>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              {isEditing
                ? "Update the player details on file."
                : "Enter the player details before tournament play."}
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
              Select the specific game this license covers.
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
              {isEditing
                ? "Keep the current photo or capture a new one."
                : "Capture a live photo for the player license card."}
            </p>
          </div>
          <PhotoCapture
            value={photoBlob}
            previewUrl={previewUrl}
            onCapture={(blob, url) => {
              if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
              }
              setPhotoBlob(blob);
              setPreviewUrl(url);
              setExistingPhoto(false);
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
        <p className="text-sm text-[var(--fg-muted)]">
          Signed in as {encoderName}
        </p>
        {isEditing && onCancelEdit && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          {submitting
            ? isEditing
              ? "Saving…"
              : "Registering…"
            : isEditing
              ? "Save changes"
              : "Register new player"}
        </button>
      </div>
    </form>
  );
}
