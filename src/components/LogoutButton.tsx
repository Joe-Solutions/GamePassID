"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/encoder/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn btn-ghost !px-3 !py-2 text-sm"
      onClick={logout}
      disabled={loading}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
