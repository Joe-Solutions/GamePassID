import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { MyLicenseLookup } from "@/components/MyLicenseLookup";
import { getCurrentEncoder } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MyLicensePage() {
  const encoder = await getCurrentEncoder();

  return (
    <>
      <SiteHeader encoder={encoder} />
      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <div className="fade-up mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Already registered?
          </p>
          <h1 className="display mt-2 text-4xl font-bold tracking-tight">
            Show my license ID
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--fg-muted)]">
            Look up your registration with your license ID, or your full name
            and birthdate, to prove you are already in Registration Hub.
          </p>
          <p className="mt-3 text-sm text-[var(--fg-soft)]">
            New here?{" "}
            <Link
              href="/register"
              className="font-semibold text-[var(--accent)] hover:underline"
            >
              Register as a player
            </Link>
          </p>
        </div>

        <MyLicenseLookup />
      </main>
    </>
  );
}
