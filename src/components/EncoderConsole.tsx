"use client";

import { useState } from "react";
import Link from "next/link";
import { RegistrationForm } from "./RegistrationForm";
import { RegisteredPlayersList } from "./RegisteredPlayersList";
import { RegistrationQrShare } from "./RegistrationQrShare";
import {
  categoryLabel,
  displayGameLabel,
  type Game,
  type Player,
} from "@/lib/types";

type Tab = "register" | "list" | "qr";

type Props = {
  games: Game[];
  encoderName: string;
  recent: Player[];
  players: Player[];
};

export function EncoderConsole({
  games,
  encoderName,
  recent: initialRecent,
  players: initialPlayers,
}: Props) {
  const [tab, setTab] = useState<Tab>("register");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState(initialPlayers);
  const [recent, setRecent] = useState(initialRecent);

  function upsertPlayer(player: Player) {
    setPlayers((prev) => {
      const without = prev.filter((p) => p.id !== player.id);
      return [player, ...without].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    });
    setRecent((prev) => {
      const without = prev.filter((p) => p.id !== player.id);
      return [player, ...without].slice(0, 6);
    });
  }

  function startEdit(player: Player) {
    setEditingPlayer(player);
    setTab("register");
  }

  function clearEdit() {
    setEditingPlayer(null);
  }

  return (
    <div className="space-y-6">
      <div
        className="inline-flex max-w-full flex-wrap rounded-full border border-[var(--line-strong)] bg-black/25 p-1"
        role="tablist"
        aria-label="Encoder console sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "register"}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "register"
              ? "bg-[var(--accent)] text-[#04261c]"
              : "text-[var(--fg-soft)] hover:text-[var(--fg)]"
          }`}
          onClick={() => {
            clearEdit();
            setTab("register");
          }}
        >
          {editingPlayer ? "Edit player" : "Register new player"}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "list"}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "list"
              ? "bg-[var(--accent)] text-[#04261c]"
              : "text-[var(--fg-soft)] hover:text-[var(--fg)]"
          }`}
          onClick={() => {
            clearEdit();
            setTab("list");
          }}
        >
          List of Registered Players
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "qr"}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "qr"
              ? "bg-[var(--accent)] text-[#04261c]"
              : "text-[var(--fg-soft)] hover:text-[var(--fg)]"
          }`}
          onClick={() => {
            clearEdit();
            setTab("qr");
          }}
        >
          QR registration link
        </button>
      </div>

      {tab === "register" ? (
        <div className="space-y-6">
          <RegistrationForm
            key={editingPlayer ? `edit-${editingPlayer.id}` : "create"}
            games={games}
            encoderName={encoderName}
            initialPlayer={editingPlayer}
            onCancelEdit={() => {
              clearEdit();
              setTab("list");
            }}
            onSaved={(player) => {
              upsertPlayer(player);
              if (editingPlayer) {
                clearEdit();
                setTab("list");
              }
            }}
          />

          {!editingPlayer && (
            <section className="panel p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="display text-xl font-bold">Recent encodings</h2>
                  <p className="mt-1 text-sm text-[var(--fg-muted)]">
                    Latest players registered from this console.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm font-semibold text-[var(--accent)]"
                  onClick={() => setTab("list")}
                >
                  View all
                </button>
              </div>

              {recent.length === 0 ? (
                <p className="mt-5 text-sm text-[var(--fg-muted)]">
                  No encodings yet. Register a player above to see them here.
                </p>
              ) : (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {recent.map((player) => (
                    <li key={player.id}>
                      <Link
                        href={`/players/${player.id}`}
                        className="flex items-center gap-3 rounded-xl border border-[var(--line)] px-3 py-3 transition hover:border-[var(--line-strong)] hover:bg-white/[0.02]"
                      >
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[var(--line-strong)] bg-black/30">
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
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {player.fullName}
                          </p>
                          <p className="truncate text-xs text-[var(--fg-muted)]">
                            {player.licenseId} · {displayGameLabel(player)} ·{" "}
                            {categoryLabel(player.category)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      ) : tab === "list" ? (
        <RegisteredPlayersList
          initialPlayers={players}
          onEdit={startEdit}
          onDeleted={(playerId) => {
            setPlayers((prev) => prev.filter((p) => p.id !== playerId));
            setRecent((prev) => prev.filter((p) => p.id !== playerId));
          }}
          onUpdated={(player) => upsertPlayer(player)}
        />
      ) : (
        <RegistrationQrShare />
      )}
    </div>
  );
}
