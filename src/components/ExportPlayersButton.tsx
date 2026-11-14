"use client";

import { useState } from "react";

export function ExportPlayersButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/players/export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not export player list.");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "players.xlsx";

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not export player list.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        className="btn btn-primary"
        onClick={onExport}
        disabled={pending}
      >
        {pending ? "Exporting…" : "Export Player List to Excel"}
      </button>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
