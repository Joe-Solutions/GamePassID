"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { PLAYER_CATEGORIES, type Game } from "@/lib/types";

export function PlayersFilters({ games }: { games: Game[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.push(`/players?${params.toString()}`);
    });
  }

  return (
    <div
      className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${pending ? "opacity-70" : ""}`}
    >
      <div className="field">
        <label htmlFor="q">Search</label>
        <input
          id="q"
          defaultValue={searchParams.get("q") ?? ""}
          placeholder="Name or registration ID"
          onChange={(e) => update("q", e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="gameId">Game</label>
        <select
          id="gameId"
          defaultValue={searchParams.get("gameId") ?? ""}
          onChange={(e) => update("gameId", e.target.value)}
        >
          <option value="">All games</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          defaultValue={searchParams.get("category") ?? ""}
          onChange={(e) => update("category", e.target.value)}
        >
          <option value="">All categories</option>
          {PLAYER_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="registered">Not yet licensed</option>
          <option value="licensed">Licensed Player</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
}
