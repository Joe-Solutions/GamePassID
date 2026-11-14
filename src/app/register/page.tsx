import { SiteHeader } from "@/components/SiteHeader";
import { SelfRegistrationForm } from "@/components/SelfRegistrationForm";
import { getCurrentEncoder } from "@/lib/auth";
import { listGames } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const encoder = await getCurrentEncoder();
  const games = await listGames();

  return (
    <>
      <SiteHeader encoder={encoder} />
      <main className="relative z-10 mx-auto w-full max-w-[90rem] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <div className="fade-up mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Player registration
          </p>
          <h1 className="display mt-2 text-4xl font-bold tracking-tight">
            Register yourself
          </h1>
          <p className="mt-2 text-[var(--fg-muted)]">
            Create your player license with your details, category, game, and
            profile photo. No encoder login required.
          </p>
        </div>

        <SelfRegistrationForm games={games} />
      </main>
    </>
  );
}
