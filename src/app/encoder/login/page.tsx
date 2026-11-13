import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentEncoder } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EncoderLoginPage() {
  const encoder = await getCurrentEncoder();
  if (encoder) redirect("/encoder");

  return (
    <>
      <SiteHeader />
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="fade-up w-full flex justify-center">
          <LoginForm />
        </div>
      </main>
    </>
  );
}
