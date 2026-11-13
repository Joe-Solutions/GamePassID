import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { EncoderConsole } from "@/components/EncoderConsole";
import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentEncoder } from "@/lib/auth";
import { getRecentPlayers, listGames, listPlayers } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EncoderConsolePage() {
  const encoder = await getCurrentEncoder();
  if (!encoder) redirect("/encoder/login");

  const games = await listGames();
  const recent = await getRecentPlayers(6);
  const players = await listPlayers();

  return (
    <>
      <SiteHeader encoder={encoder} />
      <main className="relative z-10 mx-auto w-full max-w-[90rem] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 fade-up">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Encoder console
            </p>
            <h1 className="display mt-2 text-4xl font-bold tracking-tight">
              Encode a player
            </h1>
            <p className="mt-2 max-w-2xl text-[var(--fg-muted)]">
              Welcome, {encoder.displayName}. Register players or search the
              licensed player list.
            </p>
          </div>
          <LogoutButton />
        </div>

        <EncoderConsole
          games={games}
          encoderName={encoder.displayName}
          recent={recent}
          players={players}
        />
      </main>
    </>
  );
}
